require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const logger = require('./utils/loggier')
const cors = require('cors')
const helmet = require('helmet')
const Redis = require('ioredis');
const {RateLimiterRedis} = require('rate-limiter-flexible')
const {rateLimit} = require("express-rate-limit")
const {RedisStore} = require("rate-limit-redis")
const registerRoute = require('./routes/identity-router')
const loginRoute = require('./routes/identity-router')
const refreshTokenRoute = require('./routes/identity-router')
const logoutRoute = require('./routes/identity-router')


const errorHandler = require('./middleware/error-handler')

const app = express();

//mongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>logger.info("connected to mongoDB"))
    .catch((e)=>logger.error("Mongo Connection error",e))

const redisClient = new Redis(process.env.REDIS_URL)

//middleWare
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})


//DDOS protection and reids rate limit
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient, // Client to apply the rate limit
    keyPrefix: 'middleware', //separates rate limit data from other redis data
    points: 10, //total no. of request allowed to made in the given duration of time
    duration: 1, //duration 
    blockDuration: 10 // block for 10 seconds after limit is exceeded
});

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip)
                .then(()=>next())
                .catch(()=>{
                    logger.warn(`Rate limit exceeded for ip: ${req.ip}`)
                    return res.status(429).json({
                        success: false,
                        message: "Too many request"
                    })
                })
})

// rate limiter to the sensetive routes

const sensitiveEndpointsLimiters = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res)=>{
        logger.warn(`sensitive rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "Too many requests"
        })
    },
    store: new RedisStore({
        sendCommand: (...args)=>redisClient.call(...args)
    })

})

//apply sensitive endpoint limiter
app.use('/api/auth/register', sensitiveEndpointsLimiters);
app.use('/api/auth/login', sensitiveEndpointsLimiters);


//routes
app.use("/api/auth", registerRoute)
app.use("/api/auth",loginRoute)
app.use("/api/auth",refreshTokenRoute)
app.use("/api/auth",logoutRoute)


//error handler
app.use(errorHandler);


app.listen(process.env.PORT, ()=>{
    logger.info(`Identity service running on port: ${process.env.PORT}`)
})

//unhandled promise rejection

process.on('unhandledRejection', (reason,promise)=>{
    logger.error(`Unhandled rejection at`,promise,"reason:", reason)
})