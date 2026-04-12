const mongoose = require('mongoose');

const getDbUrl = () => {
   if (process.env.DB_URL) {
       return process.env.DB_URL;
   }
   
   const dbName = process.env.NODE_ENV === 'test' ? 'hummingsang-test' : 'hummingsang-portfolio';
   return `mongodb://localhost:27017/${dbName}`;
};

const dbUrl = getDbUrl();

const connectDB = async () => {
   await mongoose.connect(dbUrl);
   const db = mongoose.connection;
   db.on('error', console.error.bind(console, 'connection error:'));
   db.once('open', () => {
       console.log('Database connected');
   });
};

module.exports = connectDB;
