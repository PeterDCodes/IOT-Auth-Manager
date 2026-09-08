import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;


export const authenticate = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  //Capture token stored in request header
  if (!authHeader) {
    return res.status(401).json({
      error: "Access token required"
    });
  }
  const token = authHeader.split(" ")[1];


  //verify the Token sent by client
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.auth = payload;

    next();

  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  };
};


export default authenticate