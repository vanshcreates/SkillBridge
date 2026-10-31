import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import artisanRoutes from "./routes/artisan.routes.js";
import expertRoutes from "./routes/expert.routes.js";
import marketplaceRoutes from "./routes/marketplace.routes.js";
import industryRoutes from "./routes/industry.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid CORS blocking
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Health check endpoints
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "SkillBridge API is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Main API Routes
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);

app.use("/api/artisan", artisanRoutes);
app.use("/api/v1/artisan", artisanRoutes);

app.use("/api/industry", industryRoutes);
app.use("/api/v1/industry", industryRoutes);

app.use("/api/expert", expertRoutes);
app.use("/api/v1/expert", expertRoutes);

app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/v1/marketplace", marketplaceRoutes);

app.use("/api/customer", customerRoutes);
app.use("/api/v1/customer", customerRoutes);

app.use("/api/payment", paymentRoutes);
app.use("/api/v1/payment", paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
