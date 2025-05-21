import jwt, { SignOptions } from 'jsonwebtoken';
import { DatabaseService } from './database.service';
import { LoggingService } from './logging.service';

export interface TokenPayload {
  walletAddress: string;
  username?: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly JWT_SECRET: Buffer;
  private readonly TOKEN_EXPIRY: string;
  private readonly databaseService: DatabaseService;
  private readonly loggingService: LoggingService;

  constructor(databaseService: DatabaseService, loggingService: LoggingService) {
    this.JWT_SECRET = Buffer.from(process.env.JWT_SECRET || 'your-secret-key', 'utf-8');
    this.TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';
    this.databaseService = databaseService;
    this.loggingService = loggingService;
  }

  public async generateToken(walletAddress: string, username?: string): Promise<string> {
    try {
      const payload: TokenPayload = {
        walletAddress,
        username
      };

      const options: SignOptions = {
        expiresIn: this.TOKEN_EXPIRY as jwt.SignOptions['expiresIn']
      };

      const token = jwt.sign(payload, this.JWT_SECRET, options);

      this.loggingService.info('Token generated', { walletAddress });
      return token;
    } catch (error) {
      this.loggingService.error('Error generating token', error as Error, { walletAddress });
      throw new Error('Failed to generate authentication token');
    }
  }

  public async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      // Verify user still exists
      const player = await this.databaseService.getPlayerStats(payload.walletAddress);
      if (!player) {
        throw new Error('User no longer exists');
      }

      return payload;
    } catch (error) {
      this.loggingService.error('Error verifying token', error as Error);
      throw new Error('Invalid authentication token');
    }
  }

  public async refreshToken(token: string): Promise<string> {
    try {
      const payload = await this.verifyToken(token);
      return this.generateToken(payload.walletAddress, payload.username);
    } catch (error) {
      this.loggingService.error('Error refreshing token', error as Error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  public async invalidateToken(token: string): Promise<void> {
    try {
      const payload = await this.verifyToken(token);
      // Here you could implement token blacklisting if needed
      this.loggingService.info('Token invalidated', { walletAddress: payload.walletAddress });
    } catch (error) {
      this.loggingService.error('Error invalidating token', error as Error);
      throw new Error('Failed to invalidate authentication token');
    }
  }

  public async validateSession(walletAddress: string, token: string): Promise<boolean> {
    try {
      const payload = await this.verifyToken(token);
      return payload.walletAddress === walletAddress;
    } catch (error) {
      return false;
    }
  }
} 