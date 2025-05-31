const cloudinary = require('cloudinary').v2
const logger = require('./logger');

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})

const uploadMedaiaToCloudinary = (file)=>{

    return new Promise((resolve,reject)=>{
        const uploadeStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto"
            },
            (err,result)=>{
                if(err){
                    logger.error("Error uploading media to cloudinary", err)
                    reject(err)
                }else{
                    resolve(result)

                }

            }
        )
        uploadeStream.end(file.buffer)
    })
}


module.exports = {uploadMedaiaToCloudinary}