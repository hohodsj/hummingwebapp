require('dotenv').config();
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
const CollectionSchema = require('./models/collectionSchema');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const UserSchema = require('./models/userSchema');
const { reduceRight } = require('mongoose/lib/helpers/query/validOps');
const {isLoggedIn} = require('./middleware');
const methodOverride = require('method-override');
var {google} = require('googleapis')
const multer = require("multer");
const {storage} = require('./cloudinary');
const upload = multer({storage});
// const upload = multer({dest: 'uploads/'});
const {createCollection} = require("./controllers/collectionsController");

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

app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const secret = process.env.SECRET || 'ThisSecretOnlyWorksInDevEnv';

const sessionConfig = {
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge:1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(UserSchema.authenticate()));
passport.serializeUser(UserSchema.serializeUser());
passport.deserializeUser(UserSchema.deserializeUser());


app.use((req, res, next) => {
    res.locals.activeLocation = req.path;
    next();
});

app.get('/', catchAsync(async (req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').sort({order:1});
    // collections.forEach(x => console.log(JSON.stringify(x)));
    res.render('portfolio', {collections});
}));

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/login', (req, res) => {
    res.render('admin/login')
});

app.post('/login', passport.authenticate('local', {failureRedirect:'/login'}), (req, res) => {
    console.log('post login');
    console.log(req);
    res.redirect('/admin/portfolio');
})

app.get('/admin/portfolio', isLoggedIn, async(req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').sort({order:1});
    res.render('admin/edit-portfolio', {collections});
})

app.get('/admin/create-collection', isLoggedIn, async(req, res) => {
    res.render('admin/create-collection');
})

// app.post('/admin/create-collection', isLoggedIn, upload.array('image'), async(req, res) => {
//     console.log(req.files);
//     res.redirect('/admin/portfolio');
// })

app.post('/admin/create-collection', isLoggedIn, upload.array('image'), createCollection);

app.delete('/:collection', isLoggedIn, async(req, res) => {
    const {collection} = req.params;
    await CollectionSchema.findOneAndDelete({collectionName: collection});
    // add flash message
    res.redirect('/admin/portfolio');
})

app.get('/:collection', catchAsync(async (req, res) => {
    const collectionName = req.params.collection;
    const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate('artworks').populate('description').sort({order:1});
    // const artworks = collection.artworks;

    res.render('collection', {collection});
}));

const port = 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
