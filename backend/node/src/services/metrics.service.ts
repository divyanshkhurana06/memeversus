import { DatabaseService } from './database.service';

export interface SystemMetrics {
  activeGames: number;
  totalPlayers: number;
  averageGameDuration: number;
  totalTransactions: number;
  failedTransactions: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageResponseTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

export class MetricsService {
  private metrics: SystemMetrics;
  private databaseService?: DatabaseService;
  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIMES = 100;
  private startTime: number;

  constructor(databaseService?: DatabaseService) {
    this.databaseService = databaseService;
    this.startTime = Date.now();
    this.metrics = {
      activeGames: 0,
      totalPlayers: 0,
      averageGameDuration: 0,
      totalTransactions: 0,
      failedTransactions: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageResponseTime: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      }
    };

    // Update metrics every minute
    setInterval(() => this.updateMetrics(), 60000);
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Update memory usage
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryUsage = {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      };

      // Update total players if database service is available
      if (this.databaseService) {
        await this.updateTotalPlayers();
      }

      // Calculate average response time
      if (this.responseTimes.length > 0) {
        this.metrics.averageResponseTime = 
          this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  public async updateTotalPlayers(): Promise<void> {
    if (!this.databaseService) {
      return;
    }
    try {
      this.metrics.totalPlayers = await this.databaseService.getTotalPlayers();
    } catch (error) {
      console.error('Error updating total players:', error);
    }
  }

  public getUptime(): number {
    return Date.now() - this.startTime;
  }

  public trackResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }
  }

  public incrementActiveGames(): void {
    this.metrics.activeGames++;
  }

  public decrementActiveGames(): void {
    this.metrics.activeGames = Math.max(0, this.metrics.activeGames - 1);
  }

  public trackTransaction(success: boolean): void {
    this.metrics.totalTransactions++;
    if (!success) {
      this.metrics.failedTransactions++;
    }
  }

  public trackRecovery(success: boolean): void {
    this.metrics.recoveryAttempts++;
    if (success) {
      this.metrics.successfulRecoveries++;
    } else {
      this.metrics.failedRecoveries++;
    }
  }

  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      activeGames: 0,
      totalPlayers: 0,
      averageGameDuration: 0,
      totalTransactions: 0,
      failedTransactions: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageResponseTime: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      }
    };
    this.responseTimes = [];
  }
} 