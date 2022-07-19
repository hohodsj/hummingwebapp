const mongoose = require('mongoose');
const ArtWorkSchema = require('./artworkSchema');
const Schema = mongoose.Schema;

// const ArtWork = new Schema({
//     url: String,
//     filename: String,
//     width: Number,
//     height: Number,
//     order: Number
// });

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
    }]
})

module.exports = mongoose.model('CollectionSchema', CollectionSchema);