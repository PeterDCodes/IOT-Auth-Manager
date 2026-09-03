//Authentication Middlewear

export const authenticate = (req, res, next) => {
  // 1. Execute any code
  // 2. Modify req or res objects
 const { token } = req.body ?? {}
  if(!token){
    return res.status(400).send("RES BODY MUST INCLUDE TOKEN")
  } 
  if(token !== "PETER"){
    return res.status(401).send("ACCESS DENIED!");
  }
  // 3. Call next() to move to the next function
  next();
};

