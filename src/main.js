import express from "express"
import cors from "cors"
import deviceRoutes from "./devices/routes.js"

//Import Auth Library
import { authRoutes, authenticate } from "./authentication/index.js"

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

//Use authentication routes
app.use("/auth", authRoutes)

//Use device routes
app.use("/devices", deviceRoutes)


//UNPROTECTED ROUTES
app.get("/", (req, res) => {
  res.send("This route does not require authentication!");
});


//PROTECTED ROUTES
// Protect everything below this line
app.get("/secret", authenticate, (req, res) =>{
  res.send("Here is the secret message!");
})


// Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });

app.listen(port, () => {
  console.log(`AUTH Service listening on port ${port}`);
});
