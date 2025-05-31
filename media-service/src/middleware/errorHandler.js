const logger = require('../utils/logger');

const errorHandler = (err,req,res,next)=>{
    logger.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.messafe || "Internal server error"
    })

    next()
}

module.exports = errorHandler