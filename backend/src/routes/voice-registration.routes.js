import { Router } from "express";
import {
  getVoiceQuestions,
  processVoiceAnswer,
  getVoiceSummary,
  registerArtisanVoice,
} from "../controllers/voice-registration.controller.js";
import { handleVoiceAssistantMessage } from "../controllers/voice-assistant.controller.js";
import { optionalJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes for voice registration
router.get("/questions", getVoiceQuestions);
router.post("/process-answer", processVoiceAnswer);
router.post("/summary", getVoiceSummary);
router.post("/register", registerArtisanVoice);

// Universal Mascot & Voice Assistant route (supports authenticated artisans as well as guests on login/signup)
router.post("/assistant", optionalJWT, handleVoiceAssistantMessage);

export default router;
