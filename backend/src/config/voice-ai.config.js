/**
 * Voice AI LLM Extraction Configuration & Service
 * Handles answer comprehension & information extraction for rural artisan voice registration.
 *
 * Supported providers:
 *  - Google Gemini (gemini-1.5-flash / gemini-2.0-flash)
 *  - Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant)
 *  - Deterministic NLP parser fallback when API keys are not yet configured
 */

import { ARTISAN_QUESTIONS } from "../utils/artisan-voice-questions.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_TTS_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const LLM_PROVIDER = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

/**
 * Construct strict system prompt for information extraction only
 */
function buildExtractionSystemPrompt(questionId, language) {
  const targetQuestion = ARTISAN_QUESTIONS.find((q) => q.id === questionId) || ARTISAN_QUESTIONS[0];

  return `You are a strict Information Extraction Engine for SkillBridge, an artisan platform for rural Indian women makers.
Your job is ONLY to extract facts from the user's spoken answer to Question ${questionId}.

THE QUESTION BEING ANSWERED IS:
Question ID: ${targetQuestion.id} (${targetQuestion.key})
Question Text: "${targetQuestion.prompts.en.spoken}" / "${targetQuestion.prompts.pa.spoken}" / "${targetQuestion.prompts.hi.spoken}"
Purpose: Extract ${targetQuestion.key}

IMPORTANT CONSTRAINTS:
1. You are NOT a conversational chatbot. NEVER talk back, NEVER ask your own questions, and NEVER generate advice.
2. Return ONLY a valid JSON object matching the exact schema below. No markdown backticks, no explanations.
3. Understand spoken Punjabi (Gurmukhi or Romanized/colloquial e.g. 'Mera naam Simran hai', 'Sat Sri Akal ji, main Amritsar ton haan', 'Phulkari te kaddhai da kamm kardi aan'), Hindi, and English.
4. If the user's answer is relevant and understandable, set is_valid: true, needs_clarification: false.
5. If the answer is completely silent, gibberish, or off-topic, set is_valid: false, needs_clarification: true, is_unrelated: true.
6. If the user provided answers to multiple questions at once (e.g., "My name is Gurpreet and I do embroidery in Patiala"), extract the main answer for ${targetQuestion.id} into 'extracted_value', and put other extracted answers into 'secondary_extractions' object (e.g. { "Q2": "Patiala", "Q3": ["Embroidery"] }).
7. For Q7 (phone/contact): It is OPTIONAL. If the user says "No", "Nahi hai", "Koi nahi", "Skip", set extracted_value: "", is_valid: true, needs_clarification: false.
8. If the user confirms a summary (e.g. "Haan", "Sahi hai", "Yes", "Theek hai"), note is_confirmation: true.

REQUIRED JSON SCHEMA:
{
  "question_id": "${questionId}",
  "extracted_value": "extracted text or array (for skills)",
  "is_valid": true,
  "needs_clarification": false,
  "is_unrelated": false,
  "detected_language": "Punjabi" | "Hindi" | "English",
  "confidence": 0.95,
  "secondary_extractions": {
    "Q1": "name if mentioned",
    "Q2": "location if mentioned",
    "Q3": ["skills if mentioned"],
    "Q4": "experience if mentioned",
    "Q5": "products if mentioned",
    "Q6": "preference if mentioned",
    "Q7": "phone if mentioned"
  }
}`;
}

/**
 * Call Google Gemini API
 */
async function callGemini(questionId, transcript, language) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `${buildExtractionSystemPrompt(questionId, language)}

USER SPOKEN TRANSCRIPT:
"${transcript}"

Extract now and output ONLY the JSON object.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("No text returned by Gemini");
  }

  return JSON.parse(rawText.replace(/```json\n?|\n?```/g, "").trim());
}

/**
 * Call Groq API
 */
async function callGroq(questionId, transcript, language) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const systemPrompt = buildExtractionSystemPrompt(questionId, language);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `USER SPOKEN TRANSCRIPT:\n"${transcript}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  return JSON.parse(rawContent);
}

/**
 * Intelligent deterministic fallback parser for Punjabi, Hindi, and English
 * Ensures the system operates reliably even if API keys are pending or network fails
 */
