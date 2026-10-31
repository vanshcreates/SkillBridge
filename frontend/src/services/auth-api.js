const API_BASE_URL =
  import.meta.env?.VITE_API_URL || 'http://localhost:8000/api'

export const AUTH_TOKEN_KEY = 'skillbridge-auth-token'

export function getAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  } catch (error) {
    console.error('Failed to store auth token in local storage', error)
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear auth token from local storage', error)
  }
}

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (networkError) {
    console.error(`Network error when calling ${endpoint}:`, networkError)
    throw new Error(
      `Unable to connect to the authentication server at ${API_BASE_URL}. Please ensure the backend is running.`
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      `Server returned error ${response.status}: ${response.statusText}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, accountType, phone, ... }
 */
export async function signupApi(userData) {
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  })

  if (result.token) {
    setAuthToken(result.token)
  }

  return result
}

/**
 * Log in an existing user
 * @param {Object} credentials - { email, password, accountType }
 */
export async function loginApi(credentials) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  if (result.token) {
    setAuthToken(result.token)
  }

  return result
}

/**
 * Verify current authentication token
 * @param {string} [tokenOverride] - Optional token to verify
 */
export async function verifyApi(tokenOverride) {
  const token = tokenOverride || getAuthToken()
  if (!token) {
    throw new Error('No authentication token available to verify')
  }

  const result = await apiRequest('/auth/verify', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return result
}

/**
 * Log out user from server
 */
export async function logoutApi() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
    })
  } catch (error) {
    console.warn('Backend logout notification failed:', error.message)
  } finally {
    clearAuthToken()
  }
}

/**
 * Fetch registered artisans from backend
 */
export async function getArtisansApi() {
  const result = await apiRequest('/auth/artisans', {
    method: 'GET',
  })
  return result?.artisans || []
}

/**
 * Verify account manually or via email token
 */
export async function verifyAccountApi(payload) {
  const result = await apiRequest('/auth/verify-account', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result
}

