const ArtWorkSchema = require('../models/artworkSchema');
const CollectionSchema = require('../models/collectionSchema');
const DescriptionSchema = require('../models/descriptionSchema');

module.exports.createArtwork = (thumbnailId, imageId, fileName, isHorizontal, order, collectionSchema= null) => {
    if(collectionSchema) {
        return new ArtWorkSchema({
            thumbnailId: thumbnailId,
            imageId: imageId,
            fileName: fileName,
            isHorizontal: isHorizontal,
            order: order,
            createDate: new Date(),
            collectionSchema: collectionSchema,
        })
    }
    return new ArtWorkSchema({
        thumbnailId: thumbnailId,
        imageId: imageId,
        fileName: fileName,
        isHorizontal: isHorizontal,
        order: order,
        createDate: new Date()
    })
}

module.exports.createDescription = (title, description, category, order) => {
    return new DescriptionSchema({
        title: title,
        description: description,
        category: category,
        order: order
    })
}

module.exports.createCollection = (collectionName, cover, order, artworks, description) => {
    return new CollectionSchema({
        collectionName: collectionName,
        cover: cover,
        order: order,
        artworks: artworks,
        description: description,
        updateDate: new Date(),
        isHide: false
    })
}