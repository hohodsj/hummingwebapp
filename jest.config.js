module.exports = {
   testEnvironment: 'node',
   testMatch: [
       '**/unittest/**/*.test.js',
       '**/e2e/**/*.test.js',
   ],
   testTimeout: 30000,
   maxWorkers: 1,
   globalSetup: '<rootDir>/jest.global-setup.js',
   globalTeardown: '<rootDir>/jest.global-teardown.js',
   setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
   forceExit: true,
};
