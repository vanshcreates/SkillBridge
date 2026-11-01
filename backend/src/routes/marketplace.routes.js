import { Router } from "express";
import {
  getMarketplaceProducts,
  getMarketplaceProductById,
  createMarketplaceOrder,
  getCustomerOrders,
} from "../controllers/marketplace.controller.js";
import { getRankedArtisanProducts } from "../controllers/evaluation.controller.js";
import { verifyJWT, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();
const requireCustomer = requireRoles("customer");

// ── Public routes (no auth required) ────────────────────
// Anyone can browse products — guests, artisans, industry, etc.
router.get("/products", getMarketplaceProducts);
router.get("/ranked-products", getRankedArtisanProducts);
router.get("/products/:id", getMarketplaceProductById);

// ── Protected routes (customers only) ───────────────────
router.use(verifyJWT, requireCustomer);
router.post("/orders", createMarketplaceOrder);
router.get("/orders", getCustomerOrders);

export default router;
