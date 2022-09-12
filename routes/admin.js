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
const catchAsync = require('../utils/catchAsync');
const descriptionSchema = require('../models/descriptionSchema');
const collectionSchema = require('../models/collectionSchema');

router.get('/portfolio', async(req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').sort({order:1});
    res.render('admin/edit-portfolio', {collections, admin:true});
});

router.route('/create-collection')
    .get(async(req, res) => {
        res.render('admin/create-collection', {input:null});
    })
    .post(upload.fields([{name:'cover'}, {name: 'image'}]), isCollectionExists, createUploadFolder, catchAsync( async (req, res) => {
        let artworks = [];
        if(!req.files.cover || !req.files.image) {
            req.flash('error', `Cover and images cannot be empty`);
            res.redirect('create-collection')
            //res.render('admin/create-collection', {input:{collectionName:req.body.collectionName, description:req.body.description}});
            return
        }
        const file = req.files.cover[0];
        const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
        const cover = new ArtWorkSchema({
            thumbnailId: thumbnailId,
            imageId: imageId,
            fileName: file.originalname,
            isHorizontal: isHorizontal,
            order: -1,
            createDate: new Date()
        })
        await cover.save();

        for(let i = 0; i < req.files.image.length; i++) {
            const file = req.files.image[i];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            const artwork = new ArtWorkSchema({
                thumbnailId: thumbnailId,
                imageId: imageId,
                fileName: file.originalname,
                isHorizontal: isHorizontal,
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
        const collectionCount = await CollectionSchema.countDocuments({});
        const collection = new CollectionSchema({
            collectionName: req.body.collectionName,
            cover: cover,
            order: collectionCount,
            artworks: artworks,
            description: description,
            updateDate: new Date()
        });
        artworks.push(cover);
        for (const artwork of artworks) {
            artwork.collectionSchema = collection;
            artwork.save();
        }
    
        await collection.save();
        res.redirect('./portfolio');
    }))

router.post('/reorder/portfolio', async(req, res) => {
    const ordersArr = req.body.orders.split(',');
    console.log(ordersArr);
    for(let i = 0; i < ordersArr.length; i++) {
        const oriOrder = ordersArr[i];
        if(i != oriOrder) {
            console.log(`update origin order ${oriOrder} to ${i}`);
            CollectionSchema.findOneAndUpdate(
                {order: oriOrder}, 
                {$set: {order: i}},
                 function (err, docs) {
                if(err) {
                    req.flash('error', `Unable to update order ${oriOrder} to ${i} , Error: ${err}`);
                } 
            })
        }
    }
    res.redirect(`/admin/portfolio`);
})

router.post('/update/collection/:collectionId/:collectionName', upload.fields([{name:'cover'}, {name: 'image'}]), isCollectionExists, createUploadFolder, async(req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const collection = await CollectionSchema.findOne({_id:req.params.collectionId}).populate('description').populate('cover');
    const descriptionId = collection.description._id;
    const collectionId = req.params.collectionId;
    const collectionName = req.params.collectionName;
    descriptionSchema.findOneAndUpdate(
        {_id: descriptionId},
        {$set: {title: title, description:description}},
        function (err, docs) {
            if(err) {
                console.log(err)
            } else {
                console.log(docs)
            }
        }
    )
    if(req.body.orders) {
        const ordersArr = req.body.orders.split(',');
        console.log(ordersArr);
        for(let i = 0; i < ordersArr.length; i++) {
            const oriOrder = ordersArr[i];
            if(i != oriOrder) {
                console.log(`update origin order ${oriOrder} to ${i}`);
                ArtWorkSchema.findOneAndUpdate(
                    {collectionSchema: collectionId, order: oriOrder}, 
                    {$set: {order: i}},
                    function (err, docs) {
                    if(err) {
                        req.flash('error', `Unable to update order ${oriOrder} to ${i} , Error: ${err}`);
                    } 
                })
            }
        }
    }
    if(req.files.cover) {
        const file = req.files.cover[0];
        const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
        const cover = new ArtWorkSchema({
            thumbnailId: thumbnailId,
            imageId: imageId,
            fileName: file.originalname,
            isHorizontal: isHorizontal,
            order: -1,
            createDate: new Date(),
            collectionSchema: collection
        })
        await cover.save();
        const oldCover = collection.cover;
        await googleDriveUtil.deleteImageWithIds([oldCover.thumbnailId, oldCover.imageId]);
        ArtWorkSchema.remove({_id: oldCover._id});
        collection.cover = cover;
        await collection.save();
    }
    
    if(req.files.image) {
        for(let i = 0; i < req.files.image.length; i++) {
            const file = req.files.image[i];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            // const collectionCount = await CollectionSchema.countDocuments({});
            const artworksCount = await ArtWorkSchema.countDocuments({collectionSchema: collectionId});
            const artwork = new ArtWorkSchema({
                thumbnailId: thumbnailId,
                imageId: imageId,
                fileName: file.originalname,
                order: artworksCount,
                isHorizontal: isHorizontal,
                createDate: new Date(),
                collectionSchema: collection,
            })
            await artwork.save();
            CollectionSchema.updateOne(
                {_id: collectionId},
                {$push: {artworks: artwork}},
                function (err, docs) {
                    if(err) {
                        console.log(err)
                    } else {
                        console.log(docs)
                    }
                }
            );
        }
    }
    res.redirect(`/admin/${req.params.collectionName}`);
})

router.get('/:collection', async(req, res) => {
    // res.send(`Collection: ${req.params.collection}`);
    const collectionName = req.params.collection;
    const options = {sort: [{'order': 'asc'}]};
    const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate({path: 'artworks', options}).populate('description');
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