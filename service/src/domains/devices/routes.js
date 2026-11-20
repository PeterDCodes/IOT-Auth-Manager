import express from "express"
import { getDevices, getPublicDeviceByUuid } from "./data.js"

const router = express.Router();

router.get("/", async(req, res) => {

  req.log.info({
    event: "DEVICE-LIST-REQUEST",
  });

  const devices = await getDevices();
  return res.json(devices)
});

router.get("/:uuid", async(req, res) => {
  const device = await getPublicDeviceByUuid(req.params.uuid);

  if (!device) {
    return res.status(404).send("Device not found");
  }

  return res.json(device);
});

export default router;
