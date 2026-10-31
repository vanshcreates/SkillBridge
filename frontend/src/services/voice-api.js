import { apiRequest, setAuthToken } from './auth-api'
import { saveSessionUser } from '../utils/user-storage'

/**
 * Fetch voice registration questions & system messages
 */
export async function getVoiceQuestionsApi(lang = 'pa') {
  return await apiRequest(`/voice/questions?lang=${encodeURIComponent(lang)}`, {
    method: 'GET',
  })
}

/**
 * Send spoken transcript and question ID to backend for LLM extraction
 */
export async function processVoiceAnswerApi({
  question_id,
  transcript,
  language = 'pa',
  current_answers = {},
}) {
  return await apiRequest('/voice/process-answer', {
    method: 'POST',
    body: JSON.stringify({
      question_id,
      transcript,
      language,
      current_answers,
    }),
  })
}

/**
 * Request spoken profile summary text in chosen language
 */
export async function getVoiceSummaryApi({ answers = {}, language = 'pa' }) {
  return await apiRequest('/voice/summary', {
    method: 'POST',
    body: JSON.stringify({ answers, language }),
  })
}

/**
 * Complete voice registration and authenticate artisan
 */
export async function registerArtisanVoiceApi({ answers = {}, language = 'pa' }) {
  const result = await apiRequest('/voice/register', {
    method: 'POST',
    body: JSON.stringify({ answers, language }),
  })

  if (result?.token) {
    setAuthToken(result.token)
  }
  if (result?.user) {
    saveSessionUser(result.user)
  }

  return result
}

