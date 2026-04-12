const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login page - show login form
router.get('/login', (req, res) => {
    res.render('login');
});

// Login POST - authenticate user with local strategy
router.post('/login', 
    passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), 
    (req, res) => {
        res.redirect('/admin/portfolio');
    }
);

// Google OAuth - initiate Google login
router.get('/auth/google', 
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

// Google OAuth callback - handle Google auth response
router.get('/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/admin/portfolio',
        failureRedirect: '/',
    })
);

module.exports = router;
