import express from "express"

//Import Auth Library
import { authRoutes, authenticate } from "../authentication/index.js"

const app = express();
const port = 3000;

app.use(express.json());

//Use authentication routes
app.use("/auth", authRoutes)


//UNPROTECTED ROUTES
app.get("/", (req, res) => {
  res.send("This route does not require authentication!");
});


app.get("/devices", async(req, res) => {
  
  const devices = await getDevices();

  return res.json(devices)
});



//PROTECTED ROUTES

// Protect everything below this line
app.get("/secret", (req, res) =>{
  res.send("Here is the secret message!");
})


// Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });

app.listen(port, () => {
  console.log(`AUTH Service listening on port ${port}`);
});
