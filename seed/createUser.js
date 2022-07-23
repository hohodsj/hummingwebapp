const mongoose = require('mongoose');
const User = require('../models/userSchema');

mongoose.connect('mongodb://localhost:27017/hummingsang-portfolio');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

const username = 'test';
const password = '123';

createUser = async (username, password) => {
    await User.register({username: username},password);
};

createUser(username, password).then(() => {
    mongoose.connection.close();
});
