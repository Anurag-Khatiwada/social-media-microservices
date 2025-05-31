const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    publicId:{
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType:{
        type: String,
        required: ture
    },
    url: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        ref: "User",
        required: true
    }
},{timestamps: true})

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media