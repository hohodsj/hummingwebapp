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
// const {storage} = require('./cloudinary');
const storage = multer.memoryStorage();
const upload = multer({storage});
// const upload = multer({dest: 'uploads/'});
const {createCollection} = require("./controllers/collectionsController");
const sharp = require('sharp');
const fs = require('fs');
const GoogleDriveStorage = require('multer-google-drive');


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

app.get('/admin/create-collection', async(req, res) => {
    res.render('admin/create-collection');
})

// app.post('/admin/create-collection', isLoggedIn, upload.array('image'), async(req, res) => {
//     console.log(req.files);
//     res.redirect('/admin/portfolio');
// })

// app.post('/admin/create-collection', isLoggedIn, upload.array('image'), createCollection);
app.post('/admin/create-collection', upload.single('image'), async (req, res) => {
    console.log('file', req.file);
    console.log('body', req.body);
    fs.access('./uploads', (err) => {
        if(err) {
            fs.mkdir('./uploads');
        }
    })
    await sharp(req.file.buffer).resize({width: 100, height: 100}).toFile('./uploads/' + req.file.originalname);
});

app.get('/gd', async (req,res) => {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUrl = process.env.GOOGLE_DRIVE_REDIRECT_URL;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({version: 'v3', auth:client});
    try{
        /*
        const folderRsp = await drive.files.create({
            resource: {
                name: 'test',
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id,name',
        });
        console.log(`id: ${folderRsp.data.id}`);
        */

        // able to upload, need to put them in folder, and public accessiable
        const response = await drive.files.create({
            requestBody: {
                name:"a.png",
                mimeType: "image/png",
                //parents: ['1GHTRmOK7cJcNjw_LqJU6Nve4s20Mn0RU']
                parents: ['1cMJU3pMr110fmsIMRIgwCMozEF_uzeIY']
            },
            media: {
                mimeType: "image/png",
                body: fs.createReadStream("./uploads/a.png")
            }
        })
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
    }
    
    res.redirect('/');
})


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
