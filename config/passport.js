const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const UserSchema = require('../models/userSchema');

const configurePassport = () => {
   passport.use(
       new GoogleStrategy(
           {
               clientID: process.env.GOOGLE_DRIVE_CLIENT_ID,
               clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
               callbackURL: '/google/callback',
               passReqToCallback: true,
               proxy: true,
           },
           async function (request, accessToken, refreshToken, profile, done) {
               UserSchema.findByUsername(profile.email, function (err, user) {
                   return done(err, user);
               });
           }
       )
   );
   passport.serializeUser(UserSchema.serializeUser());
   passport.deserializeUser(UserSchema.deserializeUser());
};

module.exports = configurePassport;
