const CollectionSchema = require('../models/collectionSchema');
const ArtworkSchema = require('../models/artworkSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const googleDriveUtil = require('./googleDriveUtil')
const fs = require("fs")

// remove collection from google drive
module.exports.removeCollection = async (collection) => {
    const cad = await CollectionSchema.findOne({collectionName: collection}).populate('cover').populate('artworks').populate('description');
    const ids = cad.artworks.reduce( (acc, cur) => {
        ArtworkSchema.remove({_id: cur._id});
        return acc.concat([cur.thumbnailId, cur.imageId]);
    }, [cad.cover.thumbnailId, cad.cover.imageId])
    ArtworkSchema.remove({_id: cad.cover._id});
    console.log(ids);
    try{
        await googleDriveUtil.deleteImageWithIds(ids);
        await CollectionSchema.findOneAndDelete({collectionName: collection});
        await DescriptionSchema.findOneAndDelete({_id: cad.description._id});
        await ArtworkSchema.deleteOne({_id: cad.cover._id});
        for(let artwork of cad.artworks) {
            await ArtworkSchema.findOneAndDelete({_id: artwork._id});
        }
        // return value for flash
        return ['success', `Collection: ${collection} deleted`]
    } catch(e) {
        return ['error', `Collection: ${collection} Not able to delete. ${e}`]
    }
}

// periodic /public/images remove
module.exports.periodicRemove = async() => {
    const path = './public/images'
    const now = Date.now()
    // remove one month old cached images
    fs.readdirSync(path).forEach(file => {
        const createDt = Date.parse(fs.statSync(`${path}/${file}`).birthtime)
        const daydiff = (now - createDt) / (1000 * 3600 * 24)
        if(daydiff > 30) {
            fs.unlinkSync(`${path}/${file}`)
        }
    })
    // clean up incorrect google drive images
    // find everything from db
    const allDBImages = await await ArtworkSchema.find({})
    const imageIds = allDBImages.reduce((set, img) => {
        set.add(img.thumbnailId);
        set.add(img.imageId);
        return set
    }, new Set());
    const allGoogleDriveImages = await googleDriveUtil.searchAllFiles()
    const googleImageIds = allGoogleDriveImages.map(img => img.id)
    // set(googleImageIds) - set(imageIds) = things should not be in google drive
    const deleteIds = new Set([...googleImageIds].filter(x => !imageIds.has(x)));
    googleDriveUtil.deleteImageWithIds(deleteIds)
}