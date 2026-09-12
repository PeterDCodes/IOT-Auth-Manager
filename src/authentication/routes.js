//AUTH Routes
import express from "express"
import { registerNewDevice } from "../data/devices.js"
import { buildCredential, validateClientSecret } from "./helpers.js"


const router = express.Router();

//Register a device
//TODO - device registration should require a 4 digit code. ex: user sets up new device and is prompted to enter a code w/ device info before the submission.

//A route used to send a regstration request
router.post("/register", async (req, res) => {

  //Step 1 verify registration request body
  const register = req.body ?? {}
  const {id, name, serial, mac_addr, device_ip} = register

  if ([id, name, serial, mac_addr, device_ip].some(value => value == null)) {
    return res.status(400).send("Missing required fields");
  }

  //Initiate the registration
  const secret = await registerNewDevice(register)

  //Return the registration key back to the client
  return res.status(200).json({
    "message": "Device successfully Registered!",
    "secret": secret
  });
});

//Request a JWT from auth service
router.post("/refresh", async(req, res)=>{

    //Check the body for the device id and secret
    const {id, secret} = req.body ?? {}

    //Check if id was sent
    if(id == null){
    return res.status(400).send("Refresh request failed. res body must include id")
    }

    //Check if key was sent
    if(!secret){
    return res.status(400).send("Refresh request failed. res body must include secret")
    }

    //Validate the token
    const authorized = await validateClientSecret(id, secret);

    console.log("AUTH STATUS: " + authorized);

    if(authorized !== true){
    return res.status(403).send("Refresh request failed. UNAUTHORIZED DEVICE");
    }

    //Build and return credential to client
    const credential = buildCredential(id)
    return res.status(200).json(credential)

});

export default router
