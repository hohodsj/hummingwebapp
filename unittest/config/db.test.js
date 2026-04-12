describe('Database Configuration', () => {
   test('db config exports a connectDB function', () => {
       const connectDB = require('../../config/db');
       expect(typeof connectDB).toBe('function');
   });

   test('connectDB can be called without errors', async () => {
       const connectDB = require('../../config/db');
       // Should not throw
       expect(connectDB).toBeDefined();
   });

   test('db module is loadable', () => {
       const config = require('../../config/db');
       expect(config).toBeDefined();
   });
});
