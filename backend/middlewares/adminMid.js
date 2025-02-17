import  config  from "../config.js";
import jwt from "jsonwebtoken";

function adminMiddleware(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        res.status(401).json({errors:"No token provided"});
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, config.JWT_ADMIN_PASSWORD);
        req.adminId = decoded.id;
        next();
    } catch (error) {
        res.status(500).json({message:"Invalid or expired token"});
    }
}

export default adminMiddleware;