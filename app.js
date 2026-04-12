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
const { periodicRemove } = require('./utils/deleteUtils');
const cron = require('node-cron');
const useragent = require('express-useragent');
const mongoose = require('mongoose');

// Import configuration modules
const connectDB = require('./config/db');
const sessionConfig = require('./config/session');
const configurePassport = require('./config/passport');

// Import routes
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Configure Mongoose
mongoose.set('strictQuery', false);

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

// Mount public routes (portfolio, about, contact, collections, etc.)
app.use('/', publicRoutes);

// Mount authentication routes (login, Google OAuth)
app.use('/', authRoutes);

// Mount admin routes
app.use('/admin', adminRoutes);

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
