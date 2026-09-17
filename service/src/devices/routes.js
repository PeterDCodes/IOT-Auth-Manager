import express from "express"
import { getDevices, getPublicDeviceById } from "../data/devices.js"

const router = express.Router();

router.get("/", async(req, res) => {
  const devices = await getDevices();
  return res.json(devices)
});

router.get("/:cd_device", async(req, res) => {
  const device = await getPublicDeviceById(req.params.cd_device);

  if (!device) {
    return res.status(404).send("Device not found");
  }

  return res.json(device);
});

export default router;
