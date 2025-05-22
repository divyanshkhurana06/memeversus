import { config } from 'dotenv';

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