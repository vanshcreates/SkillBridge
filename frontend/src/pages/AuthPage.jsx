import { createElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
  ShoppingBasket,
  X,
} from 'lucide-react'
import ProfileImageSignupField from '../components/profile/ProfileImageSignupField'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'
import {
  readProfileImageFile,
  saveProfileImage,
} from '../utils/artisan-profile-storage'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const AuthPage = ({ mode, onClose, onModeChange, onAuthenticate }) => {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const [selectedAccountType, setSelectedAccountType] = useState(null)
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const accountTypes = [
    {
      id: 'artisan',
      title: 'Artisan',
      description: 'Showcase your craft and grow your business.',
      icon: BriefcaseBusiness,
      path: '/artisan/auth',
    },
    {
      id: 'customer',
      title: 'Customer',
      description: 'Discover handmade work and support local makers.',
      icon: ShoppingBasket,
    },
    {
      id: 'industry',
      title: 'Industry partner',
      description: 'Connect with makers and explore collaborations.',
      icon: Building2,
      path: '/industry/auth',
    },
    {
      id: 'expert',
      title: 'Training expert',
      description: 'Share your knowledge and teach practical skills.',
      icon: BookOpenCheck,
      path: '/expert/auth',
    },
  ]

  const selectAccountType = (accountType) => {
    const account = accountTypes.find((type) => type.id === accountType)
    if (account.path) {
      onClose()
      navigate(`${account.path}?mode=${mode}`)
      return
    }
    setSelectedAccountType(accountType)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeIsError(false)
    const formData = new FormData(event.currentTarget)

    setIsSubmitting(true)
    try {
      if (isSignup) {
        const password = formData.get('password')
        if (password !== formData.get('confirmPassword')) {
          throw new Error('The passwords do not match.')
        }
        const profileImageFile = formData.get('profileImage')
        const signupPayload = new FormData()
        signupPayload.append('accountType', 'customer')
        signupPayload.append('name', formData.get('name') || '')
        signupPayload.append('email', formData.get('email') || '')
        signupPayload.append('password', password)
        if (profileImageFile && profileImageFile.size > 0) {
          signupPayload.append('avatar', profileImageFile)
        }
        const user = await saveRegisteredUser(signupPayload)
        if (user?.avatar) saveProfileImage(user, user.avatar)
        onAuthenticate(user)
        navigate('/profile', { replace: true })
        return
      }

      const user = await authenticateUser(
        formData.get('email'),
        formData.get('password'),
        'customer',
      )
      if (!user) {
        throw new Error('Email or password is incorrect.')
      }
      onAuthenticate(user)
      navigate('/profile', { replace: true })
    } catch (error) {
      setNotice(error.message || 'Unable to authenticate. Please try again.')
      setNoticeIsError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <section
        aria-labelledby="auth-heading"
        aria-modal="true"
        className={`relative my-auto w-full ${
          selectedAccountType ? 'max-w-md' : 'max-w-2xl'
        } rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-9`}
        role="dialog"
      >
        <button
          aria-label="Close sign-in dialog"
          autoFocus
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        {selectedAccountType && (
          <button
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => setSelectedAccountType(null)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Choose a different account type
          </button>
        )}
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-secondary">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-secondary">
          {selectedAccountType
            ? 'Customer account'
            : isSignup
              ? 'Join our community'
              : 'Welcome back'}
        </p>
        <h1
          className="mt-1 font-serif text-3xl font-semibold text-text-main"
          id="auth-heading"
        >
          {selectedAccountType
            ? isSignup
              ? 'Create your account'
              : 'Log in to SkillBridge'
            : isSignup
              ? 'Choose your account type'
              : 'Choose your account type'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {selectedAccountType
            ? isSignup
              ? 'Create a SkillBridge customer profile.'
              : 'Log in with the email and password you used to sign up.'
            : `Select how you’d like to use SkillBridge to ${isSignup ? 'sign up' : 'log in'}.`}
        </p>

        {!selectedAccountType ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {accountTypes.map(({ id, title, description, icon: Icon }) => (
              <button
                className="flex min-h-28 items-start gap-4 rounded-xl border border-border bg-white p-4 text-left transition hover:border-secondary hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                key={id}
                onClick={() => selectAccountType(id)}
                type="button"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-secondary">
                  {createElement(Icon, {
                    'aria-hidden': true,
                    className: 'h-5 w-5',
                  })}
                </span>
                <span>
                  <span className="block font-semibold text-text-main">{title}</span>
                  <span className="mt-1 block text-sm leading-5 text-text-secondary">
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="block text-sm font-medium text-text-main">
              Full name
              <input
                autoComplete="name"
                className={inputClass}
                name="name"
                placeholder="Your full name"
                required
              />
            </label>
          )}

          {isSignup && <ProfileImageSignupField />}

          <label className="block text-sm font-medium text-text-main">
            Email address
            <input
              autoComplete="email"
              className={inputClass}
              id="auth-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>

          <label className="block text-sm font-medium text-text-main">
            Password
            <input
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className={inputClass}
              minLength={6}
              name="password"
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              required
              type="password"
            />
          </label>

          {isSignup && (
            <label className="block text-sm font-medium text-text-main">
              Confirm password
              <input
                autoComplete="new-password"
                className={inputClass}
                minLength={6}
                name="confirmPassword"
                placeholder="Re-enter your password"
                required
                type="password"
              />
            </label>
          )}

          <p className="text-xs leading-5 text-text-muted">
            Your password is securely encrypted with bcrypt and authenticated with JWT tokens.
          </p>

          {notice && (
            <p
              aria-live="polite"
              className={`rounded-lg border px-3.5 py-3 text-sm leading-5 ${
                noticeIsError
                  ? 'border-error/30 bg-red-50 text-error'
                  : 'border-border bg-background text-text-secondary'
              }`}
              role={noticeIsError ? 'alert' : 'status'}
            >
              {notice}
            </p>
          )}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? 'Please wait…'
              : isSignup
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>
        )}

        {selectedAccountType && <p className="mt-6 text-center text-sm text-text-secondary">
          {isSignup ? 'Already have an account?' : 'New to SkillBridge?'}{' '}
          <button
            className="font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => onModeChange(isSignup ? 'login' : 'signup')}
            type="button"
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>}
        {selectedAccountType && (
          <p className="mt-4 text-center text-xs text-text-muted">
            Secured by Byteforce Authentication & MongoDB.
          </p>
        )}
      </section>
    </div>
  )
}

export default AuthPage
