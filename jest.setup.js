require('dotenv').config({ path: '.env.test' });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Set mongoose strictQuery to suppress deprecation warning
mongoose.set('strictQuery', false);

// Global MongoDB Memory Server instance
let mongoServer;

// Start MongoDB Memory Server before all tests
beforeAll(async () => {
   try {
       mongoServer = await MongoMemoryServer.create();
       const mongoUri = mongoServer.getUri();
       
       // Override DB_URL to use in-memory MongoDB
       process.env.DB_URL = mongoUri;
       
       console.log('MongoDB Memory Server started at:', mongoUri);
   } catch (error) {
       console.error('Failed to start MongoDB Memory Server:', error);
       throw error;
   }
});

// Stop MongoDB Memory Server after all tests
afterAll(async () => {
   try {
       if (mongoServer) {
           await mongoose.disconnect();
           await mongoServer.stop();
           console.log('MongoDB Memory Server stopped');
       }
   } catch (error) {
       console.error('Error stopping MongoDB Memory Server:', error);
       throw error;
   }
});
