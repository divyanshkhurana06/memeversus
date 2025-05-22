module.exports = {
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getObject: jest.fn(),
    getTransactionBlock: jest.fn(),
    executeTransactionBlock: jest.fn()
  })),
  Connection: jest.fn().mockImplementation(() => ({})),
  SuiTransactionBlockResponse: jest.fn()
}; 