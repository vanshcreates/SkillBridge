import { Router } from "express";
import {
  signup,
  login,
  verify,
  verifyAccount,
  logout,
  getArtisans,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

const uploadSignupAvatar = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

// Public auth endpoints
router.post("/signup", uploadSignupAvatar, signup);
router.post("/register", uploadSignupAvatar, signup); // alias for convenience
router.post("/login", login);
router.post("/logout", logout);

// Verification endpoints
router.get("/verify", verifyJWT, verify);
router.post("/verify", verifyJWT, verify);
router.post("/verify-account", verifyAccount);

// Profile endpoints (Any authenticated user: customer, artisan, expert, industry)
router.get("/profile", verifyJWT, getProfile);
router.put("/profile", verifyJWT, updateProfile);
router.post("/profile/photo", verifyJWT, upload.single("avatar"), uploadProfilePhoto);
router.delete("/profile/photo", verifyJWT, removeProfilePhoto);

// Additional public queries
router.get("/artisans", getArtisans);

export default router;
