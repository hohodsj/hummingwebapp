const mongoose = require('mongoose');
const ArtWorkSchema = require('./artworkSchema');
const DescriptionSchema = require('./descriptionSchema');
const Schema = mongoose.Schema;

const CollectionSchema = new Schema({
    collectionName: {
        type: String,
        required: true,
        unique: true
    },
    cover: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    artworks: [{
        type: Schema.Types.ObjectId,
        ref: 'ArtWorkSchema'
    }],
    description: {
        type: Schema.Types. ObjectId,
        ref: 'DescriptionSchema'
    }
})

module.exports = mongoose.model('CollectionSchema', CollectionSchema);