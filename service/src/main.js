import express from "express"
import cors from "cors"
import database, { verifyDatabaseConnection } from "./data/database.js"
import logger from "./utils/logging.js"
import { jsonBodyCheck } from "../../utilities/jsonBodyCheck.js"

//Import Routes and supporting endpoints
import { authRoutes } from "./domains/authentication/index.js"
import { deviceRoutes }  from "./domains/devices/index.js"
import { metaRoutes } from "./domains/metadata/index.js"

//Keys Helpers
import { getPrivateKey } from "../keys/helpers.js"

import pinoHttp from "pino-http";


const app = express();
const port = 3000;
app.use(cors());
app.use(express.json(), jsonBodyCheck);
app.use(pinoHttp())

//UNPROTECTED ROUTES
app.get("/", (req, res) => {
  res.send("IOT-AUTH-SERVER");
});

//Use JWKS route
app.use("/.well-known", metaRoutes)
//Use authentication routes
app.use("/auth", authRoutes)
//Use device routes
app.use("/devices", deviceRoutes)


//Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });


const startServer=async()=>{
  
  try{
    //Confirm Key status. TODO do i still need this??
    getPrivateKey()
    //Check DB Connection
    await verifyDatabaseConnection()

    app.listen(port, () => {
      console.log(`AUTH Service listening on port ${port}`);
    });
  } catch (error) {
    logger.error(`Failed to launch Auth service: ${error.message}`)
    await database.end()
    process.exitCode = 1
  }
}



await startServer()
