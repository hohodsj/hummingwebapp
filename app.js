require('dotenv').config();
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
const ArtWorkSchema = require('./models/artworkSchema');
const CollectionSchema = require('./models/collectionSchema');
const DescriptionSchema = require('./models/descriptionSchema');
const passport = require('passport');
// const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const UserSchema = require('./models/userSchema');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const {buildSitemaps} = require('express-sitemap-xml');
const ExpressError = require('./utils/ExpressError');
const {downloadImages} = require('./utils/googleDriveUtil');
const fs = require("fs")
const {periodicRemove} = require('./utils/deleteUtils')
const cron = require('node-cron')
const useragent = require('express-useragent')

const adminRoutes = require('./routes/admin');

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
app.use(bodyParser.text());
app.use(express.static(path.join(__dirname, 'public')));
app.use(useragent.express())
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
// passport.use(new LocalStrategy(UserSchema.authenticate()));
// Google Drive project share same client id and secret
passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    callbackURL: "/google/callback",
    passReqToCallback   : true,
    proxy: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
   UserSchema.findByUsername(profile.email, function(err, user){
    return done(err, user);
   })
  }
));
passport.serializeUser(UserSchema.serializeUser());
passport.deserializeUser(UserSchema.deserializeUser());
// passport.serializeUser(function(user, done){
//     done(null, user);
// })

// passport.deserializeUser(function(user, done){
//     done(null, user);
// })

// cron clean up
cron.schedule('0 6 * * *', async () => {
    console.log(`Running cron job to cleanup at 6am`)
    await periodicRemove();
})

app.use((req, res, next) => {
    res.locals.activeLocation = req.path;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/', catchAsync(async (req, res) => {
    const isMobile = req.useragent['isMobile']
    const collections = await CollectionSchema.find({$or: [{isHide: false}, {isHide: null}]}).populate('cover').sort({order:-1});
    // save images to local
    const imageInfos = collections.map(collection => ({id: collection.cover.thumbnailId, type:collection.cover.fileType}))
    // background process of downloading images
    await downloadImages(imageInfos)

    // dynamically selecting if select google drive url or from disk
    const path = './public/images'
    const formattedCollections = collections.map(c => ({
        collectionName : c.collectionName,
        isHorizontal: c.cover.isHorizontal,
        src: `/images/${c.cover.thumbnailId}.${c.cover.fileType}`
    }))
    res.render('portfolio', {formattedCollections, isMobile});
}));

app.get('/about', async (req, res) => {
    const descriptions = await DescriptionSchema.find({category: 'CV'}).sort({order: 1});
    res.render('about', {descriptions});
});

app.get('/contact', async (req, res) => {
    const descriptions = await DescriptionSchema.find({category: 'Social'}).sort({order: 1});
    res.render('contact', {descriptions});
});

app.get('/login', (req, res) => {
    res.render('login')
});

app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect:'/login'}), (req, res) => {
    console.log('post login');
    console.log(req);
    res.redirect('/admin/portfolio');
})

app.get('/auth/google', 
    passport.authenticate('google', {scope: ['email', 'profile']})
);

app.get('/google/callback', 
            passport.authenticate('google', {
                successRedirect: '/admin/portfolio',
                failureRedirect: '/',
            })
)

app.use('/admin', adminRoutes);

app.get('/collection/:collectionName', catchAsync(async (req, res) => {
    const collectionName = req.params.collectionName;
    const options = {sort: [{'order': 'asc'}]};
    const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate({path: 'artworks', options}).populate('description');
    // const artworks = collection.artworks;
    const thumbnailImageInfos = collection.artworks.map(artwork => ({id: artwork.thumbnailId, type:artwork.fileType}))
    const actualImageInfos = collection.artworks.map(artwork => ({id: artwork.imageId, type:artwork.fileType}))
    // download in background
    await downloadImages([...thumbnailImageInfos, ...actualImageInfos])
     // dynamically selecting if select google drive url or from disk
    const path = './public/images'
    const description = {title: collection.description.title, description: collection.description.description}
    const formattedArtWork = collection.artworks.map(c => ({
        thumbnailSrc: `/images/${c.thumbnailId}.${c.fileType}`,
        imageSrc: `/images/${c.imageId}.${c.fileType}`
    }))
    res.render('collection', {description, formattedArtWork});
}));

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /");
});

app.get('/sitemap.xml', async (req,res) => {
    const collections = await CollectionSchema.find({});
    const urls = collections.map(collection => `/collection/${collection.collectionName}`)
    const sitemaps = await buildSitemaps(['/', '/about','/contact'].concat(urls), 'https://hummingsang.com');
    console.log(sitemaps);
    res.header('Content-Type', 'application/xml');
    res.send(sitemaps['/sitemap.xml']);
});

app.get('*', (req, res, next) => {
    res.status(404).render('error');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
