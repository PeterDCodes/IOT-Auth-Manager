import express from "express"
import cors from "cors"
import deviceRoutes from "./devices/routes.js"
import database, { verifyDatabaseConnection } from "./data/database.js"
import { getPrivateKey, getPublicKey } from "./authentication/helpers.js"
import logger from "./utils/logging.js"

//Import the middleware helper from package as a demo of how used
import createAuthenticate from "auth-middleware"

//Import Auth Library
import { authRoutes } from "./authentication/index.js"

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());


//UNPROTECTED ROUTES
app.get("/", (req, res) => {
  res.send("IOT-AUTH-SERVER");
});


//Use authentication routes
app.use("/auth", authRoutes)

//Use device routes
app.use("/devices", deviceRoutes)






//Configure authentication
const publicKey = getPublicKey()
const algorithm = "RS256"
const issuer = "IOT-AUTH-MANAGER"
const audience = "IOT-APIS"
const authenticate = (req, res, next) => {
  let defaultAuthenticate;
  if (!defaultAuthenticate) {
    defaultAuthenticate = createAuthenticate({
      publicKey,
      algorithm,
      issuer,
      audience
    })
  }
  return defaultAuthenticate(req, res, next)
}





// Test Middlewear
app.get("/protected", authenticate, (req, res)=>{
  res.send("PROTECTED ROUTE")
})



// Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });


const startServer=async()=>{
  
  try {
    //Check DB Connection
    await verifyDatabaseConnection()
    //Check Keys
    const privateKey = getPrivateKey()

    app.listen(port, () => {
      console.log(`AUTH Service listening on port ${port}`);
      logger.info(`AUTH Service listening on port ${port}`);
    });
  } catch (error) {
    logger.error(`Failed to launch Auth service: ${error.message}`)
    await database.end()
    process.exitCode = 1
  }
}


await startServer()
