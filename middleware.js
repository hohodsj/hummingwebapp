const fs = require('fs');

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.flash('error', 'you must be signed in');
        return res.redirect('/login');
    }
    next();
}

module.exports.createUploadFolder = (req, res, next) => {
    fs.access('./uploads', (err) => {
        if(err) {
            fs.mkdir('./uploads');
        }
    })
    next();
}