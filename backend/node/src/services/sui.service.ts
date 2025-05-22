import { JsonRpcProvider, Connection } from '@mysten/sui';
import { Transaction } from '@mysten/sui';
import { GameMode, GameStatus } from '../models/game.model';
import { LoggingService } from './logging.service';

export class SuiService {
  private provider: JsonRpcProvider;
  private logger: LoggingService;

  constructor(logger: LoggingService) {
    this.logger = logger;
    const connection = new Connection({
      fullnode: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io'
    });
    this.provider = new JsonRpcProvider(connection);
  }

  async verifyWalletOwnership(walletAddress: string, signature: string): Promise<boolean> {
    try {
      // TODO: Implement actual signature verification
      // For now, just return true (or implement your own logic)
      // const balance = await this.provider.getBalance({
      //   owner: walletAddress,
      //   coinType: '0x2::sui::SUI'
      // });
      // return balance.totalBalance > 0;
      return true;
    } catch (error) {
      console.error('Error verifying wallet ownership:', error);
      return false;
    }
  }

  async mintNFT(playerAddress: string, gameMode: GameMode): Promise<string> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${process.env.NFT_PACKAGE_ID}::game_nft::mint`,
        arguments: [tx.pure.address(playerAddress), tx.pure.u8(Number(gameMode))]
      });
      const bytes = await tx.build();
      const result = await this.provider.executeTransactionBlock({
        transactionBlock: bytes
      });
      return result.digest;
    } catch (error) {
      this.logger.error('Error minting NFT:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  getContractAddress(gameMode: GameMode): string {
    switch (gameMode) {
      case GameMode.FRAME_RACE:
        return process.env.FRAME_RACE_CONTRACT || '';
      case GameMode.SOUND_SNATCH:
        return process.env.SOUND_SNATCH_CONTRACT || '';
      case GameMode.TYPE_CLASH:
        return process.env.TYPE_CLASH_CONTRACT || '';
      default:
        throw new Error('Unknown game mode');
    }
  }

  async createGame(gameMode: GameMode, playerAddress: string): Promise<string> {
    try {
      const contractAddress = this.getContractAddress(gameMode);
      const tx = new Transaction();
      tx.moveCall({
        target: `${contractAddress}::game::create_game`,
        arguments: [tx.pure.address(playerAddress)]
      });
      const bytes = await tx.build();
      const result = await this.provider.executeTransactionBlock({
        transactionBlock: bytes
      });
      return result.digest;
    } catch (error) {
      this.logger.error('Error creating game', error as Error);
      throw error;
    }
  }

  async joinGame(gameId: string, playerAddress: string): Promise<void> {
    try {
      const contractAddress = this.getContractAddress(GameMode.FRAME_RACE);
      const tx = new Transaction();
      tx.moveCall({
        target: `${contractAddress}::game::join_game`,
        arguments: [tx.pure.string(gameId), tx.pure.address(playerAddress)]
      });
      const bytes = await tx.build();
      await this.provider.executeTransactionBlock({
        transactionBlock: bytes
      });
    } catch (error) {
      this.logger.error('Error joining game', error as Error);
      throw error;
    }
  }

  async makeMove(gameId: string, playerAddress: string, move: any): Promise<void> {
    try {
      const contractAddress = this.getContractAddress(GameMode.FRAME_RACE);
      const tx = new Transaction();
      tx.moveCall({
        target: `${contractAddress}::game::make_move`,
        arguments: [tx.pure.string(gameId), tx.pure.address(playerAddress), typeof move === 'number' ? tx.pure.u8(move) : tx.pure.string(String(move))]
      });
      const bytes = await tx.build();
      await this.provider.executeTransactionBlock({
        transactionBlock: bytes
      });
    } catch (error) {
      this.logger.error('Error making move', error as Error);
      throw error;
    }
  }

  async getTransactionStatus(txDigest: string): Promise<string> {
    try {
      const result = await this.provider.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showEvents: true
        }
      });
      return result?.effects?.status?.status || 'unknown';
    } catch (error) {
      this.logger.error('Error getting transaction status:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getObject(objectId: string): Promise<any> {
    try {
      const result = await this.provider.getObject({
        id: objectId,
        options: {
          showContent: true,
          showOwner: true
        }
      });
      return result;
    } catch (error) {
      this.logger.error('Error getting object:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const result = await this.provider.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      return result.totalBalance;
    } catch (error) {
      this.logger.error('Error getting balance:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
} 