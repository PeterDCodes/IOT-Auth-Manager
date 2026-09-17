import express from "express"
import cors from "cors"
import deviceRoutes from "./devices/routes.js"
import database, { verifyDatabaseConnection } from "./data/database.js"

//Import Auth Library
import { authRoutes } from "./authentication/index.js"

const app = express();
const port = 3000;

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

// Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });

const startServer=async()=>{
  try {
    await verifyDatabaseConnection()
    app.listen(port, () => {
      console.log(`AUTH Service listening on port ${port}`);
    });
  } catch (error) {
    console.error(`Failed to connect to PostgreSQL: ${error.message}`)
    await database.end()
    process.exitCode = 1
  }
}

await startServer()
