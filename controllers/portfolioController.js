const CollectionSchema = require('../models/collectionSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const ArtWorkSchema = require('../models/artworkSchema');
const googleDriveUtil = require('../utils/googleDriveUtil');
const { downloadImages } = require('../utils/googleDriveUtil');
const { generateImageAsync } = require('../utils/coverImgGenerator');
const { createArtwork, createDescription, createCollection } = require('../factory/factory');
const { formatCollectionForPortfolio } = require('../utils/formatArtwork');
const { removeCollection } = require('../utils/deleteUtils');

// GET /admin/portfolio - Show portfolio management page
module.exports.index = async (req, res) => {
    const showCollections = await CollectionSchema.find({ $or: [{ isHide: false }, { isHide: null }] }).populate('cover').sort({ order: -1 });
    const hideCollections = await CollectionSchema.find({ isHide: true }).populate('cover').sort({ order: -1 });
    const imageInfos = showCollections.map(collection => ({ id: collection.cover.thumbnailId, type: collection.cover.fileType }));
    const hideInfos = hideCollections.map(collection => ({ id: collection.cover.thumbnailId, type: collection.cover.fileType }));
    await downloadImages(imageInfos);
    await downloadImages(hideInfos);
    const formattedShowCollections = showCollections.map(formatCollectionForPortfolio);
    const formattedHideCollections = hideCollections.map(formatCollectionForPortfolio);
    req.flash('success', 'You are now Admin');
    res.render('admin/edit-portfolio', { formattedShowCollections, formattedHideCollections, admin: true, success: req.flash('success') });
};

// POST /admin/create-collection - Create new collection
module.exports.createCollection = async (req, res) => {
    const file = await generateImageAsync(555, 370, 100);
    const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(file.data, 'jpg');
    const collectionName = req.body.collectionName;
    const description = req.body.description;
    console.log(collectionName);
    console.log(description);
    const descriptionSchema = createDescription(collectionName, description, 'Collection');
    descriptionSchema.save();
    const cover = createArtwork(thumbnailId, imageId, 'coverNamePlaceHolder', isHorizontal, -1);
    await cover.save();
    const collectionCount = await CollectionSchema.countDocuments({});
    const collectionSchema = createCollection(collectionName, cover, collectionCount, [], descriptionSchema);
    await collectionSchema.save();
    const collection = await CollectionSchema.findOne({ collectionName: collectionName }).populate({ path: 'artworks' }).populate('description').populate({ path: 'cover' });
    const thumbnailImageInfos = collection.artworks.map(artwork => ({ id: artwork.thumbnailId, type: artwork.fileType }));
    const actualImageInfos = collection.artworks.map(artwork => ({ id: artwork.imageId, type: artwork.fileType }));
    const coverImageInfos = [{ id: collection.cover.thumbnailId, type: collection.cover.fileType }];
    await downloadImages([...thumbnailImageInfos, ...actualImageInfos, ...coverImageInfos]);
    const formattedArtWork = collection.artworks.map(c => ({
        ...c.toObject(),
        thumbnailSrc: `/images/${c.thumbnailId}.${c.fileType}`,
        imageSrc: `/images/${c.imageId}.${c.fileType}`,
    }));
    collection.artworks = formattedArtWork;
    collection.cover.thumbnailSrc = `/images/${collection.cover.thumbnailId}.${collection.cover.fileType}`;
    res.render('admin/edit-collection', { collection, admin: true });
};

// POST /admin/reorder/portfolio - Reorder collections
module.exports.reorder = async (req, res) => {
    const collectionOrders = req.body.orders.split(',');
    for (let i = 0; i < collectionOrders.length; i++) {
        const collectionOrder = collectionOrders[i];
        await CollectionSchema.findOneAndUpdate(
            { collectionName: collectionOrder },
            { $set: { order: collectionOrders.length - i - 1 } }
        );
    }
    res.redirect('/admin/portfolio');
};

// PATCH /admin/hide/:isHide/collection/:collectionName - Hide/unhide collection
module.exports.hide = async (req, res) => {
    console.log('hidding');
    const collectionName = req.params.collectionName;
    const isHide = req.params.isHide === 'true';
    const collection = await CollectionSchema.findOne({ collectionName: collectionName });
    if (isHide) {
        await CollectionSchema.findOneAndUpdate(
            { collectionName: collectionName },
            { $set: { isHide: isHide, order: -1 } }
        );
        // Adjust order of collections affected by hiding this one
        let startChangeOrder = collection.order;
        const updateCollectionOrder = await CollectionSchema.find({ order: { $gt: startChangeOrder } });
        for (let updateCollection of updateCollectionOrder) {
            await CollectionSchema.findOneAndUpdate(
                { _id: updateCollection._id },
                { $set: { isHide: false, order: updateCollection.order - 1 } }
            );
        }
    } else {
        const notHideCollectionCount = await CollectionSchema.countDocuments({ isHide: false });
        await CollectionSchema.findOneAndUpdate(
            { _id: collection._id },
            { $set: { isHide: isHide, order: notHideCollectionCount } }
        );
    }
    res.redirect('/admin/portfolio');
};

// DELETE /admin/all - Delete all collections and images
module.exports.deleteAll = async (req, res) => {
    const collections = await CollectionSchema.find({});
    collections.forEach(collection => (removeCollection(collection.collectionName)));
    await ArtWorkSchema.deleteMany({});
    await CollectionSchema.deleteMany({});
    await DescriptionSchema.deleteMany({ category: 'Collection' });
    await googleDriveUtil.deleteAllImages();
    res.redirect('/admin/portfolio');
};
