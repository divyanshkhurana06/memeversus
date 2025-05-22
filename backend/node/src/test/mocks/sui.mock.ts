// Mock @mysten/sui
jest.mock('@mysten/sui', () => ({
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getObject: jest.fn(),
    getTransactionBlock: jest.fn(),
    executeTransactionBlock: jest.fn()
  })),
  Connection: jest.fn().mockImplementation(() => ({})),
  SuiTransactionBlockResponse: jest.fn()
})); 