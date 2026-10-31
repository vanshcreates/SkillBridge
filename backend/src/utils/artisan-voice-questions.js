/**
 * SkillBridge Artisan Voice AI Registration - Predefined Questions & Scripts
 * Target users: Rural women artisans in India (Punjab, Haryana, Rajasthan, UP, etc.)
 * Language support: Natural spoken Punjabi (colloquial), Hindi, English
 */

export const ARTISAN_QUESTIONS = [
  {
    id: "Q1",
    key: "name",
    dbField: "name",
    required: true,
    prompts: {
      pa: {
        spoken: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ। ਤੁਹਾਡਾ ਨਾਂ ਕੀ ਹੈ ਜੀ?",
        display: "ਤੁਹਾਡਾ ਨਾਂ ਕੀ ਹੈ?",
        transliteration: "Sat Sri Akal ji! Tuhada naa ki hai ji?",
      },
      hi: {
        spoken: "नमस्ते जी! मैं आपका स्किलब्रिज सहायक हूँ। आपका नाम क्या है जी?",
        display: "आपका नाम क्या है?",
        transliteration: "Namaste ji! Aapka naam kya hai ji?",
      },
      en: {
        spoken: "Hello and welcome to SkillBridge! What is your name?",
        display: "What is your name?",
        transliteration: "What is your name?",
      },
    },
    hint: "e.g. Gurpreet Kaur, Sunita Sharma, Meena Devi",
  },
  {
    id: "Q2",
    key: "location",
    dbField: "city",
    required: true,
    prompts: {
      pa: {
        spoken: "ਤੁਸੀਂ ਕਿਹੜੇ ਪਿੰਡ ਜਾਂ ਸ਼ਹਿਰ ਵਿੱਚ ਰਹਿੰਦੇ ਹੋ ਜੀ?",
        display: "ਕਿਹੜੇ ਪਿੰਡ ਜਾਂ ਸ਼ਹਿਰ ਵਿੱਚ ਰਹਿੰਦੇ ਹੋ?",
        transliteration: "Tusi kehde pind ya shehar vich rehnde ho ji?",
      },
      hi: {
        spoken: "आप किस गाँव या शहर में रहती हैं जी?",
        display: "किस गाँव या शहर में रहती हैं?",
        transliteration: "Aap kis gaon ya shahar mein rehti hain ji?",
      },
      en: {
        spoken: "Which village or town do you live in?",
        display: "Which village or town do you live in?",
        transliteration: "Which village or town do you live in?",
      },
    },
    hint: "e.g. Ajnala, Amritsar, Barnala, Ludhiana",
  },
  {
    id: "Q3",
    key: "skills",
    dbField: "artCategory",
    required: true,
    prompts: {
      pa: {
        spoken: "ਤੁਸੀਂ ਕਿਹੜਾ ਕੰਮ ਜਾਂ ਹੁਨਰ ਜਾਣਦੇ ਹੋ ਜੀ? ਜਿਵੇਂ ਸਿਲਾਈ, ਕਢਾਈ, ਫੁਲਕਾਰੀ, ਦਸਤਕਾਰੀ ਜਾਂ ਖਾਣਾ ਬਣਾਉਣਾ?",
        display: "ਕਿਹੜਾ ਕੰਮ ਜਾਂ ਹੁਨਰ ਜਾਣਦੇ ਹੋ?",
        transliteration: "Tusi kehda kamm ya hunar jaande ho ji? Jiven silai, phulkari, kadhai, dastkari?",
      },
      hi: {
        spoken: "आप क्या काम या हुनर जानती हैं जी? जैसे सिलाई, कढ़ाई, हस्तशिल्प या खाना बनाना?",
        display: "क्या काम या हुनर जानती हैं?",
        transliteration: "Aap kya kaam ya hunar jaanti hain ji? Jaise silai, kadhai, hastshilp?",
      },
      en: {
        spoken: "What work or skills do you know? For example, stitching, embroidery, handicrafts or food preparation?",
        display: "What work or skills do you know?",
        transliteration: "What work or skills do you know? For example stitching, embroidery, handicrafts?",
      },
    },
    hint: "e.g. Phulkari embroidery, Tailoring, Crochet, Weaving",
  },
  {
    id: "Q4",
    key: "experience",
    dbField: "experience",
    required: true,
    prompts: {
      pa: {
        spoken: "ਤੁਸੀਂ ਇਹ ਕੰਮ ਕਿੰਨੇ ਚਿਰ ਤੋਂ ਕਰ ਰਹੇ ਹੋ ਜੀ?",
        display: "ਕਿੰਨੇ ਚਿਰ ਤੋਂ ਕਰ ਰਹੇ ਹੋ?",
        transliteration: "Tusi eh kamm kinne chir ton kar rahe ho ji?",
      },
      hi: {
        spoken: "आप यह काम कितने समय से कर रही हैं जी?",
        display: "कितने समय से कर रही हैं?",
        transliteration: "Aap yeh kaam kitne samay se kar rahi hain ji?",
      },
      en: {
        spoken: "How long have you been doing this work?",
        display: "How long have you been doing this work?",
        transliteration: "How long have you been doing this work?",
      },
    },
    hint: "e.g. 5 years, Bachpan ton, 10 saal ton",
  },
  {
    id: "Q5",
    key: "products",
    dbField: "products",
    required: true,
    prompts: {
      pa: {
        spoken: "ਤੁਸੀਂ ਕਿਹੜੀਆਂ ਚੀਜ਼ਾਂ ਜਾਂ ਸਮਾਨ ਬਣਾ ਸਕਦੇ ਹੋ ਜੀ?",
        display: "ਕਿਹੜੀਆਂ ਚੀਜ਼ਾਂ ਜਾਂ ਸਮਾਨ ਬਣਾ ਸਕਦੇ ਹੋ?",
        transliteration: "Tusi kehdiyan cheezan ya samaan bana sakde ho ji?",
      },
      hi: {
        spoken: "आप कौन-कौन सी चीज़ें या सामान बना सकती हैं जी?",
        display: "कौन सी चीज़ें या सामान बना सकती हैं?",
        transliteration: "Aap kaun-kaun si cheezein ya samaan bana sakti hain ji?",
      },
      en: {
        spoken: "What products or items can you make?",
        display: "What products or items can you make?",
        transliteration: "What products or items can you make?",
      },
    },
    hint: "e.g. Phulkari dupattas, Suits, Bags, Clay pots",
  },
  {
    id: "Q6",
    key: "preference",
    dbField: "preference",
    required: true,
    prompts: {
      pa: {
        spoken: "ਕੀ ਤੁਸੀਂ ਇਕੱਲੇ ਕੰਮ ਕਰਨਾ ਪਸੰਦ ਕਰੋਗੇ ਜਾਂ ਹੋਰ ਭੈਣਾਂ ਨਾਲ ਸਮੂਹ ਵਿੱਚ ਮਿਲ ਕੇ?",
        display: "ਇਕੱਲੇ ਜਾਂ ਸਮੂਹ ਵਿੱਚ ਕੰਮ ਕਰਨਾ ਪਸੰਦ ਕਰੋਗੇ?",
        transliteration: "Ki tusi ikalle kamm karna pasand karoge ya samooh vich?",
      },
      hi: {
        spoken: "क्या आप अकेले काम करना पसंद करेंगी या अन्य महिलाओं के साथ समूह में मिलकर?",
        display: "अकेले या समूह में काम करना पसंद करेंगी?",
        transliteration: "Kya aap akele kaam karna pasand karengi ya samooh mein?",
      },
      en: {
        spoken: "Would you prefer to work individually or together with other women in a group?",
        display: "Work individually or in a group?",
        transliteration: "Would you prefer to work individually or together with other women in a group?",
      },
    },
    hint: "e.g. Group / Samooh, Akele / Individually, Dono theek ne",
  },
  {
    id: "Q7",
    key: "phone",
    dbField: "phone",
    required: false,
    prompts: {
      pa: {
        spoken: "ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦੱਸ ਸਕਦੇ ਹੋ ਤਾਂ ਜੋ ਅਸੀਂ ਕੰਮ ਦੇ ਮੌਕਿਆਂ ਬਾਰੇ ਤੁਹਾਡੇ ਨਾਲ ਗੱਲ ਕਰ ਸਕੀਏ? ਜੇਕਰ ਨਹੀਂ ਹੈ ਤਾਂ ਕਹਿ ਦਿਓ ਕੋਈ ਨਹੀਂ।",
        display: "ਸੰਪਰਕ ਲਈ ਮੋਬਾਈਲ ਨੰਬਰ (ਮਰਜ਼ੀ ਮੁਤਾਬਕ)",
        transliteration: "Ki tusi apna mobile number dass sakde ho ji? (Optional)",
      },
      hi: {
        spoken: "क्या आप अपना मोबाइल नंबर बता सकती हैं ताकि हम काम के अवसरों के लिए आपसे संपर्क कर सकें? यदि नहीं है तो कोई बात नहीं।",
        display: "संपर्क हेतु मोबाइल नंबर (वैकल्पिक)",
        transliteration: "Kya aap apna mobile number bata sakti hain ji? (Optional)",
      },
      en: {
        spoken: "Can you share a mobile number so that we can contact you about work opportunities? You can say skip if you do not have one.",
        display: "Contact mobile number (Optional)",
        transliteration: "Can you share a mobile number so we can contact you?",
      },
    },
    hint: "e.g. 9876543210 or Skip",
  },
];

