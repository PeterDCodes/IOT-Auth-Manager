import jwt from "jsonwebtoken"


//Configures the authentication middlewear function
export const createAuthenticate = ({
  publicKey,
  algorithm = "RS256",
  issuer = "client-register",
  audience = "device-apis"
} = {}) => {

  if (!publicKey) {
    throw new TypeError("createAuthenticate requires publicKey")
  }
  if (!["RS256"].includes(algorithm)) {
    throw new TypeError("algorithm must be RS256")
  }


  return (req, res, next) => {
    //Checks incomming request for bearer token header
    const authorization = req.headers.authorization
    const match = authorization?.match(/^Bearer ([^\s]+)$/i)

    if (!match) {
      return res.status(401).json({
        error: "Bearer access token required"
      })
    }

    //Verify the full JWT and its content.
    try {
      req.auth = jwt.verify(match[1], publicKey, {
        algorithms: [algorithm],
        issuer,
        audience
      })

      return next()
    } catch {
        //Raise 401 if token not valid
      return res.status(401).json({
        error: "Invalid or expired access token"
      })
    }
  }
}



export default createAuthenticate

