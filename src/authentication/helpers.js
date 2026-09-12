import { getDeviceById, validateHash } from "../data/devices.js"
import { getTokenSettings, signAccessToken } from "./token.js"

//Method for token validation
/**
 * @param {INTEGER} id device ID
 * @param {string} secret device secret
 * @return {bool} authorized status of true or false
 */
export const validateClientSecret=async(id, secret)=>{

  //Check if user exists with that id
  const user = await getDeviceById(id);
  if(!user || user.active !== true){
    return false;
  }

  //Hash the key
  const { hashed_key } = user
  const valid = await validateHash(secret, hashed_key);

  return valid;
}

export const buildCredential=(id)=>{

    //create a Signed JWT credential to return to the client
    const access_token = getAccessToken(id)
    const token_type = "Bearer"
    const { expiresIn } = getTokenSettings()
    
    const credential = {
        "access_token": access_token,
        "token_type": token_type,
        "expires_in": expiresIn
    };

    return credential;
}


export const getAccessToken=(id)=>{
    return signAccessToken(id)
}
