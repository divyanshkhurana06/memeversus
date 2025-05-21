import { JsonRpcProvider, Connection, Ed25519Keypair, fromB64 } from '@mysten/sui.js';
import { GameMode, GameStatus } from '../models/game.model';

export class SuiService {
  private provider: JsonRpcProvider;
  private keypair: Ed25519Keypair;

  constructor() {
    const connection = new Connection({
      fullnode: process.env.SUI_NODE_URL || 'https://fullnode.mainnet.sui.io',
      faucet: process.env.SUI_FAUCET_URL
    });
    this.provider = new JsonRpcProvider(connection);
    
    // Initialize keypair from private key
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SUI_PRIVATE_KEY environment variable is required');
    }
    this.keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
  }

  async verifyWalletOwnership(walletAddress: string, signature: string): Promise<boolean> {
    try {
      // Verify signature using Sui SDK
      const message = `Verify ownership of wallet ${walletAddress}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = fromB64(signature);
      
      // TODO: Implement actual signature verification
      // For now, verify wallet exists and is active
      const balance = await this.provider.getBalance({
        owner: walletAddress,
        coinType: '0x2::sui::SUI'
      });
      return balance.totalBalance > 0;
    } catch (error) {
      console.error('Error verifying wallet ownership:', error);
      return false;
    }
  }

  async mintNFT(winnerAddress: string, gameMode: GameMode): Promise<string> {
    try {
      // Create NFT mint transaction
      const txb = await this.provider.transferObject({
        sender: this.keypair.getPublicKey().toSuiAddress(),
        recipient: winnerAddress,
        objectId: process.env.NFT_OBJECT_ID || '',
        gasBudget: 1000000
      });

      // Sign and execute transaction
      const signedTx = await this.keypair.signTransaction(txb);
      const result = await this.provider.executeTransaction(signedTx);

      return result.digest;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw new Error('Failed to mint NFT');
    }
  }

  async getGameContract(gameMode: GameMode): Promise<string> {
    // Return contract address based on game mode
    switch (gameMode) {
      case GameMode.FrameRace:
        return process.env.FRAME_RACE_CONTRACT || '';
      case GameMode.SoundSnatch:
        return process.env.SOUND_SNATCH_CONTRACT || '';
      case GameMode.TypeClash:
        return process.env.TYPE_CLASH_CONTRACT || '';
      default:
        throw new Error('Invalid game mode');
    }
  }
} 