import { getDeviceById, validateHash } from "../data/devices.js"

import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.EXPIRES_IN;

//Method for token validation
/**
 * @param {INTEGER} id device ID
 * @param {string} secret device secret
 * @return {bool} authorized status of true or false
 */
export const validateClientSecret=async(id, secret)=>{

  //Check if user exists with that id
  const user = getDeviceById(id);
  if(!user){
    return false;
  }

  //Hash the key
  const { hashed_key } = user
  const valid = await validateHash(secret, hashed_key);

  return valid;
}

export const buildCredential=(id)=>{

    //create a Signed JWT credential to return to the client
    const access_token = getRefreshToken(id)
    const token_type = "Bearer"
    
    const credential = {
        "access_token": access_token,
        "token_type": token_type,
        "expires_in": EXPIRES_IN
    };

    return credential;
}


export const getRefreshToken=(id)=>{
    const payload = {
        deviceId: id,
    };

    const token = jwt.sign(
        payload,
        JWT_SECRET,
        {
            expiresIn: EXPIRES_IN
        }
    );

    return token;
}