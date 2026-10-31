import { useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import ExpertLayout from '../components/layout/ExpertLayout'
import ProfileImageSignupField from '../components/profile/ProfileImageSignupField'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none transition-all placeholder:text-text-muted focus:border-secondary focus:ring-3 focus:ring-secondary/15'

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
      <main className="grid min-h-[calc(100vh-5rem)] w-full lg:grid-cols-[minmax(0,1.1fr)_minmax(28rem,0.95fr)]">
        {/* Left Hero */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#432310] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-36 -top-32 h-96 w-96 rounded-full border border-white/10 blur-2xl" />
          <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full border border-white/10 blur-3xl" />
          
          <div className="relative z-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
              <GraduationCap aria-hidden="true" className="h-7 w-7 text-secondary" />
            </span>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Craft Master & Mentorship</span>
            </div>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-tight xl:text-5xl">
              Share Your Knowledge with the Next Generation of Makers.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
              Build interactive video courses, share heritage techniques, and empower rural artisans to elevate their craftsmanship.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              {[
                { title: 'Create Guided Courses', desc: 'Step-by-step video lessons' },
                { title: 'Heritage Techniques', desc: 'Preserve traditional skills' },
                { title: 'Artisan Learners', desc: 'Track learner enrollments' },
                { title: 'Master Certification', desc: 'SkillBridge mentor badge' },
              ].map(({ title, desc }) => (
                <div
                  className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10"
                  key={title}
                >
                  <p className="flex items-center gap-2 text-xs font-bold text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{title}</span>
                  </p>
                  <p className="mt-1 text-[0.7rem] text-white/70 leading-normal">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/15 text-xs text-white/60">
            SkillBridge Training Studio · Empowering Makers Through Knowledge
          </div>
        </section>

        {/* Right Form Section */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-9">
            <div className="mb-4 flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to SkillBridge Home</span>
              </Link>
              <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">
                Expert Studio
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpenCheck aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-text-main sm:text-3xl">
                  {isSignup ? 'Create Expert Studio Profile' : 'Expert Studio Login'}
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {isSignup
                    ? 'Introduce your craft background and teaching specializations.'
                    : 'Log in to create lessons and guide artisan learners.'}
                </p>
              </div>
            </div>

            <form className="mt-7 grid gap-3.5 sm:grid-cols-2" onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <label className="block text-xs font-bold text-text-main">
                    Full Name
                    <div className="relative">
                      <input
                        autoComplete="name"
                        className={inputClass}
                        name="name"
                        placeholder="Your full name"
                        required
                      />
                      <User className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>
                  <label className="block text-xs font-bold text-text-main">
                    Phone Number <span className="font-normal text-text-muted">(optional)</span>
                    <div className="relative">
                      <input
                        autoComplete="tel"
                        className={inputClass}
                        name="phone"
                        placeholder="Contact number"
                        type="tel"
                      />
                      <Phone className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>
                </>
              )}

              <label className="block text-xs font-bold text-text-main sm:col-span-2">
                Email Address
                <div className="relative">
                  <input
                    autoComplete="email"
                    className={inputClass}
                    name="email"
                    placeholder="expert@example.com"
                    required
                    type="email"
                  />
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                </div>
              </label>

              {isSignup && <ProfileImageSignupField className="sm:col-span-2" />}

              {isSignup && (
                <>
                  <label className="block text-xs font-bold text-text-main sm:col-span-2">
                    Primary Area of Expertise
                    <input
                      className={inputClass}
                      maxLength={100}
                      name="expertise"
                      placeholder="E.g. Natural indigo dyeing, block printing, pottery glazing"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-text-main sm:col-span-2">
                    Experience and Craft Background
                    <textarea
                      className={inputClass}
                      maxLength={500}
                      name="bio"
                      placeholder="Share your years of practice, awards, or mentorship experience"
                      required
                      rows="3"
                    />
                  </label>
                </>
              )}

              <label className="block text-xs font-bold text-text-main sm:col-span-2">
                Password
                <div className="relative">
                  <input
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className={inputClass}
                    minLength={8}
                    name="password"
                    placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
                    required
                    type="password"
                  />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                </div>
              </label>

              {isSignup && (
                <label className="block text-xs font-bold text-text-main sm:col-span-2">
                  Confirm Password
                  <div className="relative">
                    <input
                      autoComplete="new-password"
                      className={inputClass}
                      minLength={8}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      required
                      type="password"
                    />
                    <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                  </div>
                </label>
              )}

              {notice && (
                <p
                  className="rounded-xl border border-error/30 bg-red-50 px-4 py-2.5 text-xs text-error sm:col-span-2 font-medium"
                  role="alert"
                >
                  {notice}
                </p>
              )}

              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover px-5 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:col-span-2 text-sm"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? 'Please wait…'
                  : isSignup
                    ? 'Register Training Expert Profile'
                    : 'Log In to Expert Studio'}
              </button>
            </form>

            <div className="mt-6 border-t border-border/70 pt-5 text-center">
              <p className="text-xs text-text-secondary">
                {isSignup ? 'Already have an expert studio account?' : 'Want to join as a craft mentor?'}{' '}
                <button
                  className="font-bold text-primary underline underline-offset-4 hover:text-secondary"
                  onClick={() => {
                    setMode(isSignup ? 'login' : 'signup')
                    setNotice('')
                  }}
                  type="button"
                >
                  {isSignup ? 'Sign in to studio' : 'Create an expert profile'}
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
    </ExpertLayout>
  )
}

export default ExpertAuthPage
