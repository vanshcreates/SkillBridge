import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPage from '../pages/AuthPage'
import {
  clearSessionUser,
  readSessionUser,
  saveSessionUser,
  verifyUserSession,
} from '../utils/user-storage'
import { getAuthToken } from '../services/auth-api'
import { AuthDialogContext } from './auth-dialog-context'

const AuthDialogProvider = ({ children }) => {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [currentUser, setCurrentUser] = useState(() => readSessionUser())
  const [isVerifying, setIsVerifying] = useState(false)

  // Automatically verify session with backend verify API on load
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      if (readSessionUser()) {
        clearSessionUser()
        setCurrentUser(null)
      }
      return
    }

    let isMounted = true
    setIsVerifying(true)

    verifyUserSession()
      .then((verifiedUser) => {
        if (isMounted && verifiedUser) {
          setCurrentUser(verifiedUser)
        }
      })
      .catch((err) => {
        console.warn('Session verification failed. Logging out.', err.message)
        if (isMounted) {
          clearSessionUser()
          setCurrentUser(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsVerifying(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const openAuth = useCallback(
    (authMode) => {
      if (!currentUser) setMode(authMode)
    },
    [currentUser],
  )
  const closeAuth = useCallback(() => setMode(null), [])
  const authenticate = useCallback((user) => {
    saveSessionUser(user)
    setCurrentUser(user)
    setMode(null)
  }, [])
  const logout = useCallback(() => {
    clearSessionUser()
    setCurrentUser(null)
    setMode(null)
    navigate('/', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({ openAuth, currentUser, authenticate, logout, isVerifying }),
    [openAuth, currentUser, authenticate, logout, isVerifying],
  )

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      {mode && (
        <AuthPage
          key={mode}
          mode={mode}
          onAuthenticate={authenticate}
          onClose={closeAuth}
          onModeChange={setMode}
        />
      )}
    </AuthDialogContext.Provider>
  )
}

export default AuthDialogProvider
