import express from "express"
import cors from "cors"
import database, { verifyDatabaseConnection } from "./data/database.js"
import logger from "./utils/logging.js"

//Import the middleware helper from package as a demo of how used
import createAuthenticate from "auth-middleware"

//Import Routes and supporting endpoints
import { authRoutes } from "./authentication/index.js"
import { deviceRoutes }  from "./devices/index.js"
import { metaRoutes } from "./metadata/index.js"

//Keys Helpers
import { getPrivateKey } from "../keys/helpers.js"


const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());


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





// //DEMO OF USING THE MIDDLEWEAR with a public key
// const publicKey = getPublicKey()
// const issuer = "PETERS-AUTH-MANAGER"
// const audience = "PETERS-OFFICIAL-SERVICES"
// const authenticate = createAuthenticate({
//       publicKey,
//       issuer,
//       audience
// })
// // Test Middlewear
// app.get("/protected", authenticate, (req, res)=>{
//   res.send("PROTECTED ROUTE")
// })


//Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });


const startServer=async()=>{
  
  try{
    //Confirm Key status
    getPrivateKey()
    //Check DB Connection
    await verifyDatabaseConnection()

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
