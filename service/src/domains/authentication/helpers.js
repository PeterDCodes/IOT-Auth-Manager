import { getDeviceAuthenticationByUuid, validateHash } from "../devices/data.js"
import jwt from "jsonwebtoken"
import database from "../../data/database.js"

import { getPrivateKey } from "../../../keys/helpers.js"


/**
 * Loads the newest active token configuration with the given name.
 * @param {string} configName configuration name
 * @returns {Promise<object|null>} token settings, or null if no active config exists
 */
export const loadTokenConfig=async(configName)=>{
  const { rows: [config] } = await database.query(`
    SELECT issuer, audience, expires_in
    FROM config
    WHERE name = $1 AND active = TRUE
    ORDER BY dt_created DESC, cd_config DESC
    LIMIT 1
  `, [configName])

  if (!config) {
    return null
  }

  return {
    signingKey: getPrivateKey(),
    algorithm: "RS256",
    token_type: "Bearer",
    ...config
  }
}


/**
 * Validates a client secret against active devices in the DB. Used durring a token refresh request.
 * @param {string} uuid device UUID
 * @param {string} secret device secret
 * @return {bool} authorized status of true or false
 */
export const validateClientSecret=async(uuid, secret)=>{

  //Check if the device exists and is active
  const authentication = await getDeviceAuthenticationByUuid(uuid);
  if(!authentication || authentication.fl_active !== true){
    return false;
  }

  //Hash the key
  const { ds_hashed_key } = authentication
  const valid = await validateHash(secret, ds_hashed_key);

  return valid;
}


/**
 * Signs a JWT access token and returns it with its credential metadata.
 * @param {string} uuid
 * @param {string} config the name of the token config to use
 * @returns {Promise<{access_token: string, token_type: string, expires_in: string, config: string}|null>}
 */
export const signAccessToken = async(uuid, config="default") => {
  
  const settings = await loadTokenConfig(config)
  if (!settings) {
    return null
  }

  //jwt.sign(payload, secretOrPrivateKey, [options, callback])
  const access_token = jwt.sign(
    //Custom payload fields
    { uuid,
      key: settings.audience
    },
    //PrivateKey
    settings.signingKey,
    {
      //options
      algorithm: settings.algorithm,
      issuer: settings.issuer,
      audience: settings.audience,
      subject: uuid,
      expiresIn: settings.expires_in,
    }
  )

  return {
    access_token,
    token_type: settings.token_type,
    expires_in: settings.expires_in,
    config
  }
}




/**
 * Returns a signed credential, or null if the requested configuration is unavailable.
 * @param {string} uuid
 * @param {string} config the name of the token config to use
 * @returns {ReturnType<typeof signAccessToken>}
 */
export const buildCredential=(uuid, config)=>{
  return signAccessToken(uuid, config)
}
