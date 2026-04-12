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
const {generateImageAsync} = require('../utils/coverImgGenerator')
const {downloadImages} = require('../utils/googleDriveUtil');
const {formatCollectionForPortfolio, formatArtworkForDisplay} = require('../utils/formatArtwork');


router.get('/portfolio', isLoggedIn, async(req, res) => {
    const showCollections = await CollectionSchema.find({$or: [{isHide: false}, {isHide: null}]}).populate('cover').sort({order:-1});
    const hideCollections = await CollectionSchema.find({isHide: true}).populate('cover').sort({order:-1});
    const imageInfos = showCollections.map(collection => ({id: collection.cover.thumbnailId, type:collection.cover.fileType}))
    const hideInfos = hideCollections.map(collection => ({id: collection.cover.thumbnailId, type:collection.cover.fileType}))
    await downloadImages(imageInfos)
    await downloadImages(hideInfos)
    const formattedShowCollections = showCollections.map(formatCollectionForPortfolio);
    const formattedHideCollections = hideCollections.map(formatCollectionForPortfolio);
    req.flash('success', 'You are now Admin')
    res.render('admin/edit-portfolio', {formattedShowCollections, formattedHideCollections, admin:true, success:req.flash("success")});
});

router.post('/create-collection', isLoggedIn, createUploadFolder, isCollectionExists, async(req, res) => {
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
    const thumbnailImageInfos = collection.artworks.map(artwork => ({id: artwork.thumbnailId, type:artwork.fileType}))
    const actualImageInfos = collection.artworks.map(artwork => ({id: artwork.imageId, type:artwork.fileType}))
    const coverImageInfos = [{id:collection.cover.thumbnailId, type: collection.cover.fileType}]
    await downloadImages([...thumbnailImageInfos, ...actualImageInfos, ...coverImageInfos])
    const formattedArtWork = collection.artworks.map(formatArtworkForDisplay)
    collection.artworks = formattedArtWork;
    collection.cover.thumbnailSrc = `/images/${collection.cover.thumbnailId}.${collection.cover.fileType}`
    
    res.render(`admin/edit-collection`, {collection, admin:true});
})

router.post('/reorder/portfolio', isLoggedIn, async(req, res) => {
    const collectionOrders = req.body.orders.split(',');
    for (let i = 0; i < collectionOrders.length; i++) {
        const collectionOrder = collectionOrders[i];
        await CollectionSchema.findOneAndUpdate(
            { collectionName: collectionOrder },
            { $set: { order: collectionOrders.length - i - 1 } }
        );
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
    await DescriptionSchema.findOneAndUpdate(
        {_id: descriptionId},
        {$set: {title: title, description:description}}
    );
    if(req.body.orders) {
        // uses image file name inside of delete button
        const imgFilesOrderArr = req.body.orders.split(',');
        console.log(imgFilesOrderArr);
        for(let i = 0; i < imgFilesOrderArr.length; i++) {
            const imgFile = imgFilesOrderArr[i];
            console.log(`update origin order ${imgFile} to ${i}`);
            await ArtWorkSchema.findOneAndUpdate(
                {collectionSchema: collectionId, fileName: imgFile}, 
                {$set: {order: i}}
            );
        }
    }
    if(req.files && req.files.cover) {
        try{
            const file = req.files.cover[0];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
            const cover = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, -1, collection);
            await cover.save();
            await googleDriveUtil.deleteImageWithIds([collection.cover.thumbnailId, collection.cover.imageId]);
            await ArtWorkSchema.deleteOne({_id: collection.cover._id});
            collection.cover = cover;
            await collection.save();
        }catch(e) {
            console.log(`Error updating cover file ${file.originalname}`)
        }
        
    }
    
    if(req.files && req.files.image) {
        for(let i = 0; i < req.files.image.length; i++) {
            try{
                const file = req?.files?.image[i];
                const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.buffer, file.originalname.split('.').pop());
                // const collectionCount = await CollectionSchema.countDocuments({});
                const artworksCount = await ArtWorkSchema.countDocuments({collectionSchema: collectionId});
                const actualOrder = artworksCount - 1;
                const artwork = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, actualOrder, collection);
                await artwork.save();
                await CollectionSchema.updateOne(
                    {_id: collectionId},
                    {$push: {artworks: artwork}}
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
        await DescriptionSchema.deleteMany({category: 'CV'});
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
        await DescriptionSchema.deleteMany({category: 'Social'});
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
        // const artworks = collection.artworks;
        const thumbnailImageInfos = collection.artworks.map(artwork => ({id: artwork.thumbnailId, type:artwork.fileType}))
        const actualImageInfos = collection.artworks.map(artwork => ({id: artwork.imageId, type:artwork.fileType}))
        const coverInfos = [
            {id: collection.cover.thumbnailId, type:collection.cover.fileType}, 
            {id: collection.cover.imageId, type:collection.cover.fileType}]
        // download in background
        await downloadImages([...thumbnailImageInfos, ...actualImageInfos])
        // dynamically selecting if select google drive url or from disk
        const path = './public/images'
        const description = {title: collection.description.title, description: collection.description.description}
        
        const formattedArtWork = collection.artworks.map(formatArtworkForDisplay);
        const collectionObj = collection.toObject(); // Convert the entire collection to a plain object
        collectionObj.artworks = formattedArtWork; // Assign the formatted artworks

        collection.cover.thumbnailSrc = `/images/${collection.cover.thumbnailId}.${collection.cover.fileType}`
        res.render('admin/edit-collection', {collection: collectionObj, admin:true})
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
        await ArtWorkSchema.findOneAndUpdate(
            {collectionSchema: collectionId, order: i},
            {$set: {order: updatedOrder}}
        );
    }
    
    await CollectionSchema.findOneAndUpdate(
        {_id: collectionId}, 
        {$pull: {artworks: artworkId}}
    );
    req.flash('success', `Remove ${artwork.fileName} successfully`);
    res.redirect(`/admin/collection/${artwork.collectionSchema.collectionName}`);  
})

router.patch("/hide/:isHide/collection/:collectionName", isLoggedIn, async(req, res) => {
    console.log("hidding")
    const collectionName = req.params.collectionName;
    const isHide = req.params.isHide === 'true';
    const collection = await CollectionSchema.findOne(
        {collectionName: collectionName}
    );
    if(isHide) {
        await CollectionSchema.findOneAndUpdate(
            {collectionName: collectionName},
            {$set: {isHide: isHide, order: -1}}
        );
        // since we hide one collection, we need to adjust everything that's affected
        let startChangeOrder = collection.order;
        const updateCollectionOrder = await CollectionSchema.find({order: {"$gt": startChangeOrder}});
        for(let updateCollection of updateCollectionOrder) {
            await CollectionSchema.findOneAndUpdate(
                {_id: updateCollection._id},
                {$set: {isHide: false, order: updateCollection.order - 1}}
            );
        }
    } else {
        const notHideCollectionCount = await CollectionSchema.countDocuments({ isHide: false });
        await CollectionSchema.findOneAndUpdate(
            {_id: collection._id},
            {$set: {isHide: isHide, order: notHideCollectionCount}}
        );
    }
    
    res.redirect(`/admin/portfolio`)
})

router.get('*', isLoggedIn, (req, res) => {
    res.status(404).render('admin/admin-error');
})



module.exports = router;