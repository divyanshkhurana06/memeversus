declare module '@mysten/sui' {
  export class JsonRpcProvider {
    constructor(connection: any);
    getObject(params: { id: string; options?: any }): Promise<any>;
    getTransactionBlock(params: { digest: string; options?: any }): Promise<any>;
    executeTransactionBlock(params: { transactionBlock: any }): Promise<any>;
    getBalance(params: { owner: string; coinType: string }): Promise<{ totalBalance: string }>;
  }

  export class Connection {
    constructor(config: { fullnode: string });
  }

  export class Transaction {
    constructor();
    moveCall(params: { target: string; arguments: any[] }): void;
    build(): Promise<any>;
    pure: {
      address(address: string): any;
      u8(value: number): any;
      string(value: string): any;
    };
  }

  export interface SuiTransactionBlockResponse {
    digest: string;
    effects: {
      status: { status: string };
      created: Array<{ reference: { objectId: string } }>;
    };
  }
}

declare module '@mysten/sui/utils'; 