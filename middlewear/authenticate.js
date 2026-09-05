//Authentication Middlewear
import { getDeviceById, validateHash} from "../data/devices.js"


//TODO - This middlewear will actually validate the JWT


export const authenticate = async (req, res, next) => {

  //TODO get the info needed from header

  //TODO check the token sent and check if its valid

  if(authorized !== true){
    return res.status(403).send("UNAUTHORIZED DEVICE")
  }

  // 3. Call next() to move to the next function
  next();
};



