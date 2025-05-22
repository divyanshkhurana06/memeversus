import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/bcs';
import { GameMode, GameStatus } from '../models/game.model';
import { LoggingService } from './logging.service';

const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || '';
const keypair = PRIVATE_KEY ? Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY)) : Ed25519Keypair.generate();

export class SuiService {
  private provider: SuiClient;
  private logger: LoggingService;

  constructor(logger: LoggingService) {
    this.logger = logger;
    this.provider = new SuiClient({ url: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io' });
  }

  async verifyWalletOwnership(walletAddress: string, signature: string): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Get the message that was signed
      // 2. Verify the signature against the message and wallet address
      // 3. Return true if verification succeeds

      // For now, we'll just check if the signature is a valid hex string
      const isValidHex = /^[0-9a-fA-F]+$/.test(signature);
      return isValidHex;
    } catch (error: unknown) {
      this.logger.error('Error verifying wallet ownership:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async getBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance({
        owner: walletAddress,
        coinType: '0x2::sui::SUI'
      });
      return balance.totalBalance;
    } catch (error: unknown) {
      this.logger.error('Error getting wallet balance:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async mintNFT(playerAddress: string, gameMode: GameMode): Promise<string> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${process.env.NFT_PACKAGE_ID}::game_nft::mint`,
        arguments: [tx.pure.address(playerAddress), tx.pure.u8(Number(gameMode))]
      });
      const result = await this.provider.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true }
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

      const result = await this.provider.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true }
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

      await this.provider.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true }
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

      await this.provider.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true }
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
} 