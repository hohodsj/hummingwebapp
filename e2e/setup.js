const mongoose = require('mongoose');

beforeEach(async () => {
   // Clear all collections EXCEPT users before each test to ensure clean state
   // Users are managed separately to avoid duplicate key errors
   try {
       const collections = mongoose.connection.collections;
       for (const key in collections) {
           // Skip userSchemas collection to prevent duplicate test user issues
           if (key !== 'userschemas') {
               await collections[key].deleteMany({});
           }
       }
   } catch (error) {
       console.error('Error clearing collections:', error);
   }
});
