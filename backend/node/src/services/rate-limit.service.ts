import { Request, Response } from 'express';
import rateLimit, { Options, Store } from 'express-rate-limit';
import { LoggingService } from './logging.service';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export class RateLimitService {
  private limiters: Map<string, ReturnType<typeof rateLimit>> = new Map();
  private logger: LoggingService;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  createLimiter(name: string, config: RateLimitConfig): ReturnType<typeof rateLimit> {
    const options: Partial<Options> = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message,
      keyGenerator: config.keyGenerator || ((req: Request) => req.ip || 'unknown'),
      handler: (req: Request, res: Response) => {
        this.logger.warn('Rate limit exceeded', {
          name,
          ip: req.ip,
          path: req.path
        });
        res.status(429).json({ error: config.message || 'Too many requests, please try again later.' });
      }
    };

    const limiter = rateLimit(options);
    this.limiters.set(name, limiter);
    return limiter;
  }

  createApiLimiter(): ReturnType<typeof rateLimit> {
    return this.createLimiter('api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many API requests, please try again later.'
    });
  }

  createAuthLimiter(): ReturnType<typeof rateLimit> {
    return this.createLimiter('auth', {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      message: 'Too many authentication attempts, please try again later.'
    });
  }

  createGameActionLimiter(): ReturnType<typeof rateLimit> {
    return this.createLimiter('game-action', {
      windowMs: 60 * 1000, // 1 minute
      max: 30,
      message: 'Too many game actions, please try again later.'
    });
  }

  createWebSocketLimiter(): ReturnType<typeof rateLimit> {
    return this.createLimiter('websocket', {
      windowMs: 60 * 1000, // 1 minute
      max: 60,
      message: 'Too many WebSocket messages, please try again later.'
    });
  }

  getLimiter(name: string): ReturnType<typeof rateLimit> | undefined {
    return this.limiters.get(name);
  }
} 