import { Router } from "express";
import {
  getVoiceQuestions,
  processVoiceAnswer,
  getVoiceSummary,
  registerArtisanVoice,
} from "../controllers/voice-registration.controller.js";

const router = Router();

// Public routes for voice registration
router.get("/questions", getVoiceQuestions);
router.post("/process-answer", processVoiceAnswer);
router.post("/summary", getVoiceSummary);
router.post("/register", registerArtisanVoice);

export default router;

