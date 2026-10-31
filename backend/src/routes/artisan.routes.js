import { Router } from "express";
import {
  getArtisanDashboard,
  getArtisanShop,
  saveArtisanShop,
  getArtisanProducts,
  createArtisanProduct,
  publishArtisanProduct,
  unpublishArtisanProduct,
  deleteArtisanProduct,
  getArtisanOrders,
  updateOrderStatus,
  getArtisanCourses,
  getArtisanCourseById,
  getArtisanProfile,
  updateArtisanProfile,
  getArtisanPayments,
} from "../controllers/artisan.controller.js";
import { verifyJWT, requireArtisan } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Protect ALL artisan routes: must be logged in and accountType === "artisan"
router.use(verifyJWT, requireArtisan);

// 1. Dashboard
router.get("/dashboard", getArtisanDashboard);

// 2. My Shop
router.get("/shop", getArtisanShop);
router.post(
  "/shop",
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  saveArtisanShop
);
router.put(
  "/shop",
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  saveArtisanShop
);

// 3. Products / Listings
router.get("/products", getArtisanProducts);
router.post("/products", upload.single("image"), createArtisanProduct);
router.patch("/products/:id/publish", publishArtisanProduct);
router.patch("/products/:id/unpublish", unpublishArtisanProduct);
router.delete("/products/:id", deleteArtisanProduct);

// 4. Orders
router.get("/orders", getArtisanOrders);
router.patch("/orders/:id/status", updateOrderStatus);

// 5. Training
router.get("/courses", getArtisanCourses);
router.get("/courses/:id", getArtisanCourseById);

// 6. Profile Info
router.get("/profile", getArtisanProfile);
router.put("/profile", upload.single("avatar"), updateArtisanProfile);

// 7. Payment History
router.get("/payments", getArtisanPayments);

export default router;

