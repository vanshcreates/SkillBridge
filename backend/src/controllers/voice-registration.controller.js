import { User } from "../models/user.model.js";
import {
  ARTISAN_QUESTIONS,
  SYSTEM_MESSAGES,
  buildSummaryText,
} from "../utils/artisan-voice-questions.js";
import { extractVoiceAnswer } from "../config/voice-ai.config.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/**
 * @desc    Get questions and system messages for voice registration
 * @route   GET /api/voice/questions
 * @access  Public
 */
export const getVoiceQuestions = async (req, res) => {
  try {
    const lang = req.query.lang || "pa";
    return res.status(200).json({
      success: true,
      questions: ARTISAN_QUESTIONS,
      messages: SYSTEM_MESSAGES,
      currentLanguage: lang,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Process spoken answer with LLM information extraction
 * @route   POST /api/voice/process-answer
 * @access  Public
 */
export const processVoiceAnswer = async (req, res) => {
  try {
    const { question_id, transcript, language = "pa", current_answers = {} } = req.body || {};

    if (!question_id) {
      return res.status(400).json({
        success: false,
        message: "question_id is required",
      });
    }

    const questionIndex = ARTISAN_QUESTIONS.findIndex((q) => q.id === question_id);
    if (questionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Invalid question_id: ${question_id}`,
      });
    }

    const currentQuestion = ARTISAN_QUESTIONS[questionIndex];

    // Extract information using LLM
    const extraction = await extractVoiceAnswer(question_id, transcript, language);

    // If answer is valid and not requiring clarification
    let nextQuestionId = null;
    let isComplete = false;

    if (extraction.is_valid && !extraction.needs_clarification) {
      if (questionIndex < ARTISAN_QUESTIONS.length - 1) {
        nextQuestionId = ARTISAN_QUESTIONS[questionIndex + 1].id;
      } else {
        isComplete = true;
      }
    }

    // Determine clarification or redirection message if needed
    let guidanceMessage = "";
    if (extraction.is_unrelated) {
      guidanceMessage =
        SYSTEM_MESSAGES.redirect[language] || SYSTEM_MESSAGES.redirect.en;
    } else if (extraction.needs_clarification || !extraction.is_valid) {
      if (question_id === "Q7") {
        guidanceMessage =
          SYSTEM_MESSAGES.phoneInvalid[language] || SYSTEM_MESSAGES.phoneInvalid.en;
      } else {
        guidanceMessage =
          SYSTEM_MESSAGES.unclear[language] || SYSTEM_MESSAGES.unclear.en;
      }
    }

    return res.status(200).json({
      success: true,
      question_id,
      current_question: currentQuestion,
      extraction,
      next_question_id: nextQuestionId,
      is_complete: isComplete,
      guidance_message: guidanceMessage,
    });
  } catch (error) {
    console.error("processVoiceAnswer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process voice answer",
    });
  }
};

/**
 * @desc    Generate profile summary text and confirmation prompt
 * @route   POST /api/voice/summary
 * @access  Public
 */
export const getVoiceSummary = async (req, res) => {
  try {
    const { answers = {}, language = "pa" } = req.body || {};

    const summaryText = buildSummaryText(answers, language);
    const confirmationPrompt =
      SYSTEM_MESSAGES.confirmationAsk[language] || SYSTEM_MESSAGES.confirmationAsk.en;

    return res.status(200).json({
      success: true,
      summary_text: summaryText,
      confirmation_prompt: confirmationPrompt,
      answers,
      language,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to build summary",
    });
  }
};

/**
 * @desc    Register artisan user from voice registration answers
 * @route   POST /api/voice/register
 * @access  Public
 */
export const registerArtisanVoice = async (req, res) => {
  try {
    const { answers = {}, language = "pa" } = req.body || {};

    const rawName = (answers.name || "").trim();
    if (!rawName) {
      return res.status(400).json({
        success: false,
        message: "Artisan name is required for registration.",
      });
    }

    const phone = (answers.phone || "").replace(/\D/g, "");
    if (phone && phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain at least 10 digits.",
      });
    }

    const location = (answers.location || "").trim();
    const skills = Array.isArray(answers.skills)
      ? answers.skills.join(", ")
      : (answers.skills || "").trim();
    const experience = (answers.experience || "Experienced").trim();
    const products = (answers.products || "").trim();
    const preference = (answers.preference || "In a group").trim();

    // Map skills to primary category
    let artCategory = "Handicrafts";
    const skillsLower = skills.toLowerCase();
    if (skillsLower.includes("phulkari") || skillsLower.includes("ਫੁਲਕਾਰੀ") || skillsLower.includes("embroidery") || skillsLower.includes("ਕਢਾਈ")) {
      artCategory = "Embroidery and Phulkari";
    } else if (skillsLower.includes("stitching") || skillsLower.includes("tailoring") || skillsLower.includes("ਸਿਲਾਈ")) {
      artCategory = "Tailoring";
    } else if (skillsLower.includes("weaving") || skillsLower.includes("textile") || skillsLower.includes("ਬੁਣਤੀ")) {
      artCategory = "Weaving and textiles";
    } else if (skillsLower.includes("pottery") || skillsLower.includes("ਘੜੇ") || skillsLower.includes("ਮਿੱਟੀ")) {
      artCategory = "Pottery and ceramics";
    } else if (skillsLower.includes("food") || skillsLower.includes("ਖਾਣਾ") || skillsLower.includes("achar")) {
      artCategory = "Food and natural products";
    } else if (skills) {
      artCategory = skills;
    }

    // Build biographical description
    const bioParts = [];
    if (products) bioParts.push(`Products: ${products}`);
    if (preference) bioParts.push(`Work style: ${preference}`);
    if (location) bioParts.push(`Based in: ${location}`);
    const bio = bioParts.join(". ");

    // Handle email generation for voice registered users who may not have email
    let email = "";
    if (phone && phone.length >= 10) {
      email = `artisan_${phone}@skillbridge.local`;
    } else {
      const sanitizedName = rawName.toLowerCase().replace(/[^a-z0-9]/g, "") || "artisan";
      email = `${sanitizedName}_${Date.now()}@skillbridge.local`;
    }

    // Check if user already exists with this email or phone
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      email = `artisan_${Date.now()}_${Math.floor(Math.random() * 1000)}@skillbridge.local`;
    }

    // Secure generated password
    const autoPassword = `Artisan@${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await User.create({
      name: rawName,
      email,
      password: autoPassword,
      accountType: "artisan",
      phone: phone || "",
      city: location,
      artCategory,
      experience,
      bio,
      isVerified: true, // Voice verified
    });

    const token = user.generateAccessToken();
    res.cookie("token", token, getCookieOptions());

    const successMessage =
      SYSTEM_MESSAGES.success[language] || SYSTEM_MESSAGES.success.en;

    return res.status(201).json({
      success: true,
      message: successMessage,
      token,
      user: user.toSafeObject(),
      registered_email: email,
    });
  } catch (error) {
    console.error("Voice registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete voice registration",
    });
  }
};
