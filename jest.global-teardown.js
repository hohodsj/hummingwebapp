module.exports = async () => {
   try {
       const mongoServer = globalThis.__MONGO_SERVER__;
       if (mongoServer) {
           await mongoServer.stop();
           console.log('MongoDB Memory Server stopped');
       }
   } catch (error) {
       console.error('Error stopping MongoDB Memory Server:', error);
       throw error;
   }
};
