import { createElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import ProfileImageSignupField from '../components/profile/ProfileImageSignupField'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-main outline-none transition-all placeholder:text-text-muted focus:border-secondary focus:ring-3 focus:ring-secondary/15'

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
      badge: 'Makers & Crafts',
      description: 'Showcase your craft, join voice onboarding, and grow your business.',
      icon: BriefcaseBusiness,
      path: '/artisan/auth',
    },
    {
      id: 'customer',
      title: 'Customer',
      badge: 'Collector & Supporter',
      description: 'Discover handmade work and support local makers directly.',
      icon: ShoppingBasket,
    },
    {
      id: 'industry',
      title: 'Industry Partner',
      badge: 'Bulk Sourcing & B2B',
      description: 'Connect with makers, assign orders, and explore production runs.',
      icon: Building2,
      path: '/industry/auth',
    },
    {
      id: 'expert',
      title: 'Training Expert',
      badge: 'Master Mentor',
      description: 'Share your knowledge and teach practical artisan skills.',
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 px-4 py-6 backdrop-blur-md transition-all sm:px-6"
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
          selectedAccountType ? 'max-w-lg' : 'max-w-2xl'
        } rounded-3xl border border-white/20 bg-surface/95 p-6 shadow-2xl backdrop-blur-xl sm:p-9`}
        role="dialog"
      >
        {/* Top Control Bar */}
        <div className="mb-4 flex items-center justify-between">
          <button
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => {
              onClose()
              navigate('/', { replace: true })
            }}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Return to SkillBridge</span>
          </button>
          <button
            aria-label="Close sign-in dialog"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted/60 text-text-muted transition hover:bg-surface-muted hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {selectedAccountType && (
          <button
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => setSelectedAccountType(null)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Select another account role</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">
              {selectedAccountType
                ? 'Customer Profile'
                : isSignup
                  ? 'Join SkillBridge'
                  : 'Welcome Back'}
            </p>
            <h1
              className="mt-0.5 font-serif text-2xl font-bold tracking-tight text-text-main sm:text-3xl"
              id="auth-heading"
            >
              {selectedAccountType
                ? isSignup
                  ? 'Create Customer Account'
                  : 'Sign in to SkillBridge'
                : isSignup
                  ? 'Choose How You Participate'
                  : 'Select Account Workspace'}
            </h1>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
          {selectedAccountType
            ? isSignup
              ? 'Complete your profile to order directly from certified craftspeople.'
              : 'Log in with your customer email and password to access your dashboard.'
            : `Select your role to ${isSignup ? 'create your verified account' : 'log in to your workspace'}.`}
        </p>

        {/* Role Cards Picker */}
        {!selectedAccountType ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3.5 sm:grid-cols-2">
              {accountTypes.map(({ id, title, badge, description, icon: Icon }) => (
                <button
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-white/70 p-4 text-left transition-all duration-200 hover:border-secondary hover:bg-white hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  key={id}
                  onClick={() => selectAccountType(id)}
                  type="button"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {createElement(Icon, {
                        'aria-hidden': true,
                        className: 'h-5 w-5',
                      })}
                    </span>
                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[0.65rem] font-bold text-secondary">
                      {badge}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="block font-bold text-sm text-text-main group-hover:text-primary transition-colors">
                      {title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-text-muted">
                      {description}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[0.72rem] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Continue as {title}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>

            <button
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-text-muted transition hover:bg-surface-muted hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => {
                onClose()
                navigate('/', { replace: true })
              }}
              type="button"
            >
              Cancel and return to home
            </button>
          </div>
        ) : (
          /* Customer Form */
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="block text-xs font-bold text-text-main">
                Full Name
                <div className="relative">
                  <input
                    autoComplete="name"
                    className={inputClass}
                    name="name"
                    placeholder="E.g. Priya Sharma"
                    required
                  />
                  <User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </label>
            )}

            {isSignup && <ProfileImageSignupField />}

            <label className="block text-xs font-bold text-text-main">
              Email Address
              <div className="relative">
                <input
                  autoComplete="email"
                  className={inputClass}
                  id="auth-email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
                <Mail className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </label>

            <label className="block text-xs font-bold text-text-main">
              Password
              <div className="relative">
                <input
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  className={inputClass}
                  minLength={6}
                  name="password"
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  required
                  type="password"
                />
                <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </label>

            {isSignup && (
              <label className="block text-xs font-bold text-text-main">
                Confirm Password
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className={inputClass}
                    minLength={6}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    required
                    type="password"
                  />
                  <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </label>
            )}

            <p className="text-[0.72rem] leading-relaxed text-text-muted">
              Passwords securely hashed with bcrypt. Authenticated via signed JWT sessions.
            </p>

            {notice && (
              <p
                aria-live="polite"
                className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
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
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-hover px-5 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 text-sm"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? 'Authenticating…'
                : isSignup
                  ? 'Create Customer Account'
                  : 'Log In to Profile'}
            </button>

            <button
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-text-muted transition hover:bg-surface-muted hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => {
                onClose()
                navigate('/', { replace: true })
              }}
              type="button"
            >
              Cancel and return to home
            </button>
          </form>
        )}

        {selectedAccountType && (
          <p className="mt-5 text-center text-xs text-text-secondary">
            {isSignup ? 'Already registered?' : 'New to SkillBridge?'}{' '}
            <button
              className="font-bold text-primary underline underline-offset-4 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => onModeChange(isSignup ? 'login' : 'signup')}
              type="button"
            >
              {isSignup ? 'Sign in instead' : 'Create an account'}
            </button>
          </p>
        )}

        {selectedAccountType && (
          <p className="mt-3 text-center text-[0.68rem] text-text-muted">
            Secured by SkillBridge Unified Auth & MongoDB.
          </p>
        )}
      </section>
    </div>
  )
}

export default AuthPage
