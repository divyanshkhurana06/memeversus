declare module '@mysten/sui.js' {
  export class JsonRpcProvider {
    constructor(connection: Connection);
    getBalance(params: { owner: string; coinType: string }): Promise<{ totalBalance: number }>;
    transferObject(params: { sender: string; recipient: string; objectId: string; gasBudget: number }): Promise<any>;
    executeTransaction(signedTx: any): Promise<{ digest: string }>;
  }

  export class Connection {
    constructor(params: { fullnode: string; faucet?: string });
  }

  export class Ed25519Keypair {
    static fromSecretKey(key: Uint8Array): Ed25519Keypair;
    getPublicKey(): { toSuiAddress(): string };
    signTransaction(tx: any): Promise<any>;
  }

  export function fromB64(str: string): Uint8Array;
} 