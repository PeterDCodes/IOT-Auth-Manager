//Example implementation of an API that uses the AUTH service JWKS
import express from "express"
import cors from "cors"
const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());

//Key manager
import {
  KeyManager,
  createAuthenticate
} from "auth-middleware";


const startServer=async()=>{
  try{
      //DEMO OF USING THE MIDDLEWEAR with a public key
      const STOREPATH = "./"
      const JWKS_ENDPOINT = "http://localhost:3000/.well-known/jwks.json"
      const keyManager = new KeyManager(STOREPATH, JWKS_ENDPOINT)
      //Fetch and store then use the public key
      const publicKey = await keyManager.fetchAndStore()

      //I only want to accept tokens issued by Peters Auth Manager and I only want tokens that are meant for Peters Official Services
      const issuer = "PETERS-AUTH-MANAGER"
      const audience = "PETERS-OFFICIAL-SERVICES"
      const authenticate = createAuthenticate({
            publicKey,
            issuer,
            audience
      })
      // Test Middlewear
      app.get("/public", (req, res)=>{
        res.send("PUBLIC ROUTE")
      })
      app.get("/protected", authenticate, (req, res)=>{
        res.send("PROTECTED ROUTE")
      })


      const server = app.listen(port, () => {
        console.log(`AUTH Service listening on port ${port}`);
      });

      server.on("error", (error) => {
        console.error("Server error:", error);
      });
      
  }catch(error){
    console.log(`Failed to start example: ${error}`)
  }
}

await startServer()
