import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else if (authHeader) {
      token = authHeader.trim();
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.body?.token) {
      token = req.body.token;
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No authentication token provided",
      });
    }

    const secret = process.env.JWT_SECRET || "byteforce_super_secret_jwt_key_2026";
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Authentication token has expired. Please log in again."
            : "Invalid authentication token. Please log in again.",
      });
    }

    const userId = decoded._id || decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account associated with this token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during authentication",
    });
  }
};
