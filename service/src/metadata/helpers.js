import crypto from "crypto"
import { getPublicKey } from "../../keys/helpers.js"


//Packages public key into a standard jwks for distribution
export const buildJwks=()=>{

  const publicKeyPem = getPublicKey()
  const publicKey = crypto.createPublicKey(publicKeyPem)

  const jwk = publicKey.export({
    format: "jwk"
  })

  return {
    keys: [
      {
        ...jwk,
        kid: "auth-key-1",
        use: "sig",
        alg: "RS256"
      }
    ]
  }
}