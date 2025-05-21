import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromHEX } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { TransactionArgument } from '@mysten/sui/transactions';
import { SerializedBcs } from '@mysten/bcs';
import { GameMode } from '../services/game.service';

export class SuiService {
  private client: SuiClient;
  private keypair: Ed25519Keypair;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SUI_PRIVATE_KEY not found in environment variables');
    }
    this.keypair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
  }

  // Verify wallet ownership
  async verifyWallet(address: string, message: string, signature: string): Promise<boolean> {
    try {
      // For now, just verify that the address matches our keypair
      return address === this.keypair.getPublicKey().toSuiAddress();
    } catch (error) {
      console.error('Error verifying wallet:', error);
      return false;
    }
  }

  // Verify wallet ownership
  async verifyWalletOwnership(walletAddress: string, signature: string, message: string): Promise<boolean> {
    try {
      // For now, we'll just verify that the wallet address is valid
      // TODO: Implement proper signature verification when the SDK is updated
      return walletAddress.startsWith('0x') && walletAddress.length === 66;
    } catch (error) {
      console.error('Error verifying wallet ownership:', error);
      return false;
    }
  }

  // Mint NFT badge for winner
  async mintWinnerBadge(winnerAddress: string, gameMode: GameMode): Promise<string> {
    try {
      const tx = new Transaction();
      
      // Convert strings to Uint8Array
      const winnerAddressBytes = new TextEncoder().encode(winnerAddress);
      const gameModeBytes = new TextEncoder().encode(gameMode.toString());

      const args: (TransactionArgument | SerializedBcs<any, any>)[] = [
        tx.pure(winnerAddressBytes),
        tx.pure(gameModeBytes),
      ];

      tx.moveCall({
        target: `${process.env.PACKAGE_ID}::memevs::mint_winner_badge`,
        typeArguments: [],
        arguments: args,
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction: tx,
      });

      return result.digest;
    } catch (error) {
      console.error('Error minting winner badge:', error);
      throw error;
    }
  }

  // Get player stats from blockchain
  async fetchPlayerStats(address: string): Promise<any> {
    try {
      // Call the fetch_player_stats function from our Move contract
      const result = await this.client.getObject({
        id: address,
        options: { showContent: true },
      });
      return result;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }
} 