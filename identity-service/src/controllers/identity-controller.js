
const logger = require('../utils/loggier')
const {validateRegistration} = require("../utils/validation")
const User = require("../models/User")
const generateToken = require('../utils/generateToken')

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

//logout


module.exports = {registerUser}