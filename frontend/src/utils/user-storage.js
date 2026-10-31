import {
  clearAuthToken,
  getArtisansApi,
  getAuthToken,
  loginApi,
  setAuthToken,
  signupApi,
  verifyApi,
} from '../services/auth-api'

const SESSION_USER_KEY = 'skillbridge-current-user'

/**
 * Fetch artisans list from backend API
 */
export async function fetchArtisansList() {
  try {
    const artisans = await getArtisansApi()
    if (Array.isArray(artisans)) {
      return artisans
    }
  } catch (error) {
    console.warn('Failed to fetch artisans from backend:', error.message)
  }
  return []
}

/**
 * Authenticate user with Backend API (POST /api/auth/login)
 */
export async function authenticateUser(email, password, accountType) {
  const result = await loginApi({ email, password, accountType })
  if (result?.user) {
    saveSessionUser(result.user)
    if (result.token) {
      setAuthToken(result.token)
    }
    return result.user
  }
  throw new Error(result?.message || 'Unable to authenticate. Please check your credentials.')
}

/**
 * Read cached active user session from memory/storage
 */
export function readSessionUser() {
  const token = getAuthToken()
  if (!token) {
    try {
      window.localStorage.removeItem(SESSION_USER_KEY)
    } catch {}
    return null
  }

  try {
    const storedUser = window.localStorage.getItem(SESSION_USER_KEY)
    if (!storedUser) return null
    return JSON.parse(storedUser)
  } catch (error) {
    console.error('The current user session is invalid.', error)
    try {
      window.localStorage.removeItem(SESSION_USER_KEY)
    } catch {}
    return null
  }
}

/**
 * Cache current active user
 */
export function saveSessionUser(user) {
  try {
    window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
  } catch (err) {
    console.warn('Failed to save session user:', err)
  }
}

/**
 * Clear user session and JWT auth token
 */
export function clearSessionUser() {
  clearAuthToken()
  try {
    window.localStorage.removeItem(SESSION_USER_KEY)
  } catch {}
}

/**
 * Verify current session with Backend API (GET /api/auth/verify)
 */
export async function verifyUserSession() {
  try {
    const result = await verifyApi()
    if (result?.user) {
      saveSessionUser(result.user)
      return result.user
    }
    return null
  } catch (error) {
    clearSessionUser()
    throw error
  }
}

/**
 * Register a new user with Backend API (POST /api/auth/signup)
 */
export async function saveRegisteredUser(profile) {
  const result = await signupApi(profile)
  if (result?.user) {
    saveSessionUser(result.user)
    if (result.token) {
      setAuthToken(result.token)
    }
    return result.user
  }
  throw new Error(result?.message || 'Unable to complete registration.')
}
