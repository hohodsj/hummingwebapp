const express = require('express');
const { isLoggedIn, createUploadFolder } = require('../middleware');
const router = express.Router();
const ArtWorkSchema = require('../models/artworkSchema');
const CollectionSchema = require('../models/collectionSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage});
const googleDriveUtil = require('../utils/googleDriveUtil');

router.get('/portfolio', async(req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').sort({order:1});
    res.render('./admin/edit-portfolio', {collections});
});

router.route('/create-collection')
    .get(async(req, res) => {
        res.render('admin/create-collection');
    })
    .post(upload.array('image'), createUploadFolder, async (req, res) => {
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
    
        await collection.save();
        res.redirect('/admin/create-collection');
    })

router.delete('/:collection', async(req, res) => {
    const {collection} = req.params;
    const collectionAndArtworks = await CollectionSchema.findOne({collectionName: collection}).populate('artworks');
    const ids = collectionAndArtworks.artworks.reduce( (acc, cur) => {
        return acc.concat([cur.thumbnailId, cur.imageId]);
    }, [])
    console.log(ids);
    googleDriveUtil.deleteImageWithIds(ids);
    //await CollectionSchema.findOneAndDelete({collectionName: collection});
    // add flash message
    res.redirect('/admin/portfolio');
})

module.exports = router;