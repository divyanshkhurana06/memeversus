import { config } from 'dotenv';
// Removed: import './mocks/sui.mock';

// Load test environment variables
config({ path: '.env.test' });

// Set test timeout
jest.setTimeout(10000);

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global cleanup here
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// All inline and imported mocks for @mysten/sui have been removed. 