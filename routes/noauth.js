import express from 'express'
import { registerNewDevice, getDevices} from "../data/devices.js"

const router = express.Router();


//UNPROTECTED ROUTES
//Test route to see if can connect
router.get('/', (req, res) => {
  res.send('Home Page');
});


router.get('/devices', async(req, res) => {
  
  const devices = await getDevices();

  return res.json(devices)
});



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