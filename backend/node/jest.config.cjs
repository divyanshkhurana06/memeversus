module.exports = {
  preset: 'ts-jest/presets/default-esm', // <-- Use ESM preset
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!(\@mysten/sui)/)'
  ],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^@mysten/sui$': '<rootDir>/src/test/mocks/sui.mock.js',
    '^(\.{1,2}/.*)\.js$': '$1', // <-- Fix path mapping for ESM imports
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
