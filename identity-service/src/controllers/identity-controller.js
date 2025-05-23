
const logger = require('../utils/loggier')
const {validateRegistration,validateLogin} = require("../utils/validation")
const User = require("../models/User")
const generateToken = require('../utils/generateToken')
const RefreshToken = require('../models/refresh-token')

// user registration 

const registerUser = async (req,res)=>{
    logger.info("Registration URL hit...")

    try{
        //validating the schema using joi
        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn(`Validation error: ${error.details[0].message}`)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {username, email, password} = req.body

        let user = await User.findOne({$or: [{email},{username}]});
        if(user){
            logger.warn('User already exists');
            return res.status(409).json({
                success: false,
                message: "User already exists"
            })
        }

        user = await new User({username,email,password});

        await user.save();

        logger.warn("user registered successfully", user._id);

        const {accessToken, refreshToken} = await generateToken(user);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,
            refreshToken
        })


    }catch(e){
        logger.error('Registration error occured', e)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

//user login
const userLogin = async (req, res)=>{
    try{
        logger.info("Login URL hit...")
        const {error} = validateLogin(req.body)

        if(error){
            logger.warn(`Validation error: ${error.details[0].message}`)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {email, password} = req.body

        const user = await User.findOne({email});
        if(!user){
            logger.warn("Invalid User")
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        //validate password
        const isValid = await user.comparePassword(password);

        if(!isValid){
            logger.warn("Invalid credentials")
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const {accessToken, refreshToken} = await generateToken(user); 

        return res.status(200).json({
            success: true,
            accessToken,
            refreshToken
        })

    }catch(error){
       logger.error('Login error occured', error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        }) 
    }
}
//refresh Token
const userRefreshToken = async(req,res)=>{
    try{
        logger.info("Refresh token URL hit...")

        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn("Invalid refreshToken")
            return res.status(400).json({
                success: false,
                message: "Invalid refreshToken"
            })
        }

        const storedToken = await RefreshToken.findOne({token: refreshToken});
        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn("Invalid or expired storedToken")
            return res.status(401).json({
                success: false,
                message: "Invalid or expired storedToke"
            })
        }

        const user = await User.findById(storedToken.user)
        if(!user){
            logger.warn("Invalid User")
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await generateToken(user)

        //delete old token:
        await RefreshToken.deleteOne({_id:storedToken._id})

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })

    }catch(error){
        logger.error('Refresh token error occured', error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        }) 
    }
}
//logout
const userLogout = async(req,res)=>{
    try{
        logger.info("Logout URL hit...")
        const {refreshToken} = req.body

        if(!refreshToken){
            logger.warn("Invalid refreshToken")
            return res.status(400).json({
                success: false,
                message: "Invalid refreshToken"
            })
        }

        await RefreshToken.deleteOne({token: refreshToken});
        logger.info("User successfully logged out")


        res.status(200).json({
            success: true,
            message: "User successfully logged out"
        })

    }catch(e){
        logger.error('Refresh token error occured', error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        }) 
    }
}


module.exports = {registerUser, userLogin, userRefreshToken, userLogout}