import { Router } from "express";
import {
  getExpertDashboard,
  getExpertCourses,
  getExpertCourseById,
  createExpertCourse,
  updateExpertCourse,
  toggleCoursePublish,
  deleteExpertCourse,
  getCourseLessons,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  getExpertProfile,
  updateExpertProfile,
} from "../controllers/expert.controller.js";
import { verifyJWT, requireExpert } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Protect ALL expert routes: user must be logged in and accountType === "expert"
router.use(verifyJWT, requireExpert);

// 1. Expert Dashboard
router.get("/dashboard", getExpertDashboard);

// 2. Courses Management
router.get("/courses", getExpertCourses);
router.post("/courses", upload.single("thumbnail"), createExpertCourse);
router.get("/courses/:id", getExpertCourseById);
router.put("/courses/:id", upload.single("thumbnail"), updateExpertCourse);
router.patch("/courses/:id/publish", toggleCoursePublish);
router.delete("/courses/:id", deleteExpertCourse);

// 3. Video Lessons (with pagination)
router.get("/courses/:id/lessons", getCourseLessons);
router.post("/courses/:id/lessons", addCourseLesson);
router.put("/courses/:id/lessons/:lessonId", updateCourseLesson);
router.delete("/courses/:id/lessons/:lessonId", deleteCourseLesson);

// 4. Expert Profile
router.get("/profile", getExpertProfile);
router.put("/profile", upload.single("avatar"), updateExpertProfile);

export default router;

