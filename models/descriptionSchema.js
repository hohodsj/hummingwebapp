const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DescriptionSchema = new Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    category: {
        type: String,
        enum: ['CV', 'Collection', 'Social'],
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('DescriptionSchema', DescriptionSchema);