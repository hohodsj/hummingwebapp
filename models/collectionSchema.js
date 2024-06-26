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
        type: Schema.Types.ObjectId,
        ref:"ArtWorkSchema"
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
    },
    isHide: {
        type: Boolean,
        delete: false
    },
    updateDate: {
        type: Date
    }
})

CollectionSchema.post('findOneAndDelete', async function(collection) {
    if(collection) {
        await ArtWorkSchema.deleteMany({
            _id: {
                $in:collection.artworks
            }
        })
        await ArtWorkSchema.deleteOne({_id:collection.cover._id}) //delete cover
        await DescriptionSchema.deleteOne({_id:collection.description._id})
    }
})

module.exports = mongoose.model('CollectionSchema', CollectionSchema);