import fs from "node:fs"

/**
 * Checks and returns private key
 */
export const getPrivateKey=(environment=process.env)=>{


  try{
    const privateKey = fs.readFileSync(
      process.env.JWT_PRIVATE_KEY_PATH,
      "utf8"
    )
    return privateKey
  }catch(error){
    throw new Error(`Failed to Read Private Key: ${error.message}`)
  }
}


/**
 * Checks and returns a general public key
 */
export const getPublicKey=(environment=process.env)=>{
  try{
    const publicKey = fs.readFileSync(
      process.env.JWT_PUBLIC_KEY_PATH,
      "utf8"
    )
    return publicKey
  }catch(error){
    throw new Error(`Failed to Read Public Key: ${error.message}`)
  }
}