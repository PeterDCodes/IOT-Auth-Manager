import express from "express"
import { getDeviceDeploymentById, getDeviceDeployments } from "./data.js"

const router = express.Router()

router.get("/", async(req, res) => {
  return res.json(await getDeviceDeployments())
})

router.get("/:cd_deployment", async(req, res) => {
  const deployment = await getDeviceDeploymentById(req.params.cd_deployment)

  if (!deployment) {
    return res.status(404).send("Device deployment not found")
  }

  return res.json(deployment)
})

export default router
