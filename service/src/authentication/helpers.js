import { getDeviceById, validateHash } from "../data/devices.js"
import jwt from "jsonwebtoken"
import * as fs from 'node:fs'; 



/**
 * Reads env file and returns token settings
 * @param environment process.env file
 */
const getTokenSettings=(environment)=>{

  //Stub
  const tokenSettings = {
    signingKey: null,
    algorithm: null,
    issuer: null,
    audience: null,
    expiresIn: null
  }


  //Try to get all values from env
  //TODO - set this up to be modified as needed with env
  try{
    //Get Key
    const privateKey = fs.readFileSync(
      process.env.JWT_PRIVATE_KEY_PATH,
      "utf8"
    )

    tokenSettings.signingKey = privateKey
    tokenSettings.algorithm = "RS256"
    tokenSettings.issuer = "PETER-TEMP"
    tokenSettings.audience = "IDK what this is"
    tokenSettings.expiresIn = environment.EXPIRES_IN
  }catch(error){
    console.log("Missing Required Settings value: " + error);
  }

  //TODO - need my error handling cleaned up for end users calling the api
  return tokenSettings;

}


/**
 * Validates a client secret against active devices in the DB. Used durring a token refresh request.
 * @param { number } cd_device device ID
 * @param {string} secret device secret
 * @return {bool} authorized status of true or false
 */
export const validateClientSecret=async(cd_device, secret)=>{

  //Check if the device exists and is active
  const user = await getDeviceById(cd_device);
  if(!user || user.active !== true){
    return false;
  }

  //Hash the key
  const { hashed_key } = user
  const valid = await validateHash(secret, hashed_key);

  return valid;
}


/**
 * Signs a JWT access token
 * @param { number } cdDevice 
 * @param { process.env } environment 
 * @returns 
 */
export const signAccessToken = (cdDevice, environment = process.env) => {
  
  const settings = getTokenSettings(environment)

  //jwt.sign(payload, secretOrPrivateKey, [options, callback])
  return jwt.sign(
    //Custom payload fields
    { cd_device: cdDevice },
    //PrivateKey
    settings.signingKey,
    {
      //options
      algorithm: settings.algorithm,
      issuer: settings.issuer,
      audience: settings.audience,
      subject: String(cdDevice),
      expiresIn: settings.expiresIn
    }
  )
}



/**
 * Creates and returns a full credential with signed JWT token
 * @param { number } cd_device 
 * @returns 
 */
export const buildCredential=(cd_device)=>{

    //create a Signed JWT credential to return to the client
    const access_token = signAccessToken(cd_device)
    const token_type = "Bearer"
    //TODO - replace this with the value read from settings
    const { expiresIn } = "15m"
    
    //Returned back to a valid device.
    const credential = {
        "access_token": access_token,
        "token_type": token_type,
        "expires_in": expiresIn
    };

    return credential;
}
