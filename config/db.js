const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/hummingsang-portfolio';

const connectDB = async () => {
   await mongoose.connect(dbUrl);
   const db = mongoose.connection;
   db.on('error', console.error.bind(console, 'connection error:'));
   db.once('open', () => {
       console.log('Database connected');
   });
};

module.exports = connectDB;
