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
  getAvailableResponsibleProjects,
  takeResponsibleProject,
  getArtisanCourses,
  getArtisanCourseById,
  getArtisanProfile,
  updateArtisanProfile,
  uploadArtisanProfilePhoto,
  removeArtisanProfilePhoto,
  getArtisanPayments,
} from "../controllers/artisan.controller.js";
import {
  submitProductForEvaluation,
  getArtisanEvaluations,
  getArtisanEvaluationById,
} from "../controllers/evaluation.controller.js";
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
router.post(
  "/products",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "image", maxCount: 10 },
  ]),
  createArtisanProduct
);
router.patch("/products/:id/publish", publishArtisanProduct);
router.patch("/products/:id/unpublish", unpublishArtisanProduct);
router.delete("/products/:id", deleteArtisanProduct);

// 4. Women Artisan Product Evaluation
router.post(
  "/evaluations/submit",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "image", maxCount: 10 },
  ]),
  submitProductForEvaluation
);
router.get("/evaluations", getArtisanEvaluations);
router.get("/evaluations/:productId", getArtisanEvaluationById);

// 5. Orders & Responsible Industry Projects
router.get("/orders", getArtisanOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/responsible-projects", getAvailableResponsibleProjects);
router.post("/responsible-projects/:id/take", takeResponsibleProject);

// 6. Training
router.get("/courses", getArtisanCourses);
router.get("/courses/:id", getArtisanCourseById);

// 7. Profile Info
router.get("/profile", getArtisanProfile);
router.put("/profile", upload.single("avatar"), updateArtisanProfile);
router.post("/profile/photo", upload.single("photo"), uploadArtisanProfilePhoto);
router.delete("/profile/photo", removeArtisanProfilePhoto);

// 8. Payment History
router.get("/payments", getArtisanPayments);

export default router;
