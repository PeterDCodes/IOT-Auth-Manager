import jwt from "jsonwebtoken"
import {logReq} from "auth-middleware"


//Configures the authentication middlewear function
export const createAuthenticate = ({
  publicKey,
  algorithm = "RS256",
  issuer = "client-register",
  audience = "device-apis"
} = {}) => {

  //Factory Checks
  if (!publicKey) {
    throw new TypeError("createAuthenticate requires publicKey")
  }
  if (!["RS256"].includes(algorithm)) {
    throw new TypeError("algorithm must be RS256")
  }

  return (req, res, next) => {

    //Header requires x-device-id (cd_device)
    const device_id = req.headers['x-device-id']
    if(!device_id){
      const msg = "Device ID required"
      logReq({
        level: "warn",
        msg: msg,
        req: req
      });
      return res.status(401).json({
        error: msg
      })
    }

    //Checks incomming request for bearer token header
    const authorization = req.headers.authorization
    const match = authorization?.match(/^Bearer ([^\s]+)$/i)
    if (!match) {
      const msg = "Bearer access token required"
      logReq({
        level: "warn",
        device_id: device_id, 
        msg: msg,
        req: req
      });
      return res.status(401).json({
        error: msg
      })
    }

    //Verify the full JWT and its content.
    try {
      req.auth = jwt.verify(match[1], publicKey, {
        algorithms: [algorithm],
        issuer,
        audience
      })
      const msg = "Valid Request";
      logReq({
        level: "info",
        device_id: device_id, 
        msg: msg,
        req: req
      });
      return next()

    } catch(error) {
      //Raise 401 if token not valid
      const msg = "Invalid or expired access token"
      logReq({
        level: "warn",
        device_id: device_id, 
        msg: msg,
        req: req
      });
      return res.status(401).json({
        error: msg
      })
    }
  }
}



export default createAuthenticate

