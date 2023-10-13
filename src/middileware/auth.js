import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
const verifyToken = (socket, next) => {
  const token = extractJwtToken(socket.handshake.headers.cookie);
  if (!token) {
    return next(new Error("Authentication error"));
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error"));
    }
    socket.user = decoded;
    next();
  });
};

function extractJwtToken(cookieString) {
  const cookies = cookieString.split("; ");
  const jwtCookie = cookies.find((cookie) => cookie.startsWith("jwt="));

  if (jwtCookie) {
    const token = jwtCookie.split("=")[1];
    return token;
  }

  return null; 
}

export default verifyToken;
