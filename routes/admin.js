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
const {createArtwork, createDescription, createCollection} = require('../factory/factory');
const {zip} = require('../utils/zip')

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
            // res.redirect('create-collection')
            //res.render('admin/create-collection', {input:{collectionName:req.body.collectionName, description:req.body.description}});
            return
        }
        const collectionName = req.body.collectionName;
        const file = req.files.cover[0];
        const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
        const cover = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, -1);
        await cover.save();

        for(let i = 0; i < req.files.image.length; i++) {
            const file = req.files.image[i];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            const artwork = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, i);
            await artwork.save();
            artworks.push(artwork);
        }
        const description = createDescription(collectionName, req.body.description, 'Collection');
        description.save();
        const collectionCount = await CollectionSchema.countDocuments({});
        const collection = createCollection(collectionName, cover, collectionCount, artworks, description);
        artworks.push(cover);

        artworks.forEach(artwork => {
            artwork.collectionSchema = collection;
            artwork.save();
        })
        await collection.save();
        req.flash('success', 'Successfully upload');
        res.redirect('./portfolio');
    }))

router.post('/reorder/portfolio', async(req, res) => {
    const ordersArr = req.body.orders.split(',');
    console.log(ordersArr);
    for(let i = 0; i < ordersArr.length; i++) {
        const oriOrder = ordersArr[i];
        if(i != oriOrder) {
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
    DescriptionSchema.findOneAndUpdate(
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
        const cover = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, -1, collection);
        await cover.save();
        await googleDriveUtil.deleteImageWithIds([collection.cover.thumbnailId, collection.cover.imageId]);
        ArtWorkSchema.remove({_id: collection.cover._id});
        collection.cover = cover;
        await collection.save();
    }
    
    if(req.files.image) {
        for(let i = 0; i < req.files.image.length; i++) {
            const file = req.files.image[i];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            // const collectionCount = await CollectionSchema.countDocuments({});
            const artworksCount = await ArtWorkSchema.countDocuments({collectionSchema: collectionId});
            const actualOrder = artworksCount - 1;
            const artwork = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, actualOrder, collection);
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

router.route('/about')
    .get(async(req,res) => {
        const descriptions = await DescriptionSchema.find({category: 'CV'}).sort({order: 1});
        res.render('admin/edit-about', {descriptions, admin:true});
    })
    .post(async(req, res) => {
        const titleDescriptionPair = zip([req.body.title, req.body.description]);
        await DescriptionSchema.remove({category: 'CV'});
        for(let i = 0; i < titleDescriptionPair.length; i++) {
            const titleDescription = titleDescriptionPair[i];
            if(titleDescription[0] && titleDescription[1]) {
                console.log(titleDescription);
                const description = createDescription(titleDescription[0], titleDescription[1], 'CV', i);
                await description.save();
            } 
        }
        res.redirect('/admin/about');
    })

router.route('/contact')
    .get(async(req, res) => {
        const iconDescriptions = await DescriptionSchema.find({category: 'Social'}).sort({order:1});
        res.render('admin/edit-contact', {iconDescriptions, admin:true})
    })
    .post(async(req, res) => {
        const titleDescriptionPair = zip([req.body.title, req.body.description]);
        await DescriptionSchema.remove({category: 'Social'});
        for(let i = 0; i < titleDescriptionPair.length; i++) {
            const titleDescription = titleDescriptionPair[i];
            if(titleDescription[0] && titleDescription[1]) {
                let title = titleDescription[0];
                if(title.includes("<i class=")) {
                    title = title.split("\"")[1];
                }
                const description = createDescription(title, titleDescription[1], 'Social', i);
                await description.save();
            } 
        }
        res.redirect('/admin/contact');
    })

router.get('/:collection', async(req, res) => {
    // res.send(`Collection: ${req.params.collection}`);
    const collectionName = req.params.collection;
    const options = {sort: [{'order': 'asc'}]};
    const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate({path: 'artworks', options}).populate('description');
    res.render('admin/edit-collection', {collection, admin:true})
})

router.delete('/all', async(req, res) => {
    const collections = await CollectionSchema.find({});
    collections.forEach(collection => (removeCollection(collection.collectionName)));
    res.redirect('./portfolio')
})


router.delete('/artwork/:artworkId', async(req, res) => {
    let id = req.params.artworkId;
    const artwork = await ArtWorkSchema.findOne({_id: id}).populate('collectionSchema');
    const collectionId = artwork.collectionSchema._id;
    const artworkId = artwork._id;
    const order = artwork.order;
    await googleDriveUtil.deleteImageWithIds([artwork.thumbnailId, artwork.imageId]);
    await ArtWorkSchema.remove({_id: id})
    const artworks = await CollectionSchema.findOne({_id: collectionId}).populate('artworks');
    // const count = await CollectionSchema.findOne({_id: collectionId}).populate('artworks').countDocuments({});
    const count = await ArtWorkSchema.countDocuments({collectionSchema: collectionId}); // count cover, remove 1 img same length as expected
    for(let i = order + 1; i < count; i++) {
        const updatedOrder = i - 1;
        ArtWorkSchema.findOneAndUpdate(
            {collectionSchema: collectionId, order: i},
            {$set: {order: updatedOrder}}, // <------------------ syntax here
            function(err, docs) {
                if(err) console.log(err)
                else console.log(docs)
            }
        )
    }
    
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