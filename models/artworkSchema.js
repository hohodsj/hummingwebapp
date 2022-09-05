const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArtWorkSchema = new Schema({
    thumbnailId: {
        type: String
    },
    imageId: {
        type: String
    },
    fileName:{
        type: String
    },
    collectionSchema: {
        type: Schema.Types.ObjectId,
        ref: 'CollectionSchema'
    },
    order:{
        type: Number
    },
    createDate: {
        type: Date
    }
});

ArtWorkSchema.virtual('thumbnailUrl').get(function() {
    return `https://drive.google.com/uc?id=${this.thumbnailId}`;
});

ArtWorkSchema.virtual('imageUrl').get(function() {
    return `https://drive.google.com/uc?id=${this.imageId}`;
})

module.exports = mongoose.model('ArtWorkSchema', ArtWorkSchema);