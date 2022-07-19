const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
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

app.use((req, res, next) => {
    res.locals.activeLocation = req.path;
    next();
})

const port = 3000;

app.get('/', catchAsync(async (req, res) => {
    const collections = await CollectionSchema.find({}).sort({order:1});
    collections.forEach(x => console.log(JSON.stringify(x)));
    res.render('portfolio', {collections});
}));

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
})

app.get('/:collection', catchAsync(async (req, res) => {
    const collectionName = req.params.collection;
    const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate('artworks').sort({order:1});
    const artworks = collection.artworks;
    res.render('collection', {artworks});
}));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
