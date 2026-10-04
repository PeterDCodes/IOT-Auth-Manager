//AUTH Routes
import express from "express"
import { registerNewDevice, updateLastRefresh } from "../devices/data.js"
import { buildCredential, validateClientSecret, validateRefresh } from "./helpers.js"
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

  //Step 1 verify registration request body
  const register = req.body ?? {}
  const {name, serial, mac_addr, device_ip} = register

  if ([name, serial, mac_addr, device_ip].some(value => value == null)) {
    return res.status(400).send("Missing required fields");
  }

  //Initiate the registration
  try{
    const { cd_device, secret } = await registerNewDevice(register)

    //Return the registration key back to the client
    return res.status(200).json({
      "message": "Device successfully Registered!",
      "cd_device": cd_device,
      "secret": secret
    });
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

    //Check the body for the database-generated device code and secret
    const {cd_device, secret} = req.body

    //Validate the token
    const authorized = await validateClientSecret(cd_device, secret);

    //TODO - Set up formal logging feature
    logger.info("AUTH STATUS: " + authorized);

    if(authorized !== true){
    return res.status(403).send("Refresh request failed. UNAUTHORIZED DEVICE");
    }

    //Build and return credential to client
    const credential = buildCredential(cd_device)
    await updateLastRefresh(cd_device)
    return res.status(200).json(credential)

});

export default router
