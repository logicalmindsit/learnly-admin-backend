import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const verifyToken = async (req, res, next) => {
  try {
    const PATH = req.path;

    // Allow public routes without token
    const publicPaths = [
      "/adminlogin",
      "/verify-otp",
      "/forgot-password",
      "/reset-password"
    ];

    if (publicPaths.includes(PATH)) {
      return next();
    }

    const authorization = req.headers["authorization"];
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header not found" });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token not found" });
    }

    // ✅ Decode and verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user info to request
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token has expired" });
    }
    return res.status(403).json({ message: "Token verification failed", error: error.message });
  }
};

export { verifyToken };
