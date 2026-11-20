import express from "express"
import { getDeviceTypeById, getDeviceTypes } from "./data.js"

const router = express.Router()

router.get("/", async(req, res) => {
  return res.json(await getDeviceTypes())
})

router.get("/:cd_device_type", async(req, res) => {
  const deviceType = await getDeviceTypeById(req.params.cd_device_type)

  if (!deviceType) {
    return res.status(404).send("Device type not found")
  }

  return res.json(deviceType)
})

export default router
