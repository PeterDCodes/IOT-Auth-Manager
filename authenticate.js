//Authentication Middlewear
import { getDeviceById, validateHash} from "./data/devices.js"


//TODO - need to refactor to no logner used req json body. Should instead use standard Authentication bearer header

export const authenticate = async (req, res, next) => {

  // 1. Execute any code
  // 2. Modify req or res objects
 const { id, key } = req.body ?? {}

   //Check if id was sent
  if(!id){
    return res.status(400).send("RES BODY MUST INCLUDE id")
  }

  //Check if key was sent
  if(!key){
    return res.status(400).send("RES BODY MUST INCLUDE key")
  }

  //Validate the token
  const authorized = await validateClientKey(id, key);

  console.log(authorized)

  if(authorized !== true){
    return res.status(403).send("UNAUTHORIZED DEVICE")
  }

  // 3. Call next() to move to the next function
  next();
};



//Method for token validation
/**
 * @param {INTEGER} id device ID
 * @param {string} key device key
 * @return {bool} authorized status of True or False
 */
const validateClientKey=async(id, key)=>{

  //Check if user exists with that id
  const user = getDeviceById(id);
  if(!user){
    return False;
  }

  //Hash the key
  const { hashed_key } = user
  const valid = await validateHash(key, hashed_key);

  return valid;
}