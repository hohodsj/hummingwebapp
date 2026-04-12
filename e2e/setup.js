const mongoose = require('mongoose');

afterEach(async () => {
   const collections = mongoose.connection.collections;
   for (const key in collections) {
       await collections[key].deleteMany({});
   }
});
