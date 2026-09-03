
import express from 'express'
const router = express.Router();

import { registerNewDevice} from data.js

//UNPROTECTED ROUTES
//Test route to see if can connect
router.get('/', (req, res) => {
  res.send('Home Page');
});



// Fake Register REQ
const RegisterRequest = {
  deviceID: 1,
  serial: "A-12345",
  mac_addr: "00:1A:2B:3C:4D:5E",
  device_ip: "192.168.7.198"
}


//A route used to send a regstration request
router.post('/register', async (req, res) => {


  //Step 1 verify registration request body
  const register = req.body ?? {}
  const {id, name, serial, mac_addr, device_ip} = register

  if ([id, name, serial, mac_addr, device_ip].some(value => value == null)) {
    return res.status(400).send("Missing required fields");
  }

  //Initiate the registration
  const secret = await registerNewDevice(id, name, serial, mac_addr, device_ip)

  //Return the registration key back to the client
  return res.status(200).json({
    "message": "Device successfully Registered!",
    "secret": secret
  });
});

 export default router;