function deterministicExtractionFallback(questionId, transcript, language = "pa") {
  const raw = (transcript || "").trim();
  const lower = raw.toLowerCase();

  // Determine language if possible
  const hasGurmukhi = /[\u0A00-\u0A7F]/.test(raw);
  const hasDevanagari = /[\u0900-\u097F]/.test(raw);
  const detectedLanguage = hasGurmukhi ? "Punjabi" : hasDevanagari ? "Hindi" : language === "pa" ? "Punjabi" : language === "hi" ? "Hindi" : "English";

  // Check if completely empty
  if (!raw || raw.length < 2) {
    return {
      question_id: questionId,
      extracted_value: "",
      is_valid: false,
      needs_clarification: true,
      is_unrelated: false,
      detected_language: detectedLanguage,
      confidence: 0.5,
      secondary_extractions: {},
    };
  }

  let extractedValue = raw;
  let isValid = true;
  let needsClarification = false;
  let isUnrelated = false;
  const secondary = {};

  // Clean common introductory speech filler patterns
  const cleanSpeech = (text) => {
    return text
      .replace(/^(ਜੀ|ਮੇਰਾ ਨਾਂ|ਮੇਰਾ ਨਾਮ|ਮੈਂ|ਮੇਰਾ ਨਾਂਮ|ਮੈਂ ਹਾਂ|ਮੈਂ ਰਹਿੰਦੀ ਹਾਂ|ਜੀ ਮੇਰਾ ਨਾਮ|ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ|ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|ਨਮਸਤੇ ਜੀ|ਨਮਸਤੇ|mera naam|mera naam hai|main|i am|my name is|we do)\s+/i, "")
      .replace(/\s+(ਹੈ|ਹਾਂ|ਹੈ ਜੀ|ਹਾਂ ਜੀ|ਜੀ|hai|hoon|ji|hon)$/i, "")
      .trim();
  };

  switch (questionId) {
    case "Q1": {
      // Name
      const cleaned = cleanSpeech(raw);
      extractedValue = cleaned || raw;
      isValid = extractedValue.length >= 2;
      break;
    }
    case "Q2": {
      // Location
      let loc = cleanSpeech(raw);
      loc = loc.replace(/(ਵਿੱਚ ਰਹਿੰਦੇ ਹਾਂ|ਵਿੱਚ|ਪਿੰਡ|ਸ਼ਹਿਰ|ਤੋਂ ਹਾਂ|ਤੋਂ|se hoon|mein rehti hoon|in|village|city)/gi, "").trim();
      extractedValue = loc || raw;
      isValid = extractedValue.length >= 2;
      break;
    }
    case "Q3": {
      // Skills
      const craftKeywords = [
        { key: "Phulkari", terms: ["ਫੁਲਕਾਰੀ", "phulkari", "fulkari"] },
        { key: "Embroidery", terms: ["ਕਢਾਈ", "कढ़ाई", "embroidery", "kadhai", "sozni"] },
        { key: "Tailoring & Stitching", terms: ["ਸਿਲਾਈ", "सिलाई", "stitching", "sewing", "tailoring", "silai"] },
        { key: "Handicrafts", terms: ["ਦਸਤਕਾਰੀ", "हस्तशिल्प", "handicraft", "craft", "dastkari"] },
        { key: "Weaving & Textiles", terms: ["ਬੁਣਤੀ", "बुनाई", "weaving", "textile", "khaddi"] },
        { key: "Crochet & Knitting", terms: ["ਕਰੋਸ਼ੀਆ", "crochet", "knitting"] },
        { key: "Food Preparation", terms: ["ਖਾਣਾ ਬਣਾਉਣਾ", "food", "achar", "papad", "cooking"] },
        { key: "Pottery", terms: ["ਘੜੇ", "ਮਿੱਟੀ", "pottery", "ceramics"] },
      ];

      const foundSkills = [];
      for (const craft of craftKeywords) {
        if (craft.terms.some((t) => lower.includes(t.toLowerCase()) || raw.includes(t))) {
          foundSkills.push(craft.key);
        }
      }

      if (foundSkills.length > 0) {
        extractedValue = foundSkills;
      } else {
        extractedValue = [cleanSpeech(raw)];
      }
      isValid = extractedValue.length > 0 && extractedValue[0].length >= 2;
      break;
    }
    case "Q4": {
      // Experience
      let exp = raw;
      const numMatch = raw.match(/\d+/);
      if (numMatch) {
        exp = `${numMatch[0]} years`;
      } else if (lower.includes("bachpan") || raw.includes("ਬਚਪਨ") || raw.includes("बचपन")) {
        exp = "Since childhood (10+ years)";
      } else if (lower.includes("saal") || raw.includes("ਸਾਲ") || raw.includes("साल")) {
        exp = raw;
      } else {
        exp = cleanSpeech(raw);
      }
      extractedValue = exp;
      isValid = true;
      break;
    }
    case "Q5": {
      // Products
      extractedValue = cleanSpeech(raw);
      isValid = extractedValue.length >= 2;
      break;
    }
    case "Q6": {
      // Work preference
      if (
        lower.includes("samooh") ||
        lower.includes("group") ||
        raw.includes("ਸਮੂਹ") ||
        raw.includes("ਮਿਲ ਕੇ") ||
        raw.includes("ਔਰਤਾਂ ਨਾਲ") ||
        raw.includes("ਸਮੂਹ ਵਿੱਚ") ||
        raw.includes("समूह")
      ) {
        extractedValue = "In a Group / ਸਮੂਹ ਵਿੱਚ";
      } else if (
        lower.includes("ikalle") ||
        lower.includes("akele") ||
        lower.includes("alone") ||
        lower.includes("individual") ||
        raw.includes("ਇਕੱਲੇ") ||
        raw.includes("अकेले")
      ) {
        extractedValue = "Individually / ਇਕੱਲੇ";
      } else {
        extractedValue = raw;
      }
      isValid = true;
      break;
    }
    case "Q7": {
      // Contact / Phone (Optional)
      const digits = raw.replace(/\D/g, "");
      const isSkip =
        lower.includes("skip") ||
        lower.includes("nahi") ||
        lower.includes("no") ||
        raw.includes("ਨਹੀਂ") ||
        raw.includes("ਕੋਈ ਨਹੀਂ") ||
        raw.includes("नहीं");

      if (digits.length >= 10) {
        extractedValue = digits.slice(-10);
        isValid = true;
      } else if (isSkip || raw.length === 0) {
        extractedValue = "";
        isValid = true;
      } else {
        extractedValue = digits || "";
        isValid = true;
      }
      break;
    }
    default:
      extractedValue = raw;
      isValid = true;
  }

  return {
    question_id: questionId,
    extracted_value: extractedValue,
    is_valid: isValid,
    needs_clarification: needsClarification,
    is_unrelated: isUnrelated,
    detected_language: detectedLanguage,
    confidence: isValid ? 0.9 : 0.4,
    secondary_extractions: secondary,
  };
}

