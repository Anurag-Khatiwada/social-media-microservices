const logger = require('../utils/logger');
const Post = require("../models/post");


const createPost = async (req, res ) =>{
    try{

        logger.info("Create post Url hit..")
        const {content, mediaIds} = req.body;

        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        });

        await newlyCreatedPost.save();
        logger.info("Post created successfully", newlyCreatedPost);

        res.status(201).json({
            success: true,
            message: "Post created successfully"
        })

    }catch(error){
        logger.error("Error creating post", error);
        res.status(500).json({
            success: false,
            message: "Error creating post"
        })
    }
}

const getAllPosts = async (req, res ) =>{
    try{

    }catch(error){
        logger.error("Error fetching posts", error);
        res.status(500).json({
            success: false,
            message: "Error fetching posts"
        })
    }
}

const getPost = async (req, res ) =>{
    try{

    }catch(error){
        logger.error("Error fetching post", error);
        res.status(500).json({
            success: false,
            message: "Error fetching post"
        })
    }
}

const deletePost = async (req, res ) =>{
    try{

    }catch(error){
        logger.error("Error deleting post", error);
        res.status(500).json({
            success: false,
            message: "Error deleting post"
        })
    }
}


module.exports = {createPost, getAllPosts, getPost, deletePost}