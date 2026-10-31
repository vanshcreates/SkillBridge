import { Router } from "express";
import { verifyJWT, requireCustomer } from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerAvatar,
  removeCustomerAvatar,
  getCustomerDashboard,
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  getCustomerWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
} from "../controllers/customer.controller.js";

const router = Router();

// Multer for avatar uploads (memory storage, 5 MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("Choose a JPG, PNG, or WebP image."), false);
    }
    cb(null, true);
  },
});

const handleAvatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (!error) return next();
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to process profile photo.",
    });
  });
};

// All routes require authentication + customer role
router.use(verifyJWT, requireCustomer);

// ── Dashboard ────────────────────────────────
router.get("/dashboard", getCustomerDashboard);

// ── Profile ──────────────────────────────────
router.get("/profile", getCustomerProfile);
router.put("/profile", updateCustomerProfile);
router.post("/profile/photo", handleAvatarUpload, uploadCustomerAvatar);
router.delete("/profile/photo", removeCustomerAvatar);

// ── Orders ───────────────────────────────────
router.get("/orders", getCustomerOrders);
router.get("/orders/:id", getCustomerOrderById);
router.patch("/orders/:id/cancel", cancelCustomerOrder);

// ── Wishlist ─────────────────────────────────
router.get("/wishlist", getCustomerWishlist);
router.post("/wishlist", addToWishlist);
router.get("/wishlist/check/:productId", checkWishlistStatus);
router.delete("/wishlist/:productId", removeFromWishlist);

// ── Addresses ────────────────────────────────
router.get("/addresses", getCustomerAddresses);
router.post("/addresses", addCustomerAddress);
router.patch("/addresses/:id", updateCustomerAddress);
router.delete("/addresses/:id", deleteCustomerAddress);
router.patch("/addresses/:id/default", setDefaultAddress);

export default router;