/**
 * Main LLM extraction handler
 */
export async function extractVoiceAnswer(questionId, transcript, language = "pa") {
  const trimmed = (transcript || "").trim();
  if (!trimmed) {
    return {
      question_id: questionId,
      extracted_value: "",
      is_valid: false,
      needs_clarification: true,
      is_unrelated: false,
      detected_language: language === "pa" ? "Punjabi" : language === "hi" ? "Hindi" : "English",
      confidence: 0,
      secondary_extractions: {},
    };
  }

  // Attempt configured LLM Provider first
  if (LLM_PROVIDER === "groq" && GROQ_API_KEY) {
    try {
      const result = await callGroq(questionId, trimmed, language);
      if (result && result.question_id) return result;
    } catch (err) {
      console.warn("Groq LLM extraction failed, falling back:", err.message);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const result = await callGemini(questionId, trimmed, language);
      if (result && result.question_id) return result;
    } catch (err) {
      console.warn("Gemini LLM extraction failed, falling back:", err.message);
    }
  }

  if (GROQ_API_KEY) {
    try {
      const result = await callGroq(questionId, trimmed, language);
      if (result && result.question_id) return result;
    } catch (err) {
      console.warn("Groq fallback failed:", err.message);
    }
  }

  // Fallback to deterministic NLP parser
  return deterministicExtractionFallback(questionId, trimmed, language);
}

