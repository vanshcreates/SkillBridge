/**
 * SkillBridge Voice Assistant Service
 * Natural language intent extraction & slot filling for Artisan activities
 * Supports English, Hindi, Hinglish, and Punjabi.
 */

const getGeminiKey = () => process.env.GEMINI_API_KEY || process.env.GEMINI_TTS_API_KEY || "";
const getGroqKey = () => process.env.GROQ_API_KEY || "";
const getLlmProvider = () => (process.env.LLM_PROVIDER || "gemini").toLowerCase();

/**
 * System prompt defining all artisan actions and extraction schema
 */
function buildAssistantSystemPrompt(artisanContext = {}) {
  return `You are SkillBridge's AI Voice Assistant for Indian Artisans.
The artisan is currently logged in.
Artisan Name: "${artisanContext.name || "Artisan"}"
Artisan ID: "${artisanContext.id || ""}"
Shop Name: "${artisanContext.shopName || ""}"

Your job is to understand natural spoken requests in English, Hindi, Hinglish (Hindi written in English/Latin script), or Punjabi (Gurmukhi or Romanized).
Determine the artisan's INTENT and extract any ENTITIES/PARAMETERS.

SUPPORTED INTENTS:
1. PROFILE_GET: View profile details ("Show my profile", "Mera profile dikhao", "ਮੇਰਾ ਵੇਰਵਾ ਦਿਖਾਓ")
2. PROFILE_UPDATE: Update profile fields ("Change name to X", "Update phone to 9876543210", "Add weaving to my skills", "Change business name to X", "Update city to Patiala")
   - Entities: { name?, phone?, bio?, skills?, shopName?, city?, state? }
3. PRODUCT_LIST: View products ("Show my products", "Mera saman dikhao", "What products do I have listed?")
4. PRODUCT_SEARCH: Search products ("Find wooden chair", "Do I have dupattas?")
   - Entities: { query }
5. PRODUCT_ADD: Add a product ("Add a new product", "I want to sell wooden table", "Naya product jodna hai", "Add wooden chair for 2500")
   - Entities: { title?, category?, price?, stock?, description? }
6. PRODUCT_UPDATE: Update price or stock ("Change price of wooden chair to 2500", "Update stock of table to 10")
   - Entities: { title?, productId?, price?, stock? }
7. PRODUCT_DELETE: Delete product ("Delete wooden chair", "Remove table")
   - Entities: { title?, productId? }
8. ORDER_LIST: View orders ("Show my orders", "Do I have new orders?", "Pending orders dikhao", "Completed orders")
   - Entities: { status?: "Pending" | "Completed" | "Processing" | "All", customerName?, productTitle? }
9. ORDER_DETAILS: Order details ("Show details of order #1234", "Details of Rahul's order")
   - Entities: { orderId?, orderNumber?, customerName? }
10. ORDER_ACCEPT: Accept order ("Accept order #1234", "Accept latest order")
    - Entities: { orderId?, orderNumber? }
11. ORDER_REJECT: Reject order ("Reject order #1234 because material unavailable")
    - Entities: { orderId?, orderNumber?, reason? }
12. ORDER_COMPLETE: Mark order complete ("Mark order #1234 as completed", "Kaam poora ho gaya")
    - Entities: { orderId?, orderNumber? }
13. PAYMENT_SUMMARY: Total earnings / how much earned ("How much have I earned?", "Total earnings", "Meri kamai", "Kitne kamaye")
14. PAYMENT_PENDING: Pending payments ("Which payments are pending?", "Kitne paise aane baaki hain?")
15. PAYMENT_HISTORY: Payment history ("Show payment history", "Payouts record")
16. DASHBOARD_SUMMARY: Business summary / analytics ("Give me a summary of my business", "How is business doing?", "Karobar kaisa hai?")
17. FIND_INDUSTRIALISTS: Search industrialists / projects ("Find industrialists looking for furniture", "Factory wale dhoondo", "Open projects")
    - Entities: { query?, category? }
18. COLLABORATION_REQUESTS: View business requests / proposals ("Show collaboration requests", "New enquiries")
19. COLLABORATION_ACCEPT: Accept project proposal ("Accept project #123", "Accept latest collaboration")
    - Entities: { projectId?, title? }
20. NOTIFICATIONS_GET: Check notifications ("Show notifications", "Any new alerts?")
21. HELP: Help on features ("How to add product?", "How do payments work?")
22. AFFIRMATION: Confirmation ("Yes", "Haan", "Confirm", "Sahi hai", "Theek hai", "ਹਾਂ")
23. NEGATION: Rejection / cancellation ("No", "Cancel", "Nahi", "Mat karo", "ਰੱਦ ਕਰੋ", "ਨਹੀਂ")
24. UNKNOWN: Unrelated or general conversation.

RETURN JSON SCHEMA ONLY:
{
  "intent": "INTENT_NAME",
  "entities": {
    "title": "...",
    "category": "...",
    "price": 2500,
    "stock": 10,
    "phone": "...",
    "orderNumber": "...",
    "orderId": "...",
    "status": "...",
    "query": "..."
  },
  "detectedLanguage": "pa" | "hi" | "en",
  "confidence": 0.95
}`;
}

