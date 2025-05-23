// require('dotenv').config();
// const express  = require('express');
// const helmet = require('helmet');
// const cors = require("cors");
// const Redis = require('ioredis');
// const {rateLimit} = require('express-rate-limit');
// const {RedisStore} = require('rate-limit-redis')
// const logger = require("./utils/logger");
// const proxy = require("express-http-proxy");
// const errorHandler = require('../../identity-service/src/middleware/error-handler');


// const app = express();
// const PORT = process.env.PORT || 3000

// const redisClient = new Redis(process.env.REDIS_URL)

// //middleware
// app.use(helmet());
// app.use(cors());
// app.use(express.json());


// //rate limiter
// const ratelimit = rateLimit({
//     windowMs: 15*60*1000,
//     max: 50,
//     standardHeaders: true,
//     legacyHeaders: false,
//     handler: (req,res)=>{
//         logger.warn(`Rate limit excedded for IP: ${req.ip}`);
//         res.status(429).json({
//             success: false,
//             message: "To many request"
//         })
//     },
//     store: new RedisStore({
//         sendCommand: (...args)=>redisClient.call(...args)
//     }),

// }) 

// app.use(ratelimit)

// app.use((req,res,next)=>{
//     logger.info(`Received ${req.method} request for ${req.url}`);
//     logger.info(`Request body: ${JSON.stringify(req.body)}`)
//     next();
// })

// //setting up proxy:

// const proxyOptions = {
//     proxyReqPathResolver: (req)=>{
//         return req.originalUrl.replace(/^\/v1/, "/api")
//     },
//     proxyErrorHandler: (err,res,next)=>{
//         logger.error(`Error occured as: ${err.message}`);
//         res.status(500).json({
//             message: "Internal server error", error: err.message
//         })
//     }

// }

// app.use("/v1/auth", proxy(process.env.IDENTITY_SERVICE,{
//     ...proxyOptions,
//    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
//   proxyReqOpts.headers = proxyReqOpts.headers || {};
//   proxyReqOpts.headers["Content-Type"] = "application/json";
//   return proxyReqOpts;
// },
//     userResDecorator: (proxyRes, proxyResData, userReq, userRes)=>{
//       logger.info(`Response received from identity service: ${proxyRes.statusCode}`)
//         return proxyResData
//     }
// }))

// app.use(errorHandler)

// app.listen(PORT,()=>{
//     logger.info(`API gateway is running on Port: ${PORT}`)
//     logger.info(`Identity Service is running on port: ${process.env.IDENTITY_SERVICE} `)
//     logger.info(`Redis Url: ${process.env.REDIS_URL} `)

// })

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const errorHandler = require('../../identity-service/src/middleware/error-handler');

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiter
const ratelimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(ratelimit);

// Log requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request for ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Proxy setup

// const proxyOptions = {
//     proxyReqPathResolver: (req)=>{
//         return req.originalUrl.replace(/^\/v1/, "/api")
//     },
//     proxyErrorHandler: (err,res,next)=>{
//         logger.error(`Error occured as: ${err.message}`);
//         res.status(500).json({
//             message: "Internal server error", error: err.message
//         })
//     }

// }
app.use(
  '/v1/auth',
  proxy(process.env.IDENTITY_SERVICE, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl.replace(/^\/v1/, '/api');
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers = proxyReqOpts.headers || {};
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response received from identity service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error(`Proxy error: ${err.message}`, {
        stack: err.stack,
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
      res.status(500).json({
        message: 'Internal server error',
        error: err.message,
      });
    },
  })
);

// Global error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port: ${PORT}`);
  logger.info(`Identity Service URL: ${process.env.IDENTITY_SERVICE}`);
  logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});
