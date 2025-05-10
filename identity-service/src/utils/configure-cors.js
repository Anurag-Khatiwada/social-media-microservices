const cors = require('cors');
const logger = require('./loggier')


const configureCors = ()=>{
    return cors({
        origin : (origin,callback)=>{
            const allowedOrigin = [
                "http://localhost:5000"
            ]
            if(!origin || allowedOrigin.indexOf(origin)){
                callback(null,true)
            }else{
                logger.warn("cors error occured")
                callback(new Error ("Not allowed by cors"))
            }
        },
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept-Version'

        ],
        exposedHeaders: [
            'X-Total-Count',
            'Content-Range'
        ],
        credentials: true,
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus: 204
    })
}

module.exports = configureCors