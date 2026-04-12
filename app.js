require('dotenv').config();
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const {buildSitemaps} = require('express-sitemap-xml');
const {downloadImages} = require('./utils/googleDriveUtil');
const {periodicRemove} = require('./utils/deleteUtils')
const cron = require('node-cron')
const useragent = require('express-useragent')

// Import configuration modules
const connectDB = require('./config/db');
const sessionConfig = require('./config/session');
const configurePassport = require('./config/passport');

// Import database and route models
const catchAsync = require('./utils/catchAsync');
const { formatCollectionForPortfolio, formatArtworkForDisplay } = require('./utils/formatArtwork');
const ArtWorkSchema = require('./models/artworkSchema');
const CollectionSchema = require('./models/collectionSchema');
const DescriptionSchema = require('./models/descriptionSchema');
const adminRoutes = require('./routes/admin');

// Connect to database
connectDB();

const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}));
app.use(bodyParser.text());
app.use(express.static(path.join(__dirname, 'public')));
app.use(useragent.express())
app.use(methodOverride('_method'));

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(require('./models/userSchema').authenticate()));
// Configure Google OAuth strategy
configurePassport();

// cron clean up - only run in production environments
if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 6 * * *', async () => {
        console.log(`Running cron job to cleanup at 6am`)
        await periodicRemove();
    })
}

app.use((req, res, next) => {
    res.locals.activeLocation = req.path;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/', catchAsync(async (req, res) => {
    const isMobile = req.useragent['isMobile']
    const collections = await CollectionSchema.find({$or: [{isHide: false}, {isHide: null}]}).populate('cover').sort({order:-1});
    const imageInfos = collections.map(collection => ({id: collection.cover.thumbnailId, type:collection.cover.fileType}))
    await downloadImages(imageInfos)
    const formattedCollections = collections.map(formatCollectionForPortfolio);
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
    const thumbnailImageInfos = collection.artworks.map(artwork => ({id: artwork.thumbnailId, type:artwork.fileType}))
    const actualImageInfos = collection.artworks.map(artwork => ({id: artwork.imageId, type:artwork.fileType}))
    await downloadImages([...thumbnailImageInfos, ...actualImageInfos])
    const description = {title: collection.description.title, description: collection.description.description}
    const formattedArtWork = collection.artworks.map(formatArtworkForDisplay);
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
    res.header('Content-Type', 'application/xml');
    res.send(sitemaps['/sitemap.xml']);
});

app.get('*', (req, res, next) => {
    res.status(404).render('error');
});

const port = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}

module.exports = app;
