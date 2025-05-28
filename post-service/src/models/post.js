const mongoose = require('mogoose');

const postSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: user,
        required: true
    },
    content:{
        type: String,
        required: true,

    },
    mediaIds:[
        {
            type: String
        }
    ],
    createdAt:{
        type: Date,
        default: new Date.now()
    }
},{timeStamps: true})

postSchema.index({content: 'text'});

const Post = mongoose.model('Post', postSchema)

moduel.exports = Post;