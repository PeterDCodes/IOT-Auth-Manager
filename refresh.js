import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.EXPIRES_IN;

export const getRefreshToken=(id)=>{
    const payload = {
        deviceId: id,
    };

    const token = jwt.sign(
        payload,
        JWT_SECRET,
        {
            expiresIn: EXPIRES_IN
        }
    );

    return token;
}