const mongoose = require('mongoose');

const getDbUrl = () => {
   if (process.env.DB_URL) {
       return process.env.DB_URL;
   }
   return 'mongodb://localhost:27017/hummingsang-test';
};

beforeAll(async () => {
   const dbUrl = getDbUrl();
   if (mongoose.connection.readyState === 0) {
       await mongoose.connect(dbUrl);
   }
});

afterAll(async () => {
   await mongoose.connection.dropDatabase();
   await mongoose.disconnect();
});

afterEach(async () => {
   const collections = mongoose.connection.collections;
   for (const key in collections) {
       await collections[key].deleteMany({});
   }
});
