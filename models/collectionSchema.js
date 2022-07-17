const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArtWork = new Schema({
    url: String,
    filename: String,
    width: Number,
    height: Number,
    order: Number
});

const CollectionSchema = new Schema({
    collectionName: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: true
    },
    order: Number,
    artworks: [ArtWork]
})

module.exports = mongoose.model('CollectionSchema', CollectionSchema);