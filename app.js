import express from 'express'
import needauth from './routes/needauth.js'
import noauth from './routes/noauth.js'
import {authenticate} from './authenticate.js'

const app = express();
const port = 3000;

app.use(express.json());

//ROUTER
//Unprotected Routes
app.use("/", noauth);
//Protected Routes
app.use("/secret", authenticate, needauth);

// Catch any random/unhandled route (404 handler)
app.use(function(req, res, next) {
  res.status(404).send("Route not found");
 });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});