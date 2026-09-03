import express from 'express'
const router = express.Router();

//PROTECTED ROUTES
//User submits a registration request, they are then routed to the register confirm page?
//at register confirm they fill in their details
//Protected API route that can only be hit by a registered user
router.get('/', (req, res) =>{
  res.send("Here is the secret message!");
})


 export default router;