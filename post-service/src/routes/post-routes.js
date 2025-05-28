const express = require("express");
const {createPost, getAllPosts, getPost, deletePost}= require("../controllers/post-controller")
const {authenticateRequest} = require("../middleware/authMiddleware")

const router = express.Router();

//middleware => this will tell if the user is authenticated user or not
router.use(authenticateRequest)

router.post('/create-post',createPost)
router.get('/',getAllPosts)

router.get('/',getPost)
router.get('/',deletePost)

module.exports = rotuer

