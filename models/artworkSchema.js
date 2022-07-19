const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArtWorkSchema = new Schema({
    thumbnailUrl: {
        type: String,
        required: true
    },
    originalUrl: {
        type: String,
        required: true,
    },
    filename:{
        type: String,
        required: true
    },
    originalWidth:{
        type: Number,
        required: true
    },
    originalHeight:{
        type: Number,
        required: true
    }, 
    order:{
        type: Number,
        required: true
    } 
});

module.exports = mongoose.model('ArtWorkSchema', ArtWorkSchema);