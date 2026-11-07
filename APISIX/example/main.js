import express from "express"
// import cors from "cors"


const app = express();
const port = 3000;
// app.use(cors());


//Basic Route
app.get("/", (req, res) => {
  res.send("This is a test API Route");
});


const startServer=async()=>{
  try{
    app.listen(port, () => {
      console.log(`Test API listening on port ${port}`);
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to launch test API")
    process.exitCode = 1
  }
}


await startServer()
