import { useState } from 'react'
import { BookOpenCheck } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import ExpertLayout from '../components/layout/ExpertLayout'
import ProfileImageSignupField from '../components/profile/ProfileImageSignupField'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const ExpertAuthPage = () => {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'login' ? 'login' : 'signup',
  )
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentUser, authenticate } = useAuthDialog()
  const navigate = useNavigate()
  const isSignup = mode === 'signup'

  if (currentUser) {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    const formData = new FormData(event.currentTarget)

    setIsSubmitting(true)
    try {
      let user
      if (isSignup) {
        const password = formData.get('password')
        if (password !== formData.get('confirmPassword')) {
          throw new Error('The passwords do not match.')
        }
        const profileImageFile = formData.get('profileImage')
        const signupPayload = new FormData()
        signupPayload.append('accountType', 'expert')
        signupPayload.append('name', formData.get('name') || '')
        signupPayload.append('email', formData.get('email') || '')
        signupPayload.append('phone', formData.get('phone') || '')
        signupPayload.append('expertise', formData.get('expertise') || '')
        signupPayload.append('bio', formData.get('bio') || '')
        signupPayload.append('password', password)
        if (profileImageFile && profileImageFile.size > 0) {
          signupPayload.append('avatar', profileImageFile)
        }
        user = await saveRegisteredUser(signupPayload)
      } else {
        user = await authenticateUser(
          formData.get('email'),
          formData.get('password'),
          'expert',
        )
        if (!user) {
          throw new Error('Expert account not found or the password is incorrect.')
        }
      }

      authenticate(user)
      navigate('/expert/dashboard', { replace: true })
    } catch (error) {
      setNotice(error.message || 'Unable to authenticate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ExpertLayout>
      <main className="grid min-h-[calc(100vh-5rem)] w-full lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <section className="relative hidden overflow-hidden bg-primary px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-36 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full border border-white/10" />
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <BookOpenCheck aria-hidden="true" className="h-7 w-7" />
            </span>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Teach what you know
            </p>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-tight xl:text-5xl">
              Share your expertise with the next generation of makers.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/75">
              Build practical courses, share your knowledge of craft, and help
              artisans learn at their own pace.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              'Create guided courses',
              'Share craft techniques',
              'Reach artisan learners',
              'Grow a learning community',
            ].map((benefit) => (
              <p
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white/90"
                key={benefit}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
                {benefit}
              </p>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-9">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-secondary lg:hidden">
              <BookOpenCheck aria-hidden="true" className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-secondary">Expert studio account</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-text-main">
              {isSignup ? 'Create your expert profile' : 'Welcome back'}
            </h2>
            <p className="mt-2 leading-6 text-text-secondary">
              {isSignup
                ? 'Introduce your experience and the skills you can teach.'
                : 'Log in to create and manage your courses.'}
            </p>

            <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              {isSignup && (
                <>
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
                  <label className="block text-sm font-medium text-text-main">
                    Phone number <span className="font-normal text-text-muted">(optional)</span>
                    <input
                      autoComplete="tel"
                      className={inputClass}
                      name="phone"
                      placeholder="Your phone number"
                      type="tel"
                    />
                  </label>
                </>
              )}
              <label className="block text-sm font-medium text-text-main sm:col-span-2">
                Email address
                <input
                  autoComplete="email"
                  className={inputClass}
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </label>

              {isSignup && <ProfileImageSignupField className="sm:col-span-2" />}

              {isSignup && (
                <>
                  <label className="block text-sm font-medium text-text-main sm:col-span-2">
                    Area of expertise
                    <input
                      className={inputClass}
                      maxLength={100}
                      name="expertise"
                      placeholder="e.g. textile arts and natural dyeing"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-text-main sm:col-span-2">
                    Experience and background
                    <textarea
                      className={inputClass}
                      maxLength={500}
                      name="bio"
                      placeholder="Share your teaching, craft, or professional experience"
                      required
                      rows="3"
                    />
                  </label>
                </>
              )}

              <label className="block text-sm font-medium text-text-main sm:col-span-2">
                Password
                <input
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  className={inputClass}
                  minLength={8}
                  name="password"
                  placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  required
                  type="password"
                />
              </label>
              {isSignup && (
                <label className="block text-sm font-medium text-text-main sm:col-span-2">
                  Confirm password
                  <input
                    autoComplete="new-password"
                    className={inputClass}
                    minLength={8}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    required
                    type="password"
                  />
                </label>
              )}

              {notice && (
                <p
                  aria-live="polite"
                  className="rounded-lg border border-error/30 bg-red-50 px-3.5 py-3 text-sm leading-5 text-error sm:col-span-2"
                  role="alert"
                >
                  {notice}
                </p>
              )}

              <button
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? 'Please wait…'
                  : isSignup
                    ? 'Create expert account'
                    : 'Log in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
              {isSignup ? 'Already have an expert account?' : 'New to teaching on SkillBridge?'}{' '}
              <button
                className="font-semibold text-primary underline underline-offset-4"
                onClick={() => {
                  setNotice('')
                  setMode(isSignup ? 'login' : 'signup')
                }}
                type="button"
              >
                {isSignup ? 'Log in' : 'Create an expert account'}
              </button>
            </p>
          </div>
        </section>
      </main>
    </ExpertLayout>
  )
}

export default ExpertAuthPage
