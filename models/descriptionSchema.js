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
        enum: ['CV', 'Collection'],
        required: true
    }
});

module.exports = mongoose.model('DescriptionSchema', DescriptionSchema);