export class AppError extends Error {
  statusCode: number;
  path?: string;

  constructor(statusCode: number, message: string, path?: string) {
    super(message);
    this.statusCode = statusCode;
    this.path = path;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(409, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, message);
    this.name = 'DatabaseError';
  }
}

export class WebSocketError extends AppError {
  constructor(message: string = 'WebSocket operation failed') {
    super(500, message);
  }
}

export class GameError extends AppError {
  constructor(message: string = 'Game operation failed') {
    super(500, message);
  }
} 