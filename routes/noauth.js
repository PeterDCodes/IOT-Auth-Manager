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





 export default router;