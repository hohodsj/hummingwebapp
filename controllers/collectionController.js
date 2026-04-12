const CollectionSchema = require('../models/collectionSchema');
const ArtWorkSchema = require('../models/artworkSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const googleDriveUtil = require('../utils/googleDriveUtil');
const { downloadImages } = require('../utils/googleDriveUtil');
const { createArtwork } = require('../factory/factory');
const { formatArtworkForDisplay } = require('../utils/formatArtwork');
const { uploadCleanup } = require('../utils/uploadCleanup');
const { removeCollection } = require('../utils/deleteUtils');

// GET /admin/collection/:collectionName - Show collection edit page
module.exports.show = async (req, res) => {
    const collectionName = req.params.collectionName;
    const options = { sort: [{ order: 'asc' }] };
    const collection = await CollectionSchema.findOne({ collectionName: collectionName })
        .populate({ path: 'artworks', options })
        .populate('description')
        .populate({ path: 'cover' });
    const thumbnailImageInfos = collection.artworks.map(artwork => ({ id: artwork.thumbnailId, type: artwork.fileType }));
    const actualImageInfos = collection.artworks.map(artwork => ({ id: artwork.imageId, type: artwork.fileType }));
    await downloadImages([...thumbnailImageInfos, ...actualImageInfos]);
    const description = { title: collection.description.title, description: collection.description.description };
    const formattedArtWork = collection.artworks.map(formatArtworkForDisplay);
    const collectionObj = collection.toObject();
    collectionObj.artworks = formattedArtWork;
    collection.cover.thumbnailSrc = `/images/${collection.cover.thumbnailId}.${collection.cover.fileType}`;
    res.render('admin/edit-collection', { collection: collectionObj, admin: true });
};

// POST /admin/update/collection/:collectionId/:collectionName - Update collection and artworks
module.exports.update = async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const collection = await CollectionSchema.findOne({ _id: req.params.collectionId }).populate('description').populate('cover');
    const descriptionId = collection.description._id;
    const collectionId = req.params.collectionId;
    const collectionName = req.params.collectionName;
    
    // Update description
    await DescriptionSchema.findOneAndUpdate(
        { _id: descriptionId },
        { $set: { title: title, description: description } }
    );
    
    // Reorder artworks if provided
    if (req.body.orders) {
        const imgFilesOrderArr = req.body.orders.split(',');
        console.log(imgFilesOrderArr);
        for (let i = 0; i < imgFilesOrderArr.length; i++) {
            const imgFile = imgFilesOrderArr[i];
            console.log(`update origin order ${imgFile} to ${i}`);
            await ArtWorkSchema.findOneAndUpdate(
                { collectionSchema: collectionId, fileName: imgFile },
                { $set: { order: i } }
            );
        }
    }
    
    // Update cover image if provided
    if (req.files && req.files.cover) {
        try {
            const file = req.files.cover[0];
            const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(
                file.buffer,
                file.originalname.split('.').pop()
            );
            const cover = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, -1, collection);
            await cover.save();
            await googleDriveUtil.deleteImageWithIds([collection.cover.thumbnailId, collection.cover.imageId]);
            await ArtWorkSchema.deleteOne({ _id: collection.cover._id });
            collection.cover = cover;
            await collection.save();
        } catch (e) {
            console.log(`Error updating cover file ${file.originalname}`);
        }
    }
    
    // Add new artworks if provided
    if (req.files && req.files.image) {
        for (let i = 0; i < req.files.image.length; i++) {
            try {
                const file = req?.files?.image[i];
                const [thumbnailId, imageId, isHorizontal] = await googleDriveUtil.uploadImageToDrive(
                    file.buffer,
                    file.originalname.split('.').pop()
                );
                const artworksCount = await ArtWorkSchema.countDocuments({ collectionSchema: collectionId });
                const actualOrder = artworksCount - 1;
                const artwork = createArtwork(thumbnailId, imageId, file.originalname, isHorizontal, actualOrder, collection);
                await artwork.save();
                await CollectionSchema.updateOne(
                    { _id: collectionId },
                    { $push: { artworks: artwork } }
                );
            } catch (error) {
                console.log(`Error when updating image: ${file.originalname} error:${error}`);
            }
        }
    }
    uploadCleanup();
    res.redirect(`/admin/collection/${req.params.collectionName}`);
};

// DELETE /admin/collection/:collectionName - Delete collection
module.exports.destroy = async (req, res) => {
    const { collectionName } = req.params;
    const resp = await removeCollection(collectionName);
    req.flash(resp[0], resp[1]);
    res.redirect('/admin/portfolio');
};

// DELETE /admin/artwork/:artworkId - Delete artwork from collection
module.exports.deleteArtwork = async (req, res) => {
    let id = req.params.artworkId;
    const artwork = await ArtWorkSchema.findOne({ _id: id }).populate('collectionSchema');
    const collectionId = artwork.collectionSchema._id;
    const artworkId = artwork._id;
    const order = artwork.order;
    
    // Delete from Google Drive
    await googleDriveUtil.deleteImageWithIds([artwork.thumbnailId, artwork.imageId]);
    
    // Delete artwork from DB
    await ArtWorkSchema.deleteOne({ _id: id });
    
    // Reorder remaining artworks
    const count = await ArtWorkSchema.countDocuments({ collectionSchema: collectionId });
    for (let i = order + 1; i < count; i++) {
        const updatedOrder = i - 1;
        await ArtWorkSchema.findOneAndUpdate(
            { collectionSchema: collectionId, order: i },
            { $set: { order: updatedOrder } }
        );
    }
    
    // Remove artwork reference from collection
    await CollectionSchema.findOneAndUpdate(
        { _id: collectionId },
        { $pull: { artworks: artworkId } }
    );
    
    req.flash('success', `Remove ${artwork.fileName} successfully`);
    res.redirect(`/admin/collection/${artwork.collectionSchema.collectionName}`);
};
