import pino from "pino";


export const logger = pino({
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


//Log a standard request

//Log a result of request



export default logger;