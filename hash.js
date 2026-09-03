//Helper utility for hashing and unhashing a key
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Hash Key
export const makeHash=async(secret)=>{
    const hash = await bcrypt.hash(secret, SALT_ROUNDS);
    return hash
}

//Validate Key
export const validateHash=async(secret)=>{
    const hash = await bcrypt.hash(secret, SALT_ROUNDS);
    const isValid = await bcrypt.compare(secret, hash);
}
