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
const {zip} = require('../utils/zip');
const {uploadCleanup} = require('../utils/uploadCleanup');
const {createArtwork, createDescription, createCollection} = require('../factory/factory');
const passport = require('passport');
const {generateImageAsync} = require('../utils/coverImgGenerator')


router.get('/portfolio', isLoggedIn, async(req, res) => {
    const collections = await CollectionSchema.find({}).populate('cover').sort({order:1});
    req.flash('success', 'You are now Admin')
    res.render('admin/edit-portfolio', {collections, admin:true, success:req.flash("success")});
});

router.route('/create-collection', isLoggedIn)
    .get(async(req, res) => {
        res.render('admin/create-collection', {input:null});
    })
    .post(upload.fields([{name:'cover'}, {name: 'image'}]), isCollectionExists, createUploadFolder, catchAsync( async (req, res) => {
        let artworks = [];
        if(!req.files.cover ) {
            req.flash('error', `Cover image cannot be empty`);
            // res.redirect('create-collection')
            res.render('admin/create-collection', {input:{collectionName:req.body.collectionName, description:req.body.description}, error:req.flash("error")});
        } else {
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
            uploadCleanup();
            req.flash('success', 'Successfully upload');
            res.redirect('./portfolio');
        }
    }))

    router.post('/create-collection2', isLoggedIn, async(req, res) => {
        
        const file = await generateImageAsync(555, 370, 100);
        const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.data, 'jpg');
        const collectionName = req.body.collectionName;
        const description = req.body.description;
        console.log(collectionName)
        console.log(description)
        const descriptionSchema = createDescription(collectionName, description, 'Collection');
        descriptionSchema.save();
        const cover = createArtwork(thumbnailId, imageId, "coverNamePlaceHolder", isHorizontal, -1); // put random image here
        await cover.save();
        const collectionCount = await CollectionSchema.countDocuments({});
        const collectionSchema = createCollection(collectionName, cover, collectionCount, [], descriptionSchema);
        await collectionSchema.save();
        const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate({path: 'artworks'}).populate('description').populate({path: 'cover'});
        res.render(`admin/edit-collection`, {collection, admin:true});
    })

router.post('/reorder/portfolio', isLoggedIn, async(req, res) => {
    // use profile name since order can have concurrency issue without using await
    const collectionOrders = req.body.orders.split(',');
    // collectionOrders contains list of profile names in the new order
    console.log(collectionOrders);

    for(let i = 0; i < collectionOrders.length; i++) {
        const collectionOrder = collectionOrders[i];
        CollectionSchema.findOneAndUpdate(
            {collectionName: collectionOrder}, 
            {$set: {order: i}},
                function (err, docs) {
                if(err) {
                    req.flash('error', `Unable to update ${collectionOrder} , Error: ${err}`);
                } else{
                    console.log(`reordered ${collectionOrder} `)
                }
        })
    }
    res.redirect(`/admin/portfolio`);
})

// Update collection, add/remove image, update title/description
router.post('/update/collection/:collectionId/:collectionName', isLoggedIn, upload.fields([{name:'cover'}, {name: 'image'}]), isCollectionExists, createUploadFolder, async(req, res) => {
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
        // uses image file name inside of delete button
        const imgFilesOrderArr = req.body.orders.split(',');
        console.log(imgFilesOrderArr);
        for(let i = 0; i < imgFilesOrderArr.length; i++) {
            const imgFile = imgFilesOrderArr[i];
            console.log(`update origin order ${imgFile} to ${i}`);
            ArtWorkSchema.findOneAndUpdate(
                {collectionSchema: collectionId, fileName: imgFile}, 
                {$set: {order: i}},
                function (err, docs) {
                if(err) {
                    req.flash('error', `Unable to update file ${imgFile} to order ${i} , Error: ${err}`);
                } 
            })
        }
    }
    if(req.files.cover) {
        try{
            const file = req.files.cover[0];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            const cover = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, -1, collection);
            await cover.save();
            await googleDriveUtil.deleteImageWithIds([collection.cover.thumbnailId, collection.cover.imageId]);
            ArtWorkSchema.remove({_id: collection.cover._id});
            collection.cover = cover;
            await collection.save();
        }catch(e) {
            console.log(`Error updating cover file ${file.originalname}`)
        }
        
    }
    
    if(req.files.image) {
        for(let i = 0; i < req.files.image.length; i++) {
            try{
                const file = req?.files?.image[i];
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
            } catch(error) {
                console.log(`Error when updating image: ${file.originalname} error:${error} `)
            }
        }
    }
    uploadCleanup();
    res.redirect(`/admin/collection/${req.params.collectionName}`);
})

router.route('/about', isLoggedIn)
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

router.route('/contact', isLoggedIn)
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

router.route('/collection/:collectionName', isLoggedIn)
    .get(async(req, res) => {
        const collectionName = req.params.collectionName;
        const options = {sort: [{'order': 'asc'}]};
        const collection = await CollectionSchema.findOne({collectionName: collectionName}).populate({path: 'artworks', options}).populate('description').populate({path: 'cover'});
        res.render('admin/edit-collection', {collection, admin:true})
    })
    .delete(async(req, res) => {
        const {collectionName} = req.params;
        const resp = await removeCollection(collectionName);
        req.flash(resp[0], resp[1]);
        res.redirect('/admin/portfolio');
    })

router.delete('/all', isLoggedIn, async(req, res) => {
    const collections = await CollectionSchema.find({});
    collections.forEach(collection => (removeCollection(collection.collectionName)));
    await ArtWorkSchema.deleteMany({});
    await CollectionSchema.deleteMany({});
    await DescriptionSchema.deleteMany({category:"Collection"});
    await googleDriveUtil.deleteAllImages();
    res.redirect('/admin/portfolio')
})


router.delete('/artwork/:artworkId', isLoggedIn, async(req, res) => {
    let id = req.params.artworkId;
    const artwork = await ArtWorkSchema.findOne({_id: id}).populate('collectionSchema');
    const collectionId = artwork.collectionSchema._id;
    const artworkId = artwork._id;
    const order = artwork.order;
    await googleDriveUtil.deleteImageWithIds([artwork.thumbnailId, artwork.imageId]);
    await ArtWorkSchema.deleteOne({_id: id})
    const artworks = await CollectionSchema.findOne({_id: collectionId}).populate('artworks');
    // const count = await CollectionSchema.findOne({_id: collectionId}).populate('artworks').countDocuments({});
    const count = await ArtWorkSchema.countDocuments({collectionSchema: collectionId}); // count cover, remove 1 img same length as expected
    for(let i = order + 1; i < count; i++) {
        const updatedOrder = i - 1; // shift everything after to a position before
        ArtWorkSchema.findOneAndUpdate(
            {collectionSchema: collectionId, order: i},
            {$set: {order: updatedOrder}},
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
        res.redirect(`/admin/collection/${artwork.collectionSchema.collectionName}`);
    })  
})

router.get('*', isLoggedIn, (req, res) => {
    res.status(404).render('admin/admin-error');
})



module.exports = router;