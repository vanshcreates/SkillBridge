import { Router } from "express";
import {
  getMarketplaceProducts,
  getMarketplaceProductById,
  createMarketplaceOrder,
  getCustomerOrders,
} from "../controllers/marketplace.controller.js";
import { verifyJWT, requireCustomer } from "../middlewares/auth.middleware.js";

const router = Router();

// ENFORCE: Only customers can access the marketplace
router.use(verifyJWT, requireCustomer);

// Products
router.get("/products", getMarketplaceProducts);
router.get("/products/:id", getMarketplaceProductById);

// Orders
router.post("/orders", createMarketplaceOrder);
router.get("/orders", getCustomerOrders);

export default router;

