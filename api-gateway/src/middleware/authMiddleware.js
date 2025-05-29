const logger = require('../utils/logger')
const jwt = require('jsonwebtoken')

const validateToken = (req, res, next)=>{

    const authHeader = req.header('authorization');
    const token = authHeader && authHeader.split(" ")[1]

    if(!token){
        logger.warn("Access attempted without token")
        return res.status(401).json({
            message: "Authentication required! Please login",
            success: false
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.warn("Invalid token");
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // ✅ Set req.user properly
    req.user = {
        userId: decoded.user || decoded.userId || decoded._id
    };


    next()
})
};

module.exports = validateToken