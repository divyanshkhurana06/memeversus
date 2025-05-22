import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupSuiWallet() {
  try {
    // Create a new keypair
    const keypair = Ed25519Keypair.generate();
    const address = keypair.getPublicKey().toSuiAddress();
    
    // Save the private key to .env file
    const privateKey = Buffer.from(keypair.getSecretKey()).toString('hex');
    const envPath = path.join(__dirname, '..', '.env');

    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.match(/SUI_PRIVATE_KEY=.*/)) {
        envContent = envContent.replace(/SUI_PRIVATE_KEY=.*/, `SUI_PRIVATE_KEY=${privateKey}`);
      } else {
        envContent += `\nSUI_PRIVATE_KEY=${privateKey}`;
      }
    } else {
      envContent = `SUI_PRIVATE_KEY=${privateKey}`;
    }
    fs.writeFileSync(envPath, envContent);

    console.log('Generated new Sui wallet:');
    console.log('Address:', address);
    console.log('Private key has been saved to .env file');
    console.log('\nTo get test tokens, visit: https://faucet.testnet.sui.io/');
    console.log('Enter your address:', address);
  } catch (error) {
    console.error('Error setting up Sui wallet:', error);
  }
}

setupSuiWallet(); 