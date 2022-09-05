const express = require('express');
const { isLoggedIn, createUploadFolder, isCollectionExists } = require('../middleware');
const router = express.Router();
const ArtWorkSchema = require('../models/artworkSchema');
const CollectionSchema = require('../models/collectionSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage});
const googleDriveUtil = require('../utils/googleDriveUtil');
const {removeCollection} = require('../utils/deleteUtils');
const { ids } = require('googleapis/build/src/apis/ids');

router.get('/portfolio', async(req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').sort({order:1});
    res.render('admin/edit-portfolio', {collections, admin:true});
});

router.route('/create-collection')
    .get(async(req, res) => {
        res.render('admin/create-collection', {input:null});
    })
    .post(upload.array('image'), isCollectionExists, createUploadFolder, async (req, res) => {
        let artworks = [];
        for(let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const [thumbnailId, imageId] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            const artwork = new ArtWorkSchema({
                thumbnailId: thumbnailId,
                imageId: imageId,
                fileName: file.originalname,
                order: i,
                createDate: new Date()
            })
            await artwork.save();
            artworks.push(artwork);
        }
        const description = new DescriptionSchema({
            title: req.body.collectionName,
            description: req.body.description,
            category: 'Collection'
        });
        description.save();
        const collection = new CollectionSchema({
            collectionName: req.body.collectionName,
            cover: artworks[0],
            order: 0,
            artworks: artworks,
            description: description,
            updateDate: new Date()
        });
        for (const artwork of artworks) {
            artwork.collectionSchema = collection;
            artwork.save();
        }
    
        await collection.save();
        res.redirect('./portfolio');
    })

router.get('/:collection', async(req, res) => {
    // res.send(`Collection: ${req.params.collection}`);
    const collectionName = req.params.collection;
    const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate('artworks').populate('description').sort({order:1});
    res.render('admin/edit-collection', {collection, admin:true})
})

router.delete('/all', async(req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').populate('artworks').populate('description');
    // remove all images
    for(collection of collections) {
        await removeCollection(collection.collectionName);
    }
    res.redirect('./portfolio')
})


router.delete('/artwork/:artworkId', async(req, res) => {
    let id = req.params.artworkId;
    const artwork = await ArtWorkSchema.findOne({_id: id}).populate('collectionSchema');
    const collectionId = artwork.collectionSchema._id;
    const artworkId = artwork._id;
    googleDriveUtil.deleteImageWithIds([artwork.thumbnailId, artwork.imageId]);
    ArtWorkSchema.remove({_id: id})
    
    CollectionSchema.findOneAndUpdate(
        {_id: collectionId}, 
        {$pull: {artworks: artworkId}},
         function (err, docs) {
        if(err) {
            req.flash('error', `Unable to remove ${artwork.fileName}, Error: ${err}`);
        } else {
            req.flash('success', `Remove ${artwork.fileName} successfully`);
        }
        res.redirect(`/admin/${artwork.collectionSchema.collectionName}`);
    })
    
})


router.delete('/:collection', async(req, res) => {
    const {collection} = req.params;
    const resp = await removeCollection(collection);
    req.flash(resp[0], resp[1]);
    res.redirect('./portfolio');
})

module.exports = router;