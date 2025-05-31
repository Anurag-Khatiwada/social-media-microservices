const Media = require("../models/media");
const { uploadMedaiaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");


const uploadMedis = async(req,res)=>{
    logger.info("Starting media upload")
    try{
        if(!req.file){
        logger.error("No file found. Please attach a file and try again");
            return res.status(400).json({
                success: false,
                message:"No file found. Please attach a file and try again"
            })
        }

        const {originalName, mimeType, buffer} = req.file;
        const userId = req.user.userId

        logger.info(`File details: name = ${originalName}, type = ${mimeType}`)
        logger.info("Uploading to cloudinary started...");

        const cloudinaryUploadResult = await uploadMedaiaToCloudinary(req.file);

        logger.info(`Media upload to cloudinary successful, public Id: ${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName,
            mimeType,
            url: cloudinaryUploadResult.secure_url,
            userId
        });

        await newlyCreatedMedia.save();

        res.status(201).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: "Media uploaded successfully"
        })
    }catch(error){
        logger.error("Internal server error occured", error)
    }
}