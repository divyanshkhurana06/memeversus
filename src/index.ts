import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { SuiService } from './services/sui.service';
import { GameService, GameMode } from './services/game.service';

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
const suiService = new SuiService();
const gameService = new GameService();

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join game room
  socket.on('joinRoom', async (data: { roomId: string, walletAddress: string, signature: string }) => {
    try {
      // Verify wallet ownership
      const isValid = await suiService.verifyWalletOwnership(
        data.walletAddress,
        data.signature,
        `Join room ${data.roomId}`
      );

      if (!isValid) {
        socket.emit('error', { message: 'Invalid wallet signature' });
        return;
      }

      socket.join(data.roomId);
      let gameState = await gameService.getGameState(data.roomId);
      
      if (!gameState) {
        gameState = await gameService.createGameRoom(data.roomId, GameMode.FrameRace);
      }
      
      await gameService.joinGameRoom(data.roomId, data.walletAddress);
      
      io.to(data.roomId).emit('playerJoined', { 
        playerId: socket.id,
        walletAddress: data.walletAddress,
        players: gameState.players 
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Start game
  socket.on('startGame', async (roomId: string) => {
    try {
      const gameState = await gameService.getGameState(roomId);
      if (gameState) {
        gameState.isActive = true;
        await gameService.updateGameRoom(roomId, { isActive: true });
        io.to(roomId).emit('gameStarted', gameState);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle FrameRace action
  socket.on('frameRaceAction', async (data: { roomId: string, frame: number }) => {
    try {
      const isCorrect = await gameService.handleFrameRaceAction(data.roomId, socket.id, data.frame);
      io.to(data.roomId).emit('frameRaceResult', { 
        playerId: socket.id,
        isCorrect,
        frame: data.frame
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to process frame race action' });
    }
  });

  // Handle SoundSnatch action
  socket.on('soundSnatchAction', async (data: { roomId: string, guess: string }) => {
    try {
      const isCorrect = await gameService.handleSoundSnatchAction(data.roomId, socket.id, data.guess);
      io.to(data.roomId).emit('soundSnatchResult', {
        playerId: socket.id,
        isCorrect,
        guess: data.guess
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to process sound snatch action' });
    }
  });

  // Handle TypeClash action
  socket.on('typeClashAction', async (data: { roomId: string, typedText: string }) => {
    try {
      const isCorrect = await gameService.handleTypeClashAction(data.roomId, socket.id, data.typedText);
      io.to(data.roomId).emit('typeClashResult', {
        playerId: socket.id,
        isCorrect,
        typedText: data.typedText
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to process type clash action' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    // Remove player from all rooms
    const rooms = Array.from(io.sockets.adapter.rooms.keys());
    for (const roomId of rooms) {
      try {
        const gameState = await gameService.getGameState(roomId);
        if (gameState) {
          const playerIndex = gameState.players.indexOf(socket.id);
          if (playerIndex !== -1) {
            gameState.players.splice(playerIndex, 1);
            await gameService.updateGameRoom(roomId, { players: gameState.players });
            io.to(roomId).emit('playerLeft', { 
              playerId: socket.id,
              players: gameState.players 
            });
          }
        }
      } catch (error) {
        console.error('Error handling disconnection:', error);
      }
    }
  });
});

// REST API routes
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await gameService.getAllGameRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game rooms' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 