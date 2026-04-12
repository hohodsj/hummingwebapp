const express = require('express');
const { isLoggedIn, createUploadFolder, isCollectionExists } = require('../middleware');
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage});
const catchAsync = require('../utils/catchAsync');

// Import controllers
const portfolioController = require('../controllers/portfolioController');
const collectionController = require('../controllers/collectionController');
const aboutController = require('../controllers/aboutController');
const contactController = require('../controllers/contactController');

// Portfolio Routes
router.get('/portfolio', isLoggedIn, catchAsync(portfolioController.index));

router.post('/create-collection', isLoggedIn, createUploadFolder, isCollectionExists, catchAsync(portfolioController.createCollection));

router.post('/reorder/portfolio', isLoggedIn, catchAsync(portfolioController.reorder));

router.patch("/hide/:isHide/collection/:collectionName", isLoggedIn, catchAsync(portfolioController.hide));

router.delete('/all', isLoggedIn, catchAsync(portfolioController.deleteAll));

// Collection Routes
router.route('/collection/:collectionName', isLoggedIn)
    .get(catchAsync(collectionController.show))
    .delete(catchAsync(collectionController.destroy));

router.post('/update/collection/:collectionId/:collectionName', isLoggedIn, upload.fields([{name:'cover'}, {name: 'image'}]), isCollectionExists, createUploadFolder, catchAsync(collectionController.update));

router.delete('/artwork/:artworkId', isLoggedIn, catchAsync(collectionController.deleteArtwork));

// About Routes
router.route('/about', isLoggedIn)
    .get(catchAsync(aboutController.show))
    .post(catchAsync(aboutController.update));

// Contact Routes
router.route('/contact', isLoggedIn)
    .get(catchAsync(contactController.show))
    .post(catchAsync(contactController.update));

// 404 Handler
router.get('*', isLoggedIn, (req, res) => {
    res.status(404).render('admin/admin-error');
})

module.exports = router;