export const SYSTEM_MESSAGES = {
  greeting: {
    pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡਾ ਕਾਰੀਗਰ ਖਾਤਾ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ।",
    hi: "नमस्ते जी! मैं आपका स्किलब्रिज सहायक हूँ। मैं आपका कारीगर खाता बनाने में मदद करूँगा।",
    en: "Hello! I am your SkillBridge assistant. I will help you register your artisan profile.",
  },
  unclear: {
    pa: "ਮੈਨੂੰ ਤੁਹਾਡੀ ਗੱਲ ਠੀਕ ਤਰ੍ਹਾਂ ਸਮਝ ਨਹੀਂ ਆਈ ਜੀ, ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵਾਰ ਫਿਰ ਦੱਸੋ।",
    hi: "मुझे आपकी बात ठीक से समझ नहीं आई जी, कृपया एक बार फिर बताएँ।",
    en: "I could not quite understand that. Could you please say that again?",
  },
  redirect: {
    pa: "ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਇਸ ਸਵਾਲ ਦਾ ਜਵਾਬ ਦਿਓ ਜੀ।",
    hi: "कृपया पहले इस सवाल का उत्तर दें जी।",
    en: "Please answer this question first.",
  },
  summaryIntro: {
    pa: "ਬਹੁਤ ਵਧੀਆ! ਤੁਹਾਡੀ ਸਾਰੀ ਜਾਣਕਾਰੀ ਦਰਜ ਹੋ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸੁਣੋ:",
    hi: "बहुत बढ़िया! आपकी सारी जानकारी दर्ज हो गई है। कृपया सुनें:",
    en: "Wonderful! All your details are recorded. Please listen to your summary:",
  },
  confirmationAsk: {
    pa: "ਕੀ ਇਹ ਸਾਰੀ ਜਾਣਕਾਰੀ ਸਹੀ ਹੈ ਜੀ? ਜੇਕਰ ਸਹੀ ਹੈ ਤਾਂ ਕਹੋ 'ਹਾਂ' ਜਾਂ 'ਸਹੀ ਹੈ'।",
    hi: "क्या यह सारी जानकारी सही है जी? यदि सही है तो 'हाँ' या 'सही है' बोलें।",
    en: "Is this information correct? Say 'yes' or 'confirm' to complete your registration.",
  },
  success: {
    pa: "ਮੁਬਾਰਕਾਂ ਜੀ! ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਆਰਟੀਜ਼ਨ ਖਾਤਾ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਿਆ ਹੈ!",
    hi: "बधाई हो जी! आपका स्किलब्रिज कारीगर खाता सफलतापूर्वक बन गया है!",
    en: "Congratulations! Your SkillBridge artisan account has been successfully created!",
  },
  error: {
    pa: "ਕੁਝ ਤਕਨੀਕੀ ਖਰਾਬੀ ਆਈ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜੀ।",
    hi: "कुछ तकनीकी समस्या आई है, कृपया दोबारा प्रयास करें जी।",
    en: "Something went wrong. Please try again.",
  },
};

