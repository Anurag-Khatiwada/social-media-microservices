const logger = require('../utils/loggier');

const errorHandler = (err, req, res, next)=>{

    logger.error(err.stack);

    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    })

    next()
}

module.exports = errorHandler