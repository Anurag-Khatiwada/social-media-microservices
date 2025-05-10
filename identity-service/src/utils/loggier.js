const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
   
    //defining how we are going to formate the messages
    format: winston.format.combine(
        winston.format.timestamp(), //to timestamp the message
        winston.format.errors({stack: true}), // to stack the log entry if there is any error
        winston.format.splat(), //enable support for message templating
        winston.format.json() //formatting all the message in json
    ),
    defaultMeta: {service: "identity-service"},  //give metadata about what service we are using i.e identity-service in this case
    transports : [ //this will specify the output destination for log
        new winston.transports.Console({ // whenever we get some log it will apeerar in the treminla that is consoling the log
            format: winston.format.combine(
                winston.format.colorize(), //for better readability 
                winston.format.simple() // to make the log or transport simple
            )
        }),
        new winston.transports.File({filename: 'error.log', level:'error'}), // log the level of error
        new winston.transports.File({filename: 'combined.log'})  //combine the log

    ]
})

module.exports = logger