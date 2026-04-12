const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
   try {
       // Download/ensure MongoDB binaries exist
       mongoServer = await MongoMemoryServer.create({
           binary: {
               skipMD5: true,
           },
       });
       
       const mongoUri = mongoServer.getUri();
       
       // Set environment variable BEFORE any modules load
       process.env.DB_URL = mongoUri;
       process.env.NODE_ENV = 'test';
       
       console.log('MongoDB Memory Server started at:', mongoUri);
       
       // Store for teardown
       globalThis.__MONGO_SERVER__ = mongoServer;
       
   } catch (error) {
       console.error('Failed to start MongoDB Memory Server:', error);
       throw error;
   }
};
