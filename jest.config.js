module.exports = {
   testEnvironment: 'node',
   testMatch: [
       '**/unittest/**/*.test.js',
       '**/e2e/**/*.test.js',
   ],
   testTimeout: 30000,
   setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
