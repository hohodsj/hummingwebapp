const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const CollectionSchema = require('./models/collectionSchema');

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/hummingsang-portfolio";
mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const port = 3000;

app.get('/', async (req, res) => {
    const collections = await CollectionSchema.find({}).sort({order:1});
    collections.forEach(x => console.log(JSON.stringify(x)));
    console.log(collections);
    console.log(req.path);
    res.render('portfolio', {collections});
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
})

app.get('/:collection', (req, res) => {
    res.render('collection');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
