import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { LoggingService } from '../services/logging.service';

const logger = new LoggingService();

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: (err?: Error) => void
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    path: req.path,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 