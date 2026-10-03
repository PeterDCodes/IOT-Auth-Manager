//Logging util for all requests to the service
//Logs the authentication status as well as the devices id

//TODO - rebuild this as n object to handle all custom logging needs?

import pino from "pino";

export const authLogger = pino({
    level: "info"
});


//Standard request logger
export const logReq=({level='info', device_id=null, req=null, msg=null})=>{

    //Generate a request_id
    const request_id = crypto.randomUUID()
    //Get required information from the req
    const req_info = getReqInfo(req);

    const log = {
            request_id: request_id,
            device_id: device_id,
            msg: msg,
            req_info: req_info
            }
    switch(level){
        case "info":
            authLogger.info(log)
            break;
        case "warn":
            authLogger.warn(log)
            break;
        //TODO - want to warn when level is not properly set
        default:
            authLogger.info(log)
            break;
    }
}


//Takes in a raw req and extracts the key info needed
const getReqInfo=(req)=>{

    const url = req.originalUrl
    const user_agent = req.headers["user-agent"]

    return {
        url: url,
        user_agent: user_agent
    }
}