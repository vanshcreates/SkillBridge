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
  uploadCourseVideo,
} from "../controllers/expert.controller.js";
import {
  getExpertEvaluationQueue,
  getEvaluationProductById,
  startProductEvaluation,
  submitExpertEvaluation,
  toggleExpertSelfVerification,
} from "../controllers/evaluation.controller.js";
import { verifyJWT, requireExpert, requireVerifiedExpert } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Protect ALL expert routes: user must be logged in and accountType === "expert"
router.use(verifyJWT, requireExpert);

// 1. Expert Dashboard
router.get("/dashboard", getExpertDashboard);

// 2. Product Evaluation System (Verified Experts)
router.get("/evaluations/queue", getExpertEvaluationQueue);
router.get("/evaluations/product/:productId", getEvaluationProductById);
router.patch("/evaluations/product/:productId/start", requireVerifiedExpert, startProductEvaluation);
router.post("/evaluations/product/:productId/evaluate", requireVerifiedExpert, submitExpertEvaluation);
router.post("/verify-status", toggleExpertSelfVerification);

// 3. Courses Management
router.get("/courses", getExpertCourses);
router.post("/courses", upload.single("thumbnail"), createExpertCourse);
router.get("/courses/:id", getExpertCourseById);
router.put("/courses/:id", upload.single("thumbnail"), updateExpertCourse);
router.patch("/courses/:id/publish", toggleCoursePublish);
router.delete("/courses/:id", deleteExpertCourse);

// 4. Video Lessons & Media
router.post("/upload-video", upload.single("video"), uploadCourseVideo);
router.get("/courses/:id/lessons", getCourseLessons);
router.post("/courses/:id/lessons", upload.single("video"), addCourseLesson);
router.put("/courses/:id/lessons/:lessonId", updateCourseLesson);
router.delete("/courses/:id/lessons/:lessonId", deleteCourseLesson);

// 5. Expert Profile
router.get("/profile", getExpertProfile);
router.put("/profile", upload.single("avatar"), updateExpertProfile);

export default router;