/**
 * Call Gemini to parse intent
 */
async function callGeminiForIntent(message, artisanContext = {}) {
  const geminiKey = getGeminiKey();
  if (!geminiKey) throw new Error("No Gemini API key");

  const prompt = `${buildAssistantSystemPrompt(artisanContext)}

USER SPOKEN COMMAND:
"${message}"

Extract JSON only.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

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

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawText.replace(/```json\n?|\n?```/g, "").trim());
}

/**
 * Call Groq to parse intent
 */
async function callGroqForIntent(message, artisanContext = {}) {
  const groqKey = getGroqKey();
  if (!groqKey) throw new Error("No Groq API key");

  const systemPrompt = buildAssistantSystemPrompt(artisanContext);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `USER COMMAND:\n"${message}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data?.choices?.[0]?.message?.content);
}

/**
 * Comprehensive Deterministic NLP Fallback
 * Works reliably for English, Hindi, Hinglish, and Punjabi commands
 */
export function deterministicIntentMatcher(message = "") {
  const raw = message.trim();
  const lower = raw.toLowerCase();

  // Language detection
  const hasGurmukhi = /[\u0A00-\u0A7F]/.test(raw);
  const hasDevanagari = /[\u0900-\u097F]/.test(raw);
  const detectedLanguage = hasGurmukhi ? "pa" : hasDevanagari ? "hi" : "en";

  // Check Affirmation / Negation
  if (
    /^(yes|yeah|yep|haan|ha|hanji|sahi hai|theek hai|confirm|bilkul|kar do|add kar do|delete kar do|yes please|ਹਾਂ|ਸਹੀ ਹੈ|ਠੀਕ ਹੈ|हाँ|सही है)$/i.test(
      lower
    ) ||
    lower.startsWith("yes") ||
    lower.startsWith("haan") ||
    lower.startsWith("hanji") ||
    raw.startsWith("ਹਾਂ") ||
    raw.startsWith("हाँ") ||
    raw.includes("ਸਹੀ ਹੈ") ||
    raw.includes("ਠੀਕ ਹੈ") ||
    raw.includes("सही है")
  ) {
    return { intent: "AFFIRMATION", entities: {}, detectedLanguage, confidence: 0.99 };
  }

  if (
    /^(no|nope|cancel|nahi|na|mat karo|rehne do|cancel karo|dont|don't|ਰੱਦ ਕਰੋ|ਨਹੀਂ|नहीं|रद्द करें)$/i.test(
      lower
    ) ||
    lower.startsWith("no ") ||
    lower.startsWith("nahi") ||
    raw.startsWith("ਨਹੀਂ") ||
    raw.startsWith("नहीं") ||
    raw.includes("ਰੱਦ") ||
    raw.includes("रद्द")
  ) {
    return { intent: "NEGATION", entities: {}, detectedLanguage, confidence: 0.99 };
  }

  // 1. EARNINGS & PAYMENTS (earn, earned, earnings, kamai, kamaya, payout, payment, paise)
  if (
    lower.includes("earn") ||
    lower.includes("kamai") ||
    lower.includes("kamaya") ||
    lower.includes("payout") ||
    lower.includes("payment") ||
    lower.includes("paise") ||
    lower.includes("income") ||
    raw.includes("ਕਮਾਈ") ||
    raw.includes("ਪੈਸੇ") ||
    raw.includes("कमाई") ||
    raw.includes("भुगतान")
  ) {
    if (lower.includes("pending") || lower.includes("baaki") || lower.includes("baki") || raw.includes("ਬਾਕੀ")) {
      return { intent: "PAYMENT_PENDING", entities: {}, detectedLanguage, confidence: 0.95 };
    }
    if (lower.includes("history") || lower.includes("record") || lower.includes("purane") || raw.includes("ਇਤਿਹਾਸ")) {
      return { intent: "PAYMENT_HISTORY", entities: {}, detectedLanguage, confidence: 0.95 };
    }
    return { intent: "PAYMENT_SUMMARY", entities: {}, detectedLanguage, confidence: 0.95 };
  }

  // 2. DASHBOARD / BUSINESS SUMMARY
  if (
    lower.includes("dashboard") ||
    lower.includes("summary") ||
    lower.includes("analytics") ||
    lower.includes("karobar kaisa") ||
    lower.includes("business kaisa") ||
    lower.includes("how is my business") ||
    lower.includes("overall status") ||
    raw.includes("ਸੰਖੇਪ") ||
    raw.includes("ਕਾਰੋਬਾਰ") ||
    raw.includes("कारोबार")
  ) {
    return { intent: "DASHBOARD_SUMMARY", entities: {}, detectedLanguage, confidence: 0.92 };
  }

  // 3. ORDERS
  if (
    lower.includes("order") ||
    lower.includes("orders") ||
    raw.includes("ਆਰਡਰ") ||
    raw.includes("ऑर्डर")
  ) {
    // Order Actions
    if (lower.includes("accept") || lower.includes("swikar") || raw.includes("ਸਵੀਕਾਰ")) {
      const match = raw.match(/#?([a-zA-Z0-9_-]{5,})/);
      return {
        intent: "ORDER_ACCEPT",
        entities: { orderNumber: match ? match[1] : "" },
        detectedLanguage,
        confidence: 0.92,
      };
    }
    if (lower.includes("reject") || lower.includes("decline") || lower.includes("mana") || raw.includes("ਰੱਦ")) {
      const match = raw.match(/#?([a-zA-Z0-9_-]{5,})/);
      return {
        intent: "ORDER_REJECT",
        entities: { orderNumber: match ? match[1] : "" },
        detectedLanguage,
        confidence: 0.92,
      };
    }
    if (lower.includes("complete") || lower.includes("poora") || lower.includes("finish") || raw.includes("ਪੂਰਾ")) {
      const match = raw.match(/#?([a-zA-Z0-9_-]{5,})/);
      return {
        intent: "ORDER_COMPLETE",
        entities: { orderNumber: match ? match[1] : "" },
        detectedLanguage,
        confidence: 0.92,
      };
    }
    if (lower.includes("detail") || lower.includes("kiska order") || lower.includes("about order")) {
      const match = raw.match(/#?([a-zA-Z0-9_-]{5,})/);
      return {
        intent: "ORDER_DETAILS",
        entities: { orderNumber: match ? match[1] : "" },
        detectedLanguage,
        confidence: 0.9,
      };
    }

    // Order Listing with Status Filter
    let status = "All";
    if (lower.includes("pending") || lower.includes("new") || lower.includes("naye") || raw.includes("ਨਵੇਂ") || raw.includes("ਲੰਬਿਤ")) {
      status = "Pending";
    } else if (lower.includes("completed") || lower.includes("poore") || raw.includes("ਪੂਰੇ")) {
      status = "Completed";
    } else if (lower.includes("processing") || lower.includes("shipped")) {
      status = "Processing";
    }

    return {
      intent: "ORDER_LIST",
      entities: { status },
      detectedLanguage,
      confidence: 0.95,
    };
  }

  // 4. ADD PRODUCT (matches "Add a new...", "I want to sell...", "Naya saman bechna hai")
  if (
    lower.startsWith("add ") ||
    lower.includes("add a ") ||
    lower.includes("add new") ||
    lower.includes("want to sell") ||
    lower.includes("sell a ") ||
    lower.includes("sell my ") ||
    lower.includes("naya product") ||
    lower.includes("bechna hai") ||
    lower.includes("jodna hai") ||
    raw.includes("ਨਵਾਂ ਉਤਪਾਦ") ||
    raw.includes("ਵੇਚਣਾ ਹੈ") ||
    raw.includes("ਜੋੜੋ")
  ) {
    const priceMatch = raw.match(/(?:for|rs\.?|inr|₹|price|rate|rupees|at)\s*(\d{2,6})/i) || raw.match(/(\d{3,6})\s*(?:rs\.?|rupees|₹)/i);
    const stockMatch = raw.match(/(?:stock|quantity|items?|units?|pieces?|chairs?|pece|nag|ਨਗ)?\s*(\d+)\s*(?:stock|quantity|items?|units?|pieces?|chairs?|pece|nag|ਨਗ)/i);

    // Try to extract title: between 'add/sell' and 'for/at/with/price/rs'
    let extractedTitle = raw
      .replace(/^(add|i want to sell|sell|add new|add a new|naya product|bechna hai|please add)\s+/i, "")
      .replace(/\s+(for|at|price|with|in category|rs|rupees|₹).*/i, "")
      .replace(/\b(product|item|saman)\b/gi, "")
      .trim();

    return {
      intent: "PRODUCT_ADD",
      entities: {
        title: extractedTitle || undefined,
        price: priceMatch ? Number(priceMatch[1]) : undefined,
        stock: stockMatch ? Number(stockMatch[1]) : undefined,
      },
      detectedLanguage,
      confidence: 0.95,
    };
  }

  // 5. SEARCH & DISCOVERY
  if (
    (lower.startsWith("find ") ||
      lower.startsWith("search ") ||
      lower.startsWith("dhoondo ") ||
      raw.includes("ਲੱਭੋ") ||
      raw.includes("ਢੂੰਢੋ")) &&
    !lower.includes("industry") &&
    !lower.includes("industrialist") &&
    !lower.includes("factory") &&
    !lower.includes("project")
  ) {
    const query = raw
      .replace(/^(find|search|dhoondo|please find|search for|ਲੱਭੋ|ਢੂੰਢੋ)\s+/i, "")
      .replace(/\b(product|item|saman|for)\b/gi, "")
      .trim();
    return {
      intent: "PRODUCT_SEARCH",
      entities: { query: query || raw },
      detectedLanguage,
      confidence: 0.92,
    };
  }

  // 6. PRODUCTS / LISTINGS
  if (
    lower.includes("product") ||
    lower.includes("products") ||
    lower.includes("item") ||
    lower.includes("items") ||
    lower.includes("saman") ||
    lower.includes("cheez") ||
    raw.includes("ਉਤਪਾਦ") ||
    raw.includes("ਸਮਾਨ") ||
    raw.includes("सामान") ||
    raw.includes("उत्पाद")
  ) {
    if (lower.includes("delete") || lower.includes("remove") || lower.includes("hatao") || raw.includes("ਮਿਟਾਓ")) {
      const title = raw.replace(/(delete|remove|hatao|product|item|saman|ਮਿਟਾਓ)/gi, "").trim();
      return {
        intent: "PRODUCT_DELETE",
        entities: { title },
        detectedLanguage,
        confidence: 0.9,
      };
    }

    if (lower.includes("price") || lower.includes("rate") || lower.includes("stock") || lower.includes("update") || lower.includes("change")) {
      const numMatch = raw.match(/\d+/);
      return {
        intent: "PRODUCT_UPDATE",
        entities: {
          price: lower.includes("price") || lower.includes("rate") ? (numMatch ? Number(numMatch[0]) : undefined) : undefined,
          stock: lower.includes("stock") ? (numMatch ? Number(numMatch[0]) : undefined) : undefined,
        },
        detectedLanguage,
        confidence: 0.88,
      };
    }

    if (lower.includes("search") || lower.includes("find") || lower.includes("dhoondo") || raw.includes("ਲੱਭੋ")) {
      const query = raw.replace(/(search|find|dhoondo|product|item|saman|for)/gi, "").trim();
      return {
        intent: "PRODUCT_SEARCH",
        entities: { query },
        detectedLanguage,
        confidence: 0.9,
      };
    }

    return {
      intent: "PRODUCT_LIST",
      entities: {},
      detectedLanguage,
      confidence: 0.95,
    };
  }

  // 6. INDUSTRIALISTS & COLLABORATIONS
  if (
    lower.includes("industry") ||
    lower.includes("industrialist") ||
    lower.includes("factory") ||
    lower.includes("company") ||
    lower.includes("collaboration") ||
    lower.includes("proposal") ||
    lower.includes("enquiry") ||
    lower.includes("project") ||
    raw.includes("ਉਦਯੋਗ") ||
    raw.includes("ਫੈਕਟਰੀ") ||
    raw.includes("उद्योग")
  ) {
    if (lower.includes("accept") || raw.includes("ਸਵੀਕਾਰ")) {
      return { intent: "COLLABORATION_ACCEPT", entities: {}, detectedLanguage, confidence: 0.9 };
    }
    if (lower.includes("request") || lower.includes("enquir") || lower.includes("proposal")) {
      return { intent: "COLLABORATION_REQUESTS", entities: {}, detectedLanguage, confidence: 0.92 };
    }
    return { intent: "FIND_INDUSTRIALISTS", entities: {}, detectedLanguage, confidence: 0.92 };
  }

  // 7. PROFILE
  if (
    lower.includes("profile") ||
    lower.includes("account") ||
    lower.includes("mera naam") ||
    lower.includes("phone number") ||
    lower.includes("my details") ||
    raw.includes("ਪ੍ਰੋਫਾਈਲ") ||
    raw.includes("ਪ੍ਰੋਫਾਈਲ") ||
    raw.includes("प्रोफाइल")
  ) {
    if (lower.includes("change") || lower.includes("update") || lower.includes("badlo") || raw.includes("ਬਦਲੋ")) {
      const phoneDigits = raw.replace(/\D/g, "");
      return {
        intent: "PROFILE_UPDATE",
        entities: {
          phone: phoneDigits.length >= 10 ? phoneDigits.slice(-10) : undefined,
        },
        detectedLanguage,
        confidence: 0.9,
      };
    }
    return { intent: "PROFILE_GET", entities: {}, detectedLanguage, confidence: 0.95 };
  }

  // 8. NOTIFICATIONS
  if (lower.includes("notification") || lower.includes("alert") || lower.includes("message") || raw.includes("ਸੂਚਨਾ")) {
    return { intent: "NOTIFICATIONS_GET", entities: {}, detectedLanguage, confidence: 0.95 };
  }

  // 9. HELP
  if (lower.includes("help") || lower.includes("madad") || lower.includes("kaise") || lower.includes("how to") || raw.includes("ਮਦਦ")) {
    return { intent: "HELP", entities: {}, detectedLanguage, confidence: 0.9 };
  }

  return { intent: "UNKNOWN", entities: { raw }, detectedLanguage, confidence: 0.4 };
}

/**
 * Main intent extraction pipeline
 */
export async function parseArtisanIntent(message, artisanContext = {}) {
  const trimmed = (message || "").trim();
  if (!trimmed) {
    return { intent: "UNKNOWN", entities: {}, detectedLanguage: "en", confidence: 0 };
  }

  let result = null;

  // Try LLM if configured
  const provider = getLlmProvider();
  const groqKey = getGroqKey();
  const geminiKey = getGeminiKey();

  if (provider === "groq" && groqKey) {
    try {
      result = await callGroqForIntent(trimmed, artisanContext);
    } catch (e) {
      console.warn("Groq intent parsing failed, falling back:", e.message);
    }
  }

  if (!result && geminiKey) {
    try {
      result = await callGeminiForIntent(trimmed, artisanContext);
    } catch (e) {
      console.warn("Gemini intent parsing failed, falling back:", e.message);
    }
  }

  // Fallback to deterministic NLP matcher
  if (!result || !result.intent) {
    result = deterministicIntentMatcher(trimmed);
  }

  return result;
}
