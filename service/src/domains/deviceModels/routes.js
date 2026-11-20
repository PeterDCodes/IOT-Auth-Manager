import express from "express"
import { getDeviceModelById, getDeviceModels } from "./data.js"

const router = express.Router()

router.get("/", async(req, res) => {
  return res.json(await getDeviceModels())
})

router.get("/:cd_device_model", async(req, res) => {
  const deviceModel = await getDeviceModelById(req.params.cd_device_model)

  if (!deviceModel) {
    return res.status(404).send("Device model not found")
  }

  return res.json(deviceModel)
})

export default router
