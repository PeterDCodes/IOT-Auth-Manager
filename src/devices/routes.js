import express from "express"
import { getDeviceById, getDevices } from "../data/devices.js"

const router = express.Router();

router.get("/", async(req, res) => {
  const devices = await getDevices();
  return res.json(devices)
});

router.get("/:id", async(req, res) => {
  const device = await getDeviceById(req.params.id);

  if (!device) {
    return res.status(404).send("Device not found");
  }

  return res.json(device);
});

export default router;

