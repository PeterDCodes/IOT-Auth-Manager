import jwt from "jsonwebtoken"
import { getTokenSettings } from "./token.js"

export const createAuthenticate = ({
  publicKey,
  secret,
  algorithm = publicKey ? "RS256" : "HS256",
  issuer = "client-register",
  audience = "device-apis"
} = {}) => {
  if (publicKey && secret) {
    throw new TypeError("Provide publicKey or secret, not both")
  }

  const verificationKey = publicKey ?? secret
  if (!verificationKey) {
    throw new TypeError("createAuthenticate requires publicKey or secret")
  }

  if (!["HS256", "RS256"].includes(algorithm)) {
    throw new TypeError("algorithm must be HS256 or RS256")
  }

  if (publicKey && algorithm !== "RS256") {
    throw new TypeError("publicKey requires the RS256 algorithm")
  }

  if (secret && algorithm !== "HS256") {
    throw new TypeError("secret requires the HS256 algorithm")
  }

  return (req, res, next) => {
    const authorization = req.headers.authorization
    const match = authorization?.match(/^Bearer ([^\s]+)$/i)

    if (!match) {
      return res.status(401).json({
        error: "Bearer access token required"
      })
    }

    try {
      req.auth = jwt.verify(match[1], verificationKey, {
        algorithms: [algorithm],
        issuer,
        audience
      })

      return next()
    } catch {
      return res.status(401).json({
        error: "Invalid or expired access token"
      })
    }
  }
}

let defaultAuthenticate

export const authenticate = (req, res, next) => {
  if (!defaultAuthenticate) {
    const settings = getTokenSettings()
    defaultAuthenticate = createAuthenticate({
      [settings.algorithm === "RS256" ? "publicKey" : "secret"]: settings.verificationKey,
      algorithm: settings.algorithm,
      issuer: settings.issuer,
      audience: settings.audience
    })
  }

  return defaultAuthenticate(req, res, next)
}

export default authenticate

