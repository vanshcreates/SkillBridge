import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import IndustryLayout from '../components/layout/IndustryLayout'
import ProfileImageSignupField from '../components/profile/ProfileImageSignupField'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none transition-all placeholder:text-text-muted focus:border-secondary focus:ring-3 focus:ring-secondary/15'

const IndustryAuthPage = () => {
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
        signupPayload.append('accountType', 'industry')
        signupPayload.append('name', formData.get('companyName') || '')
        signupPayload.append('contactName', formData.get('contactName') || '')
        signupPayload.append('phone', formData.get('phone') || '')
        signupPayload.append('email', formData.get('email') || '')
        signupPayload.append('industry', formData.get('industry') || '')
        signupPayload.append('companyAddress', formData.get('companyAddress') || '')
        signupPayload.append('password', password)
        if (profileImageFile && profileImageFile.size > 0) {
          signupPayload.append('avatar', profileImageFile)
        }
        user = await saveRegisteredUser(signupPayload)
      } else {
        user = await authenticateUser(
          formData.get('email'),
          formData.get('password'),
          'industry',
        )
        if (!user) {
          throw new Error('Industry account not found or the password is incorrect.')
        }
      }

      authenticate(user)
      navigate('/industry/dashboard', { replace: true })
    } catch (error) {
      setNotice(error.message || 'Unable to authenticate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <IndustryLayout>
      <main className="grid min-h-[calc(100vh-5rem)] w-full lg:grid-cols-[minmax(0,1.1fr)_minmax(28rem,0.95fr)]">
        {/* Left Enterprise Brand Hero */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#432310] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-36 -top-32 h-96 w-96 rounded-full border border-white/10 blur-2xl" />
          <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full border border-white/10 blur-3xl" />
          
          <div className="relative z-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
              <Building2 aria-hidden="true" className="h-7 w-7 text-secondary" />
            </span>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Enterprise Craft Sourcing</span>
            </div>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-tight xl:text-5xl">
              Source Exceptional Craft Directly From Verified Makers.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
              Publish production orders, track artisan completion in real time, and settle verified payouts securely via Razorpay.
            </p>

            {/* Enterprise Trust Highlights */}
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              {[
                { title: 'Assign Production Runs', desc: 'Custom briefs & quantity tracking' },
                { title: 'Live Milestone Updates', desc: 'Acceptance, in-progress, completed' },
                { title: 'Direct Razorpay Settlement', desc: 'Fair wages paid on order completion' },
                { title: 'Official Digital Receipts', desc: 'Tax & audit-ready transaction records' },
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

          <div className="relative z-10 pt-8 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
            <span>SkillBridge Enterprise Partner Network</span>
            <span>Secured Escrow & Verification</span>
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
                Industry Portal
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-text-main sm:text-3xl">
                  {isSignup ? 'Register Industry Partner' : 'Industry Workspace Login'}
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {isSignup
                    ? 'Create your enterprise profile to commission craftspeople.'
                    : 'Manage active orders, verify completion, and process payouts.'}
                </p>
              </div>
            </div>

            <form className="mt-7 grid gap-3.5 sm:grid-cols-2" onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <label className="block text-xs font-bold text-text-main">
                    Company / Organization Name
                    <div className="relative">
                      <input
                        autoComplete="organization"
                        className={inputClass}
                        maxLength={100}
                        name="companyName"
                        placeholder="E.g. FabIndia Creations Ltd."
                        required
                      />
                      <Building2 className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>
                  <label className="block text-xs font-bold text-text-main">
                    Authorized Contact Person
                    <div className="relative">
                      <input
                        autoComplete="name"
                        className={inputClass}
                        maxLength={100}
                        name="contactName"
                        placeholder="Full name"
                        required
                      />
                      <User className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>
                  <label className="block text-xs font-bold text-text-main">
                    Corporate Phone Number
                    <div className="relative">
                      <input
                        autoComplete="tel"
                        className={inputClass}
                        name="phone"
                        placeholder="E.g. +91 98765 43210"
                        required
                        type="tel"
                      />
                      <Phone className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>
                  <label className="block text-xs font-bold text-text-main">
                    Industry Sector
                    <select className={inputClass} defaultValue="" name="industry" required>
                      <option disabled value="">Select industry sector</option>
                      <option>Fashion and apparel</option>
                      <option>Home and interiors</option>
                      <option>Retail and gifting</option>
                      <option>Hospitality</option>
                      <option>Arts and culture</option>
                      <option>Other</option>
                    </select>
                  </label>
                </>
              )}

              <label className="block text-xs font-bold text-text-main sm:col-span-2">
                Work Email Address
                <div className="relative">
                  <input
                    autoComplete="email"
                    className={inputClass}
                    name="email"
                    placeholder="partner@company.com"
                    required
                    type="email"
                  />
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                </div>
              </label>

              {isSignup && <ProfileImageSignupField className="sm:col-span-2" />}

              {isSignup && (
                <label className="block text-xs font-bold text-text-main sm:col-span-2">
                  Headquarters / Facility Address
                  <div className="relative">
                    <input
                      autoComplete="street-address"
                      className={inputClass}
                      maxLength={200}
                      name="companyAddress"
                      placeholder="City, State, Country"
                      required
                    />
                    <MapPin className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                  </div>
                </label>
              )}

              <label className="block text-xs font-bold text-text-main sm:col-span-2">
                Password
                <div className="relative">
                  <input
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className={inputClass}
                    minLength={8}
                    name="password"
                    placeholder={isSignup ? 'At least 8 characters' : 'Enter password'}
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
                {isSignup ? <BellRing className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <span>
                  {isSubmitting
                    ? 'Processing…'
                    : isSignup
                      ? 'Register Industry Partner Account'
                      : 'Log In to Industry Workspace'}
                </span>
              </button>
            </form>

            <div className="mt-6 border-t border-border/70 pt-5 text-center">
              <p className="text-xs text-text-secondary">
                {isSignup ? 'Already registered as an industry partner?' : 'Need to register an enterprise account?'}{' '}
                <button
                  className="font-bold text-primary underline underline-offset-4 hover:text-secondary"
                  onClick={() => {
                    setMode(isSignup ? 'login' : 'signup')
                    setNotice('')
                  }}
                  type="button"
                >
                  {isSignup ? 'Sign in to workspace' : 'Create partner account'}
                </button>
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.68rem] text-text-muted">
                <CreditCard className="h-3 w-3 text-secondary" />
                <span>Integrated with Razorpay direct artisan payouts & verification</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </IndustryLayout>
  )
}

export default IndustryAuthPage
