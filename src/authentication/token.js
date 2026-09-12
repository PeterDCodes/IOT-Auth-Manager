import fs from "node:fs"
import jwt from "jsonwebtoken"

const DEFAULT_ALGORITHM = "HS256"
const DEFAULT_ISSUER = "client-register"
const DEFAULT_AUDIENCE = "device-apis"

const readConfiguredKey = (value, path, name) => {
  if (value) {
    return value.replace(/\\n/g, "\n")
  }

  if (path) {
    return fs.readFileSync(path, "utf8")
  }

  throw new Error(`${name} is required`)
}

export const getTokenSettings = (environment = process.env) => {
  const algorithm = environment.JWT_ALGORITHM ?? DEFAULT_ALGORITHM
  const issuer = environment.JWT_ISSUER ?? DEFAULT_ISSUER
  const audience = environment.JWT_AUDIENCE ?? DEFAULT_AUDIENCE
  const expiresIn = environment.EXPIRES_IN ?? "15m"

  if (algorithm === "HS256") {
    if (!environment.JWT_SECRET) {
      throw new Error("JWT_SECRET is required when JWT_ALGORITHM is HS256")
    }

    return {
      algorithm,
      issuer,
      audience,
      expiresIn,
      signingKey: environment.JWT_SECRET,
      verificationKey: environment.JWT_SECRET
    }
  }

  if (algorithm === "RS256") {
    return {
      algorithm,
      issuer,
      audience,
      expiresIn,
      signingKey: readConfiguredKey(
        environment.JWT_PRIVATE_KEY,
        environment.JWT_PRIVATE_KEY_PATH,
        "JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH"
      ),
      verificationKey: readConfiguredKey(
        environment.JWT_PUBLIC_KEY,
        environment.JWT_PUBLIC_KEY_PATH,
        "JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH"
      )
    }
  }

  throw new Error("JWT_ALGORITHM must be HS256 or RS256")
}

export const signAccessToken = (deviceId, environment = process.env) => {
  const settings = getTokenSettings(environment)

  return jwt.sign(
    { deviceId },
    settings.signingKey,
    {
      algorithm: settings.algorithm,
      issuer: settings.issuer,
      audience: settings.audience,
      subject: String(deviceId),
      expiresIn: settings.expiresIn
    }
  )
}

