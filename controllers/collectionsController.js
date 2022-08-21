const artworksSchema = require("../models/artworkSchema");
const collectionSchema = require("../models/collectionSchema");
const descriptionSchema = require("../models/descriptionSchema");
const userSchema = require("../models/userSchema");

module.exports.createCollection = async(req, res, next) => {
    console.log(req);
    // thumbnail Url for artwork
    const artworks = req.files.map(artwork => new artworksSchema({
        thumbnailUrl: artwork.path,
        originalUrl: artwork.path,
        filename: artwork.filename,
    }))
}