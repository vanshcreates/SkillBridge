import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Lock,
  Mail,
  Mic,
  Palette,
  Phone,
  Sparkles,
  User,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import ArtisanLayout from '../components/layout/ArtisanLayout'
import ProfileImageSignupField from '../components/profile/ProfileImageSignupField'
import ArtisanVoiceAssistant from '../components/voice/ArtisanVoiceAssistant'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none transition-all placeholder:text-text-muted focus:border-secondary focus:ring-3 focus:ring-secondary/15'

const ArtisanAuthPage = () => {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'login' ? 'login' : 'signup',
  )
  const [registrationMethod, setRegistrationMethod] = useState('voice') // 'voice' or 'form'
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentUser, authenticate } = useAuthDialog()
  const navigate = useNavigate()
  const isSignup = mode === 'signup'
  useEffect(() => {
    const handleVoiceSignup = () => {
      setMode('signup')
      setRegistrationMethod('voice')
    }
    const handleLoginSwitch = () => {
      setMode('login')
    }
    window.addEventListener('open-voice-signup', handleVoiceSignup)
    window.addEventListener('switch-to-artisan-login', handleLoginSwitch)
    return () => {
      window.removeEventListener('open-voice-signup', handleVoiceSignup)
      window.removeEventListener('switch-to-artisan-login', handleLoginSwitch)
    }
  }, [])

  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode === 'login' || urlMode === 'signup') {
      setMode(urlMode)
    }
    const urlMethod = searchParams.get('method')
    if (urlMethod === 'voice' || urlMethod === 'form') {
      setRegistrationMethod(urlMethod)
    }
  }, [searchParams])


  if (currentUser) {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }

  const handleVoiceRegistered = (user) => {
    authenticate(user)
    navigate('/artisan/profile', { replace: true })
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

        const phone = formData.get('phone') || ''
        const cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length < 10) {
          throw new Error('Please enter a valid phone number with at least 10 digits.')
        }

        const profileImageFile = formData.get('profileImage')
        const signupPayload = new FormData()
        signupPayload.append('accountType', 'artisan')
        signupPayload.append('name', formData.get('name') || '')
        signupPayload.append('phone', cleanPhone)
        signupPayload.append('email', formData.get('email') || '')
        signupPayload.append('artCategory', formData.get('artCategory') || '')
        signupPayload.append('experience', formData.get('experience') || '')
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
          'artisan',
        )
        if (!user) {
          throw new Error('Artisan account not found or the password is incorrect.')
        }
      }

      authenticate(user)
      navigate('/artisan/profile', { replace: true })
    } catch (error) {
      setNotice(error.message || 'Unable to authenticate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ArtisanLayout>
      <main className="grid min-h-[calc(100vh-5rem)] w-full lg:grid-cols-[minmax(0,1.05fr)_minmax(32rem,1.15fr)]">
        {/* Left Hero / Brand Section */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#4a2612] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-36 -top-32 h-96 w-96 rounded-full border border-white/10 blur-2xl" />
          <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full border border-white/10 blur-3xl" />
          
          <div className="relative z-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
              <BriefcaseBusiness aria-hidden="true" className="h-7 w-7 text-secondary" />
            </span>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Your Craft · Your Livelihood</span>
            </div>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-tight xl:text-5xl">
              Build Your Workshop and Showcase Your Cultural Art.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
              Join India's dedicated artisan collective. Reach global patrons, receive direct fair-wage orders, and earn verified payouts.
            </p>

            {/* Voice Registration Spotlight Card */}
            <div className="mt-8 max-w-lg rounded-2xl border border-white/25 bg-gradient-to-br from-white/15 to-white/5 p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-accent font-bold text-sm">
                <Mic className="h-4 w-4 animate-pulse text-accent" />
                <span>ਵਾਇਸ ਰਜਿਸਟ੍ਰੇਸ਼ਨ / Multilingual Voice AI Assistant</span>
              </div>
              <p className="mt-2 text-xs text-white/90 leading-relaxed">
                Rural women artisans can register hands-free simply by speaking in
                <strong> Punjabi (ਪੰਜਾਬੀ)</strong>, <strong>Hindi (हिंदी)</strong>, or <strong>English</strong> with our interactive voice robot assistant!
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 max-w-lg">
              {[
                'Direct Fair-Wage Orders',
                'Multilingual Voice Assistant',
                'Zero Middleman Fees',
                'Instant Razorpay Escrow',
              ].map((benefit) => (
                <div
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/90 backdrop-blur-xs"
                  key={benefit}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/15 text-xs text-white/60">
            SkillBridge Artisan Community Network · Cultural Empowerment
          </div>
        </section>

        {/* Right Auth / Registration Content */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-2xl">
            {/* Return link */}
            <div className="mb-4 flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to SkillBridge Home</span>
              </Link>
              <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">
                Artisan Workspace
              </span>
            </div>

            {/* Mode: Signup with Voice vs Form */}
            {isSignup ? (
              <div>
                {/* Method Switcher Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-1.5 shadow-xs">
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all duration-200 ${
                      registrationMethod === 'voice'
                        ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md'
                        : 'text-text-secondary hover:text-text-main hover:bg-surface-muted/60'
                    }`}
                    onClick={() => setRegistrationMethod('voice')}
                    type="button"
                  >
                    <Bot className="h-4 w-4" />
                    <span>ਬੋਲ ਕੇ ਰਜਿਸਟਰ ਕਰੋ (Voice Assistant)</span>
                  </button>

                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all duration-200 ${
                      registrationMethod === 'form'
                        ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md'
                        : 'text-text-secondary hover:text-text-main hover:bg-surface-muted/60'
                    }`}
                    onClick={() => setRegistrationMethod('form')}
                    type="button"
                  >
                    <FileText className="h-4 w-4" />
                    <span>ਫਾਰਮ ਭਰੋ (Standard Form)</span>
                  </button>
                </div>

                {/* Render Voice Assistant or Manual Form */}
                {registrationMethod === 'voice' ? (
                  <ArtisanVoiceAssistant
                    onRegistered={handleVoiceRegistered}
                    onSwitchToForm={() => setRegistrationMethod('form')}
                  />
                ) : (
                  <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-9">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <BriefcaseBusiness aria-hidden="true" className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-text-main sm:text-3xl">
                          Artisan Registration
                        </h2>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          Fill out the details below to launch your verified workshop.
                        </p>
                      </div>
                    </div>

                    <form
                      className="mt-6 grid gap-3.5 sm:grid-cols-2"
                      onSubmit={handleSubmit}
                    >
                      <label className="block text-xs font-bold text-text-main">
                        Full Name
                        <div className="relative">
                          <input
                            autoComplete="name"
                            className={inputClass}
                            name="name"
                            placeholder="E.g. Manjeet Kaur"
                            required
                          />
                          <User className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                        </div>
                      </label>
                      <label className="block text-xs font-bold text-text-main">
                        Mobile Phone Number
                        <div className="relative">
                          <input
                            autoComplete="tel"
                            className={inputClass}
                            minLength={10}
                            name="phone"
                            pattern="[0-9]{10,}"
                            placeholder="10-digit phone number"
                            required
                            title="Please enter at least 10 digits"
                            type="tel"
                          />
                          <Phone className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                        </div>
                      </label>

                      <label className="block text-xs font-bold text-text-main sm:col-span-2">
                        Email Address
                        <div className="relative">
                          <input
                            autoComplete="email"
                            className={inputClass}
                            name="email"
                            placeholder="artisan@example.com"
                            required
                            type="email"
                          />
                          <Mail className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                        </div>
                      </label>

                      <ProfileImageSignupField className="sm:col-span-2" />

                      <label className="block text-xs font-bold text-text-main">
                        Traditional Craft Category
                        <select
                          className={inputClass}
                          defaultValue=""
                          name="artCategory"
                          required
                        >
                          <option disabled value="">Select craft category</option>
                          <option>Embroidery and Phulkari</option>
                          <option>Weaving and textiles</option>
                          <option>Tailoring</option>
                          <option>Pottery and ceramics</option>
                          <option>Wood, metal, or stone craft</option>
                          <option>Jewellery making</option>
                          <option>Painting and visual arts</option>
                          <option>Food and natural products</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <label className="block text-xs font-bold text-text-main">
                        Experience Level
                        <select
                          className={inputClass}
                          defaultValue=""
                          name="experience"
                          required
                        >
                          <option disabled value="">Select experience</option>
                          <option>Just starting</option>
                          <option>Less than 2 years</option>
                          <option>2–5 years</option>
                          <option>6–10 years</option>
                          <option>More than 10 years</option>
                        </select>
                      </label>

                      <label className="block text-xs font-bold text-text-main sm:col-span-2">
                        About Your Work & Traditions <span className="font-normal text-text-muted">(optional)</span>
                        <textarea
                          className={inputClass}
                          name="bio"
                          placeholder="Describe your heritage, tools, techniques, or materials"
                          rows="3"
                        />
                      </label>

                      <label className="block text-xs font-bold text-text-main sm:col-span-2">
                        Password
                        <div className="relative">
                          <input
                            autoComplete="new-password"
                            className={inputClass}
                            minLength={8}
                            name="password"
                            placeholder="At least 8 characters"
                            required
                            type="password"
                          />
                          <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                        </div>
                      </label>

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

                      {notice && (
                        <p
                          aria-live="polite"
                          className="rounded-xl border border-error/30 bg-red-50 px-4 py-2.5 text-xs text-error sm:col-span-2 font-medium"
                          role="alert"
                        >
                          {notice}
                        </p>
                      )}

                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-hover px-5 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:col-span-2 text-sm"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? 'Creating profile…' : 'Create Artisan Account & Launch Shop'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* Mode: Login */
              <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-9">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BriefcaseBusiness aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-text-main sm:text-3xl">
                      Welcome Back, Artisan
                    </h2>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      Sign in to manage your workshop, orders, and payment payouts.
                    </p>
                  </div>
                </div>

                <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                  <label className="block text-xs font-bold text-text-main">
                    Email Address
                    <div className="relative">
                      <input
                        autoComplete="email"
                        className={inputClass}
                        name="email"
                        placeholder="you@example.com"
                        required
                        type="email"
                      />
                      <Mail className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>

                  <label className="block text-xs font-bold text-text-main">
                    Password
                    <div className="relative">
                      <input
                        autoComplete="current-password"
                        className={inputClass}
                        name="password"
                        placeholder="Your password"
                        required
                        type="password"
                      />
                      <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </label>

                  {notice && (
                    <p
                      aria-live="polite"
                      className="rounded-xl border border-error/30 bg-red-50 px-4 py-2.5 text-xs text-error font-medium"
                      role="alert"
                    >
                      {notice}
                    </p>
                  )}

                  <button
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-hover px-5 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 text-sm"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Authenticating…' : 'Log In to Artisan Profile'}
                  </button>
                </form>
              </div>
            )}

            {/* Toggle between Login and Signup */}
            <div className="mt-6 border-t border-border/70 pt-5 text-center">
              <p className="text-xs text-text-secondary">
                {isSignup ? 'Already have an artisan account?' : 'Need to register your craft shop?'}{' '}
                <button
                  className="font-bold text-primary underline underline-offset-4 hover:text-secondary"
                  onClick={() => {
                    setNotice('')
                    setMode(isSignup ? 'login' : 'signup')
                  }}
                  type="button"
                >
                  {isSignup ? 'Log in to profile' : 'Create an artisan account'}
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
    </ArtisanLayout>
  )
}

export default ArtisanAuthPage
