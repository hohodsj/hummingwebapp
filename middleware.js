const fs = require('fs');
const CollectionSchema = require('./models/collectionSchema');

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated() || !req.user) {
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

module.exports.isCollectionExists = async (req, res, next) => {
    // collectionSchema.findOne({collectionName: req.body.collectionName})
    const resp = await CollectionSchema.findOne({collectionName: req.body.collectionName})
    CollectionSchema.countDocuments({collectionName: req.body.collectionName}, function (err, count) {
        if(err) {
            console.log(err);
            req.flash('error', err);
        }
        if(count == 0) {
            next();
        }
        if(count > 0) {
            req.flash('error', `Collection: ${req.body.collectionName} already exists`);
            res.render('admin/create-collection', {input:req.body});
            // return res.status(204).send();
        }
    })
}