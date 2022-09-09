const CollectionSchema = require('../models/collectionSchema');
const ArtworkSchema = require('../models/artworkSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const googleDriveUtil = require('../utils/googleDriveUtil');

module.exports.removeCollection = async (collection) => {
    const cad = await CollectionSchema.findOne({collectionName: collection}).populate('artworks').populate('description');
    const ids = cad.artworks.reduce( (acc, cur) => {
        ArtworkSchema.remove({_id: cur._id});
        return acc.concat([cur.thumbnailId, cur.imageId]);
    }, [])
    console.log(ids);
    try{
        await googleDriveUtil.deleteImageWithIds(ids);
        await CollectionSchema.findOneAndDelete({collectionName: collection});
        await DescriptionSchema.findOneAndDelete({_id: cad.description._id});
        await ArtworkSchema.deleteOne({_id: cad.cover._id});
        for(let artwork of cad.artworks) {
            await ArtworkSchema.findOneAndDelete({_id: artwork._id});
        }
        // add flash message
        return ['success', `Collection: ${collection} deleted`]
        //req.flash('success', );
    } catch(e) {
        return ['error', `Collection: ${collection} Not able to delete. ${e}`]
        //req.flash('error', `Collection: ${collection} Not able to delete. ${e}`);
    }
}