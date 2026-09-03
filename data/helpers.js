import crypto from "crypto"


//Helper utility for hashing and unhashing a key
import bcrypt from "bcrypt";
const SALT_ROUNDS = 12;
// Hash Key
/**
*@param {string} secret secret key valur
*@return {string} hashed secret
*/
export const makeHash=async(secret)=>{
    const hash = await bcrypt.hash(secret, SALT_ROUNDS);
    return hash
}
//Validate Key when given by user as part of auth
export const validateHash=async(secret)=>{
    const hash = await bcrypt.hash(secret, SALT_ROUNDS);
    const isValid = await bcrypt.compare(secret, hash);
}


//Build client key
export const makeKey=()=>{
    //Generate random key for user
    const key = crypto.randomBytes(32).toString('hex'); // Generates 64 hex characters
    return key;
}



