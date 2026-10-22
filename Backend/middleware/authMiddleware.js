const jwt = require("jsonwebtoken");
const user = require("../models/User");
exports.protect = async (req,res,next) =>{
    try{
        const authHeader = req.header.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                message: "Authentication required",                                             
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if(!user || !user.isActive){
            return res.status(401).json({
               message: "User not found or account disabled", 
            });
        }
        req.user = {
            id: user._id.toString(),
            role: user.role,
        };
        next();
    }
    catch(error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

exports.authorize = (...roles) => {
    return(req,res,next) => {
        if(!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied",
            });
        }
        next();
    };
};