import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { SuiService } from './services/sui.service';
import { GameService } from './services/game.service';
import { RecoveryService } from './services/recovery.service';
import { LoggingService } from './services/logging.service';
import { MetricsService } from './services/metrics.service';
import { GameMode, GameStatus } from './models/game.model';
import { DatabaseService } from './services/database.service';
import { supabase } from './config/supabase';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Initialize services
const loggingService = new LoggingService();
const dbService = new DatabaseService(supabase, loggingService);
const suiService = new SuiService(loggingService);
const gameService = new GameService(dbService, suiService);
const recoveryService = new RecoveryService(gameService, dbService, suiService);
const metricsService = new MetricsService(dbService);

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter); // Apply rate limiting to all API routes
app.use('/api/players/register', authLimiter); // Stricter rate limiting for registration

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsService.trackResponseTime(duration);
    loggingService.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration
    });
  });
  next();
});

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Player registration validation
const registerValidation = [
  body('walletAddress').isString().isLength({ min: 42, max: 42 }),
  body('signature').isString(),
  body('username').optional().isString().isLength({ min: 3, max: 20 }),
  validate
];

// Game room creation validation
const createRoomValidation = [
  body('mode').isIn(Object.values(GameMode)),
  validate
];

// Join room validation
const joinRoomValidation = [
  body('roomId').isString(),
  body('walletAddress').isString().isLength({ min: 42, max: 42 }),
  body('signature').isString(),
  validate
];

// Game action validation
const gameActionValidation = [
  body('roomId').isString(),
  body('action').isString(),
  body('payload').isObject(),
  validate
];

// Player stats validation
const playerStatsValidation = [
  param('walletAddress').isString().isLength({ min: 42, max: 42 }),
  validate
];

// Leaderboard validation
const leaderboardValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
];

// Game mode leaderboard validation
const gameModeLeaderboardValidation = [
  param('gameMode').isIn(Object.values(GameMode)),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
];

