const mongoose = require('mongoose');

beforeAll(async () => {
   const dbUrl = process.env.DB_URL || 'mongodb://localhost:27018/hummingsang-test';
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
