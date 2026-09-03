import crypto from "crypto"
import addDevice from "./database.js"

//Define a simple sqlite connection
//Connect to sqlite DB
//Verify valid user and make sure no duplicate info
//Register new user with their key
//Return Key


//Create key and register new device
export const registerNewDevice=(id, serial, mac_addr, device_ip)=>{

    //TODO error handling

    //Create Key
    const key = makeKey();
    //Hash key

    //Return original key to client
    return key

}



//Build client key
const makeKey=()=>{
    //Generate random key for user
    const key = crypto.randomBytes(32).toString('hex'); // Generates 64 hex characters
    return key;
}


