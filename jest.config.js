/**
 * Jest configuration for Birgittesbriks Tests
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    '!routes/**/*.test.js',
    'utils/**/*.js',
    '!utils/**/*.test.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  detectOpenHandles: true
};
