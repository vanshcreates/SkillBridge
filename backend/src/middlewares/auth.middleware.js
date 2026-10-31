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
        message: "Unauthorized: No authentication token provided. Please log in.",
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

/**
 * Middleware factory to restrict access to specific user roles
 * @param  {...string} allowedRoles - E.g. "customer", "artisan", "expert", "industry"
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in first.",
      });
    }

    const userRole = req.user.accountType || "customer";

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This section is restricted to ${allowedRoles.join(" or ")} accounts only. Your account type is "${userRole}".`,
      });
    }

    next();
  };
};

// Role-specific convenience guards
export const requireCustomer = requireRoles("customer");
export const requireArtisan = requireRoles("artisan");
export const requireExpert = requireRoles("expert");
export const requireIndustry = requireRoles("industry");

/**
 * Optional JWT authentication middleware
 * Attaches req.user if a valid token is provided; otherwise leaves req.user = null and continues.
 */
export const optionalJWT = async (req, res, next) => {
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
      req.user = null;
      return next();
    }

    const secret = process.env.JWT_SECRET || "byteforce_super_secret_jwt_key_2026";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      req.user = null;
      return next();
    }

    const userId = decoded._id || decoded.id;
    const user = await User.findById(userId);
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};
