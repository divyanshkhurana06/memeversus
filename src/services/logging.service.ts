import winston from 'winston';
import { format } from 'winston';

interface LogMetadata {
  [key: string]: any;
}

export class LoggingService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'game-service' },
      transports: [
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.logger.error(message, {
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      ...metadata
    });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, metadata);
  }

  // Log game events
  logGameEvent(event: string, roomId: string, metadata?: LogMetadata): void {
    this.info(`Game Event: ${event}`, {
      roomId,
      event,
      ...metadata
    });
  }

  // Log player actions
  logPlayerAction(action: string, playerId: string, roomId: string, metadata?: LogMetadata): void {
    this.info(`Player Action: ${action}`, {
      playerId,
      roomId,
      action,
      ...metadata
    });
  }

  // Log system metrics
  logMetrics(metrics: LogMetadata): void {
    this.info('System Metrics', metrics);
  }

  // Log recovery events
  logRecoveryEvent(event: string, roomId: string, metadata?: LogMetadata): void {
    this.info(`Recovery Event: ${event}`, {
      roomId,
      event,
      ...metadata
    });
  }
} 