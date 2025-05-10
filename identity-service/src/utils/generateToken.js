const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/refresh-token');

const generateToken = async (user)=>{
    const accessToken = jwt.sign({
        user: user._id,
        username: user.username
    },process.env.JWT_SECRET, {expiresIn: "60m"})

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) //token expires in 7 days


    //save the refresh token at database
    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    })

    return {accessToken, refreshToken}
}

module.exports = generateToken