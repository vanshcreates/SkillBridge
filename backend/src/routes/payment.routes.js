import { Router } from "express";
import {
  getRazorpayConfig,
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
} from "../controllers/payment.controller.js";
import { verifyJWT, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();
const requireCustomerOrIndustry = requireRoles("customer", "industry");

// All payment routes are protected for authenticated customer or industry accounts
router.use(verifyJWT, requireCustomerOrIndustry);

router.get("/config", getRazorpayConfig);
router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/failed", handlePaymentFailure);

export default router;