// Socket.IO connection handling
io.on('connection', (socket) => {
  loggingService.info('Client connected', { socketId: socket.id });

  // Handle player registration
  socket.on('registerPlayer', async (data: { walletAddress: string, signature: string, username?: string }) => {
    const start = Date.now();
    try {
      // Validate data
      const errors = validationResult({ body: data });
      if (!errors.isEmpty()) {
        loggingService.warn('Invalid registration data', { errors: errors.array() });
        socket.emit('error', { message: 'Invalid input data', errors: errors.array() });
        return;
      }

      // Verify wallet ownership
      const isValid = await suiService.verifyWalletOwnership(data.walletAddress, data.signature);
      if (!isValid) {
        loggingService.warn('Invalid wallet signature', { walletAddress: data.walletAddress });
        socket.emit('error', { message: 'Invalid wallet signature' });
        return;
      }

      // Register player
      const player = await gameService.registerPlayer(data.walletAddress, data.username);
      await metricsService.updateTotalPlayers();
      loggingService.info('Player registered successfully', { player });
      socket.emit('playerRegistered', player);
    } catch (error) {
      loggingService.error('Error registering player', error as Error, { data });
      socket.emit('error', { message: 'Failed to register player' });
    } finally {
      metricsService.trackResponseTime(Date.now() - start);
    }
  });

  // Handle game room creation
  socket.on('createRoom', async (data: { mode: GameMode }) => {
    try {
      // Validate data
      const errors = validationResult({ body: data });
      if (!errors.isEmpty()) {
        socket.emit('error', { message: 'Invalid input data', errors: errors.array() });
        return;
      }

      const roomId = await gameService.createGameRoom(data.mode);
      socket.join(roomId);
      socket.emit('roomCreated', { roomId });
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create game room' });
    }
  });

  // Handle joining game room
  socket.on('joinRoom', async (data: { roomId: string, walletAddress: string, signature: string }) => {
    try {
      // Validate data
      const errors = validationResult({ body: data });
      if (!errors.isEmpty()) {
        socket.emit('error', { message: 'Invalid input data', errors: errors.array() });
        return;
      }

      // Verify wallet ownership
      const isValid = await suiService.verifyWalletOwnership(data.walletAddress, data.signature);
      if (!isValid) {
        socket.emit('error', { message: 'Invalid wallet signature' });
        return;
      }

      // Join room
      await gameService.joinGameRoom(data.roomId, data.walletAddress);
      socket.join(data.roomId);
      socket.emit('roomJoined', { roomId: data.roomId });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join game room' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    loggingService.info('Client disconnected', { socketId: socket.id });
    const rooms = Array.from(socket.rooms);
    for (const roomId of rooms) {
      if (roomId !== socket.id) {
        try {
          const gameState = await gameService.getGameState(roomId);
          if (gameState && gameState.status === GameStatus.IN_PROGRESS) {
            loggingService.logRecoveryEvent('disconnection', roomId, { socketId: socket.id });
            await recoveryService.recoverGameState(roomId);
          }
        } catch (error) {
          loggingService.error('Error handling disconnection', error as Error, { roomId, socketId: socket.id });
        }
      }
    }
  });

  // Handle reconnection
  socket.on('reconnect', async (data: { roomId: string, walletAddress: string }) => {
    try {
      await recoveryService.handleReconnection(data.roomId, data.walletAddress);
      socket.join(data.roomId);
      socket.emit('reconnected', { roomId: data.roomId });
    } catch (error) {
      console.error('Error handling reconnection:', error);
      socket.emit('error', { message: 'Failed to reconnect to game room' });
    }
  });

  // Handle game actions
  socket.on('gameAction', async (data: { roomId: string, action: string, payload: any }) => {
    try {
      const result = await gameService.handleGameAction(data.roomId, data.action, data.payload);
      io.to(data.roomId).emit('gameUpdate', result);
    } catch (error) {
      console.error('Error handling game action:', error);
      socket.emit('error', { message: 'Failed to process game action' });
      
      // Attempt to recover from error
      try {
        await recoveryService.retryTransaction(data.roomId, data.payload.playerId, data.action);
      } catch (retryError) {
        console.error('Error retrying transaction:', retryError);
      }
    }
  });
});

// REST API routes
app.get('/api/rooms', async (req: Request, res: Response) => {
  try {
    const rooms = await gameService.getAllGameRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game rooms' });
  }
});

// Player statistics endpoints
app.get('/api/players/:walletAddress', playerStatsValidation, async (req: Request, res: Response) => {
  try {
    const player = await gameService.getPlayerStats(req.params.walletAddress);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

app.get('/api/players/:walletAddress/rank', playerStatsValidation, async (req: Request, res: Response) => {
  try {
    const rank = await gameService.getPlayerRank(req.params.walletAddress);
    res.json({ rank });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player rank' });
  }
});

// Leaderboard endpoints
app.get('/api/leaderboard', leaderboardValidation, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const leaderboard = await gameService.getLeaderboard(limit, offset);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/leaderboard/:gameMode', gameModeLeaderboardValidation, async (req: Request, res: Response) => {
  try {
    const gameMode = req.params.gameMode as GameMode;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const leaderboard = await gameService.getLeaderboardByGameMode(gameMode, limit, offset);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game mode leaderboard' });
  }
});

// Monitoring endpoints
app.get('/api/monitoring/recovery', async (req, res) => {
  try {
    const metrics = recoveryService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recovery metrics' });
  }
});

app.get('/api/monitoring/recovery/:key', async (req, res) => {
  try {
    const state = recoveryService.getRecoveryState(req.params.key);
    if (!state) {
      return res.status(404).json({ error: 'Recovery state not found' });
    }
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recovery state' });
  }
});

// Add monitoring endpoints
app.get('/api/monitoring/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = metricsService.getMetrics();
    res.json(metrics);
  } catch (error) {
    loggingService.error('Error fetching metrics', error as Error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.get('/api/monitoring/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      uptime: metricsService.getUptime(),
      timestamp: new Date().toISOString()
    };
    res.json(health);
  } catch (error) {
    loggingService.error('Error checking health', error as Error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  loggingService.info(`Server running on port ${PORT}`);
}); 