/**
 * Generate human-friendly summary text in the requested language
 */
export function buildSummaryText(answers = {}, lang = "pa") {
  const name = answers.name || (lang === "pa" ? "ਨਹੀਂ ਦੱਸਿਆ" : lang === "hi" ? "नहीं बताया" : "Not provided");
  const loc = answers.location || (lang === "pa" ? "ਪੰਜਾਬ" : lang === "hi" ? "भारत" : "India");
  const skills = Array.isArray(answers.skills) ? answers.skills.join(", ") : answers.skills || (lang === "pa" ? "ਦਸਤਕਾਰੀ" : "Handicrafts");
  const exp = answers.experience || (lang === "pa" ? "ਤਜਰਬੇਕਾਰ" : "Experienced");
  const prods = answers.products || (lang === "pa" ? "ਹੱਥ ਨਾਲ ਬਣਿਆ ਸਮਾਨ" : "Handmade products");
  const pref = answers.preference || (lang === "pa" ? "ਸਮੂਹ ਵਿੱਚ" : "Group work");
  const phone = answers.phone || (lang === "pa" ? "ਨਹੀਂ ਦਿੱਤਾ" : lang === "hi" ? "नहीं दिया" : "None");

  if (lang === "pa") {
    return `ਤੁਹਾਡਾ ਨਾਂ ਹੈ ${name}। ਤੁਸੀਂ ${loc} ਤੋਂ ਹੋ। ਤੁਹਾਡਾ ਹੁਨਰ ਹੈ ${skills}। ਤੁਹਾਨੂੰ ਇਸ ਕੰਮ ਦਾ ${exp} ਦਾ ਤਜਰਬਾ ਹੈ। ਤੁਸੀਂ ${prods} ਬਣਾਉਂਦੇ ਹੋ। ਤੁਸੀਂ ${pref} ਕੰਮ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ। ਅਤੇ ਸੰਪਰਕ ਨੰਬਰ ਹੈ ${phone}।`;
  }
  if (lang === "hi") {
    return `आपका नाम ${name} है। आप ${loc} से हैं। आपका हुनर ${skills} है। आपको इस काम का ${exp} अनुभव है। आप ${prods} बनाती हैं। आप ${pref} काम करना चाहती हैं। और संपर्क नंबर ${phone} है।`;
  }
  return `Your name is ${name}. You are from ${loc}. Your craft is ${skills}. You have ${exp} of experience. You make ${prods}. You prefer to work ${pref}. And your contact number is ${phone}.`;
}

