import { getDeviceAuthenticationByUuid, validateHash } from "../devices/data.js"
import jwt from "jsonwebtoken"
import logger from "../../utils/logging.js"

import { getPrivateKey } from "../../../keys/helpers.js"

/**
 * Reads env file and returns token settings
 * @param environment process.env file
 */
export const getTokenSettings=(environment=process.env)=>{

  //Stub
  const tokenSettings = {
    signingKey: null,
    algorithm: null,
    issuer: null,
    audience: null,
    expires_in: null
  }
  //Try to get all values from env
  //TODO - set this up to be modified as needed with env
  try{
    //Get Key
    const privateKey = getPrivateKey()
    tokenSettings.signingKey = privateKey
    //Get Rest of token settings
    tokenSettings.algorithm = "RS256"
    tokenSettings.token_type = "Bearer"
    tokenSettings.issuer = environment.ISSUER
    tokenSettings.audience = environment.AUDIENCE
    tokenSettings.expires_in = environment.EXPIRES_IN
  }catch(error){
    logger.error("Missing Required Settings value: " + error);
  }

  //TODO - need my error handling cleaned up for end users calling the api
  return tokenSettings;
}


/**
 * Validates a client secret against active devices in the DB. Used durring a token refresh request.
 * @param {string} uuid device UUID
 * @param {string} secret device secret
 * @return {bool} authorized status of true or false
 */
export const validateClientSecret=async(uuid, secret)=>{

  //Check if the device exists and is active
  const authentication = await getDeviceAuthenticationByUuid(uuid);
  if(!authentication || authentication.fl_active !== true){
    return false;
  }

  //Hash the key
  const { ds_hashed_key } = authentication
  const valid = await validateHash(secret, ds_hashed_key);

  return valid;
}


/**
 * Signs a JWT access token
 * @param {string} uuid
 * @param { process.env } environment 
 * @returns 
 */
export const signAccessToken = (uuid, environment = process.env) => {
  
  const settings = getTokenSettings(environment)

  //jwt.sign(payload, secretOrPrivateKey, [options, callback])
  return jwt.sign(
    //Custom payload fields
    { uuid,
      key: settings.issuer
    },
    //PrivateKey
    settings.signingKey,
    {
      //options
      algorithm: settings.algorithm,
      issuer: settings.issuer,
      audience: settings.audience,
      subject: uuid,
      expiresIn: settings.expires_in,
    }
  )
}




/**
 * Creates and returns a full credential with signed JWT token
 * @param {string} uuid
 * @returns 
 */
export const buildCredential=(uuid)=>{

    //Read Settings
    const { token_type, expires_in } = getTokenSettings(process.env)

    //create a Signed JWT credential to return to the client
    const access_token = signAccessToken(uuid)
    
    //Returned back to a valid device.
    const credential = {
        "access_token": access_token,
        "token_type": token_type,
        "expires_in": expires_in
    };

    return credential;
}
