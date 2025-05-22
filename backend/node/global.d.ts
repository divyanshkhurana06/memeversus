declare module '@mysten/sui' {
  export class JsonRpcProvider {
    constructor(connection: Connection);
    getObject(params: { id: string }): Promise<any>;
    getTransactionBlock(params: { digest: string }): Promise<any>;
    executeTransactionBlock(params: { transactionBlock: any }): Promise<any>;
  }

  export class Connection {
    constructor(config: { fullnode: string });
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