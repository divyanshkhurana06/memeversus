import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

// CORS configuration
export const corsOptions = cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://memeversus.com', 'https://www.memeversus.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// Input validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }
  next();
};

// Common validation rules
export const commonValidationRules = {
  walletAddress: body('walletAddress')
    .isString()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  
  username: body('username')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens'),
  
  gameMode: body('gameMode')
    .isString()
    .isIn(['FrameRace', 'TimeAttack', 'Survival'])
    .withMessage('Invalid game mode'),
  
  roomId: body('roomId')
    .isString()
    .isUUID()
    .withMessage('Invalid room ID format'),
  
  action: body('action')
    .isString()
    .isIn(['move', 'attack', 'defend', 'special'])
    .withMessage('Invalid game action'),
  
  payload: body('payload')
    .isObject()
    .withMessage('Invalid payload format')
}; 