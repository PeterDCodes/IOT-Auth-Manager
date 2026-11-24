//AUTH Routes
import express from "express"
import { registerNewDevice, updateLastRefresh } from "../devices/data.js"
import { buildCredential, validateClientSecret } from "./helpers.js"
import { validateRefresh } from "./validation.js"
import logger from "../../utils/logging.js"


const router = express.Router();

//Register a device
//A route used to send a regstration request
router.post("/register", async (req, res) => {

  req.log.info({
    event: "DEVICE-REGISTRATION-REQUEST",
  });


  //If defined in the settings then payload should include registation code
  if (process.env.REGISTRATION_CODE && req.get("x-registration-code") !== process.env.REGISTRATION_CODE) {
    return res.status(403).json({
      error: "Valid registration code required"
    })
  }

  //Initiate the registration
  try{
    const { uuid, secret } = await registerNewDevice(req.body)

    if (secret) {
      return res.status(200).json({
        message: "Device successfully registered and authenticated",
        uuid,
        secret
      })
    }

    return res.status(200).json({
      message: "Device successfully registered"
    })
  }catch(error){
    return res.status(400).send(error.cause?.message ?? error.message)
  }
});

//Request a JWT for an authorized device
router.post("/refresh", async(req, res)=>{

    try {
      validateRefresh(req.body)
    } catch (error) {
      return res.status(400).send(error.message)
    }

    const { uuid, secret, config } = req.body

    //Validate the token
    const authorized = await validateClientSecret(uuid, secret);

    //TODO - Set up formal logging feature
    logger.info("AUTH STATUS: " + authorized);

    if(authorized !== true){
    return res.status(403).send("Refresh request failed. UNAUTHORIZED DEVICE");
    }

    //Build and return credential to client
    const credential = await buildCredential(uuid, config)
    if (!credential) {
      return res.status(400).json({ error: "No active token configuration found for the requested config" })
    }

    await updateLastRefresh(uuid)
    return res.status(200).json(credential)

});

export default router
