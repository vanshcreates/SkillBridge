import { Router } from "express";
import {
  getIndustryDashboard,
  createIndustryProject,
  getIndustryProjects,
  getIndustryProjectById,
  assignProjectToArtisan,
  analyzeProject,
  getIndustryNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAvailableArtisans,
} from "../controllers/industry.controller.js";
import { verifyJWT, requireIndustry } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect ALL industry routes
router.use(verifyJWT, requireIndustry);

// Dashboard
router.get("/dashboard", getIndustryDashboard);

// Project / Product requests
router.get("/projects", getIndustryProjects);
router.post("/projects", createIndustryProject);
router.post("/projects/analyze", analyzeProject);
router.get("/projects/:id", getIndustryProjectById);
router.post("/projects/:id/assign", assignProjectToArtisan);

// Notifications
router.get("/notifications", getIndustryNotifications);
router.patch("/notifications/mark-all-read", markAllNotificationsAsRead);
router.patch("/notifications/:id/read", markNotificationAsRead);

// Artisans catalog for industry selection
router.get("/artisans", getAvailableArtisans);

export default router;

