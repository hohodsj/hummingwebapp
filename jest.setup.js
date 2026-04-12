process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

// Set mongoose strictQuery to suppress deprecation warning
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// Cleanup after all tests
afterAll(async () => {
   // Clear any intervals/timers
   jest.clearAllMocks();
   
   // Close mongoose connection
   if (mongoose.connection.readyState === 1) {
       await mongoose.disconnect();
   }
});
