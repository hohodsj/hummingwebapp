const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
   try {
       // In Docker/CI with docker-compose, DB_URL is already set to mongo service
       // Only use memory server for local development when DB_URL is not set
       if (!process.env.DB_URL) {
           mongoServer = await MongoMemoryServer.create({
               binary: {
                   skipMD5: true,
               },
           });
           
           const mongoUri = mongoServer.getUri();
           process.env.DB_URL = mongoUri;
           
           console.log('MongoDB Memory Server started at:', mongoUri);
           globalThis.__MONGO_SERVER__ = mongoServer;
       } else {
           console.log('Using MongoDB at:', process.env.DB_URL);
       }
       
   } catch (error) {
       console.error('Failed to start MongoDB:', error);
       throw error;
   }
};
