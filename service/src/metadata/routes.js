import express from "express"

import { buildJwks } from "./helpers.js"

const router = express.Router();

//Creates and return a standard jwks
router.get("/jwks.json", (req, res)=>{

    //Build and return jwks
    return res.json(buildJwks())
})



export default router