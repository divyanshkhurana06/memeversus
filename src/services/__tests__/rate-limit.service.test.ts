import { RateLimitService } from '../rate-limit.service';
import { LoggingService } from '../logging.service';
import { Request, Response } from 'express';
import { RateLimitRequestHandler } from 'express-rate-limit';

jest.mock('../logging.service');

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;
  let mockLoggingService: jest.Mocked<LoggingService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockLoggingService = new LoggingService() as jest.Mocked<LoggingService>;
    rateLimitService = new RateLimitService(mockLoggingService);

    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createLimiter', () => {
    it('should create a limiter with default configuration', () => {
      const limiter = rateLimitService.createLimiter('test', {
        windowMs: 60000,
        max: 100
      });

      expect(limiter).toBeDefined();
      expect(rateLimitService.getLimiter('test')).toBe(limiter);
    });

    it('should create a limiter with custom configuration', () => {
      const customKeyGenerator = (req: Request) => req.ip || 'unknown';
      const limiter = rateLimitService.createLimiter('test', {
        windowMs: 60000,
        max: 100,
        message: 'Custom error message',
        keyGenerator: customKeyGenerator
      });

      expect(limiter).toBeDefined();
    });
  });

  describe('API limiter', () => {
    it('should create API limiter with correct configuration', () => {
      const limiter = rateLimitService.createApiLimiter();

      expect(limiter).toBeDefined();
      expect(rateLimitService.getLimiter('api')).toBe(limiter);
    });

    it('should handle rate limit exceeded', () => {
      const limiter = rateLimitService.createApiLimiter();
      const next = jest.fn();
      limiter(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too many API requests, please try again later.'
      });
      expect(mockLoggingService.warn).toHaveBeenCalledWith('Rate limit exceeded', {
        name: 'api',
        ip: mockRequest.ip,
        path: mockRequest.path
      });
    });
  });

  describe('Auth limiter', () => {
    it('should create auth limiter with correct configuration', () => {
      const limiter = rateLimitService.createAuthLimiter();

      expect(limiter).toBeDefined();
      expect(rateLimitService.getLimiter('auth')).toBe(limiter);
    });

    it('should handle auth rate limit exceeded', () => {
      const limiter = rateLimitService.createAuthLimiter();
      const next = jest.fn();
      limiter(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too many authentication attempts, please try again later.'
      });
    });
  });

  describe('Game action limiter', () => {
    it('should create game action limiter with correct configuration', () => {
      const limiter = rateLimitService.createGameActionLimiter();

      expect(limiter).toBeDefined();
      expect(rateLimitService.getLimiter('game-action')).toBe(limiter);
    });

    it('should handle game action rate limit exceeded', () => {
      const limiter = rateLimitService.createGameActionLimiter();
      const next = jest.fn();
      limiter(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too many game actions, please try again later.'
      });
    });
  });

  describe('WebSocket limiter', () => {
    it('should create WebSocket limiter with correct configuration', () => {
      const limiter = rateLimitService.createWebSocketLimiter();

      expect(limiter).toBeDefined();
      expect(rateLimitService.getLimiter('websocket')).toBe(limiter);
    });

    it('should handle WebSocket rate limit exceeded', () => {
      const limiter = rateLimitService.createWebSocketLimiter();
      const next = jest.fn();
      limiter(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too many WebSocket messages, please try again later.'
      });
    });
  });

  describe('getLimiter', () => {
    it('should return undefined for non-existent limiter', () => {
      const limiter = rateLimitService.getLimiter('non-existent');
      expect(limiter).toBeUndefined();
    });

    it('should return existing limiter', () => {
      const createdLimiter = rateLimitService.createApiLimiter();
      const retrievedLimiter = rateLimitService.getLimiter('api');
      expect(retrievedLimiter).toBe(createdLimiter);
    });
  });
}); 