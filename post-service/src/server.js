require('dotenv').config()
const express = require('express');
const mongoose = require("mongoose");
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const cors = require('cors');
const helmet = require('helmet');
const postRoute = require('./routes/post-routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require("./utils/logger")
const postRoute = require('./routes/post-routes');

const app = express();
const PORT = process.env.PORT || 3002

//mongoDB connection:

mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            logger.info(`Connected to mongoDB`)
        })
        .catch((err)=>{
            logger.error("Mongo connection failed:", err.message)
        })

//middleware:
app.use(helmet());
app.use(cors());
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request at ${req.url}`);
    logger.info(`Request body: ${req.body}`)

    next();
})

//Redis client
const redisClient = new Redis(process.env.REDIS_URL)

//Rate limiting
const createRateLimiters = (options) =>{
    rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req,res)=>{
            logger.warn(`Rate limit excedeed on ${req.originalUrl} from ${req.ip}`);
            res.status(429).json({
                success: false,
                message: "Too many requests"
            })
        },
        store: new RedisStore({
            sendCommand: (...args)=>redisClient.call(...args)
        })
    })
}

//pre-route rate limiters
const createPostLimiter = createRateLimiters({windowMs:15*60*1000,max:10});
const getAllPostsLimiter = createRateLimiters({windowMs:1*60*1000, max:100});
const getPostLimiter = createRateLimiters({windowMs:1*60*1000, max:80});
const deletePostLimiter = createRateLimiters({ windowMs: 30 * 60 * 1000, max: 5 });

//Apply the rate limites to the routes
app.use('/api/posts/create-post',createPostLimiter)


//routes:
app.use(
    '/api/posts',
    (req,res,next)=>{
    req.redisClient = redisClient
    next()
    },
    postRoute
)

app.use(errorHandler)

app.listen(PORT,()=>{
    logger.info(`Post service running on port: ${PORT}`);
})

//unhandled promise rejection:
process.on(unhandledRejection, (reason,promise)=>{
    logger.error("unhandled promises at", promise, "reason:", reason)
})