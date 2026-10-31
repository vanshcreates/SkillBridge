import { Router } from "express";
import {
  getVoiceQuestions,
  processVoiceAnswer,
  getVoiceSummary,
  registerArtisanVoice,
} from "../controllers/voice-registration.controller.js";
import { handleVoiceAssistantMessage } from "../controllers/voice-assistant.controller.js";
import { verifyJWT, requireArtisan } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes for voice registration
router.get("/questions", getVoiceQuestions);
router.post("/process-answer", processVoiceAnswer);
router.post("/summary", getVoiceSummary);
router.post("/register", registerArtisanVoice);

// Authenticated Voice Assistant route (operates entire artisan section via voice)
router.post("/assistant", verifyJWT, requireArtisan, handleVoiceAssistantMessage);

export default router;
