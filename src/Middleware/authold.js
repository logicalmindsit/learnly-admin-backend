import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const verifyToken = async (req, res, next) => {
  
  try {
    
    const authorizationHeader = req.headers["authorization"];


    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing or malformed" });
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access token not found" });
    }

  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
        id: decoded.id, 
        email: decoded.email, 
        role: decoded.role, 
        name: decoded.name 
    };

    next(); 

  } catch (error) {
   
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token has expired" });
    }
    return res.status(403).json({ message: "Invalid or corrupt token", error: error.message });
  }
};

export { verifyToken };



// Middleware/authMiddleware.js
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();
// // const { JWT_SECRET } = process.env; // <<--- மாற்றம் 1: இந்த வரியை நீக்கிவிடவும்

// // List of public routes that do NOT require authentication (இதில் மாற்றம் இல்லை)
// const PUBLIC_ROUTES = [
//   "/register",
//   "/verify-otp",
//   "/resend-otp",
//   "/create-password",
//   "/login",
//   "/profile",
//   "/forget-password",
//   "/password-otp-verify",
//   "/forget-reset-password",
//   "/allcourses",
//   "/courses/user-view",
//   "/form",
//   "/courses/:id"
// ];

// const verifyToken = async (req, res, next) => {
//   try {
//     const PATH = req.path;

//     if (PUBLIC_ROUTES.includes(PATH)) {
//       return next();
//     }

//     const authHeader = req.headers["authorization"];

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Authorization header not found or malformed" });
//     }

//     const token = authHeader.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ message: "Access token not found" });
//     }

//     // <<--- மாற்றம் 2: JWT_SECRET-க்கு பதிலாக process.env.JWT_SECRET-ஐ நேரடியாகப் பயன்படுத்தவும்
//     const decoded = jwt.verify(token, process.env.JWT_SECRET); 
//     req.userId = decoded.id;

//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Access token has expired" });
//     }
//     // உங்கள் பழைய error message-ஐயே வைத்துக்கொள்ளலாம்
//     // ஆனால், உண்மையான பிழை "Invalid signature" அல்லது "jwt malformed" ஆக இருக்கலாம்.
//     // அதை client-க்கு அனுப்புவது பாதுகாப்பு குறைவு.
//     // அதனால், ஒரு பொதுவான செய்தியை அனுப்புவது நல்லது.
//     console.error("TOKEN_VERIFICATION_ERROR:", error.message); // பிழையை console-ல் பார்க்கவும்
//     return res.status(401).json({ message: "Invalid or corrupt token" }); // client-க்கு இந்த செய்தியை அனுப்பவும்
//   }
// };

// export { verifyToken };
