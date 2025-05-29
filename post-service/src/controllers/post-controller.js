const logger = require("../utils/logger");
const Post = require("../models/post");
const {validateCreatePost} = require("../utils/validation");

async function invalidatePostsCahce(req,input){

    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);


    const keys = await req.redisClient.keys("posts:*");
    if(keys.length>0){
        await req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    logger.info("Create post Url hit..");

  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await invalidatePostsCahce(req, newlyCreatedPost._id.toString())
    logger.info("Post created successfully", newlyCreatedPost);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
    logger.info("Get all post url hit")
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1)*limit

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if(cachedPosts){
        return res.status(200).json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit);
    
    const totalNoOfPosts = await Post.countDocuments();

    const result = {
        posts,
        currentPage: page,
        totalPages: totalNoOfPosts/limit,
        totalPosts: totalNoOfPosts
    }

    //save the post in the redis cache:
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.status(200).json({
        success: true,
        result
    })

  } catch (error) {
    logger.error("Error fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

const getPost = async (req, res) => {
    logger.info(`Get single post url hit...`)
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey)

    if(cachedPost){
        return res.status(200).json(JSON.parse(cachedPost));
    }

    const singlePost = await Post.findById(postId);
    if(!singlePost){
        return res.status(404).json({
            success: false,
            message: "Post not found"
        })
    };

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePost));

    res.status(200).json({
        success: true,
        singlePost
    })

  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

const deletePost = async (req, res) => {
    logger.info(`Delete post url hit...`)
  try {
    const postId = req.params.id;
    const post = await Post.findOneAndDelete({
        _id: postId,
        user: req.user.userId
    })
    if(!post){
        return res.status(404).json({
            success: false,
            message: "Post not found"
        })
    };

    //Deleting the post form the cache
    await invalidatePostsCahce(req,postId)

    res.status(200).json({
        success:true,
        message: "post deleted successfully"
    })
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
