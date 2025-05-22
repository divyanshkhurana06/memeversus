import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { LoggingService } from '../services/logging.service';

const logger = new LoggingService();

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn('Operational error occurred', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT error occurred', {
      message: err.message,
      path: req.path,
      method: req.method
    });

    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('JWT expired', {
      message: err.message,
      path: req.path,
      method: req.method
    });

    return res.status(401).json({
      status: 'error',
      message: 'Token expired'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    logger.warn('Validation error occurred', {
      message: err.message,
      path: req.path,
      method: req.method
    });

    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  // Handle unknown errors
  logger.error('Unknown error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const err = new AppError(404, `Route ${req.originalUrl} not found`);
  next(err);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 