import { useState } from 'react'
import { BellRing, Building2 } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import IndustryLayout from '../components/layout/IndustryLayout'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  authenticateUser,
  saveRegisteredUser,
} from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

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
        user = await saveRegisteredUser({
          accountType: 'industry',
          name: formData.get('companyName'),
          contactName: formData.get('contactName'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          industry: formData.get('industry'),
          companyAddress: formData.get('companyAddress'),
          password,
        })
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
      <main className="grid min-h-[calc(100vh-5rem)] w-full lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]">
        <section className="relative hidden overflow-hidden bg-primary px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-36 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full border border-white/10" />
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Building2 aria-hidden="true" className="h-7 w-7" />
            </span>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Industry partnerships
            </p>
            <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-tight xl:text-5xl">
              Source exceptional craft, directly from its makers.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/75">
              Share a production brief with an artisan, track their response,
              and coordinate larger handmade orders.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              'Assign work to artisans',
              'Share clear requirements',
              'Track order responses',
              'Get acceptance updates',
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
              <Building2 aria-hidden="true" className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-secondary">Industry partner account</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-text-main">
              {isSignup ? 'Create your industry account' : 'Welcome back'}
            </h2>
            <p className="mt-2 leading-6 text-text-secondary">
              {isSignup
                ? 'Set up your organization profile to assign production requests to artisans.'
                : 'Log in to manage your assigned orders and artisan responses.'}
            </p>

            <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <label className="block text-sm font-medium text-text-main">
                    Company or organization name
                    <input
                      autoComplete="organization"
                      className={inputClass}
                      maxLength={100}
                      name="companyName"
                      placeholder="Your organization"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-text-main">
                    Contact person
                    <input
                      autoComplete="name"
                      className={inputClass}
                      maxLength={100}
                      name="contactName"
                      placeholder="Your name"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-text-main">
                    Phone number
                    <input
                      autoComplete="tel"
                      className={inputClass}
                      name="phone"
                      placeholder="Your phone number"
                      required
                      type="tel"
                    />
                  </label>
                  <label className="block text-sm font-medium text-text-main">
                    Industry
                    <select className={inputClass} defaultValue="" name="industry" required>
                      <option disabled value="">Choose an industry</option>
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
              <label className="block text-sm font-medium text-text-main sm:col-span-2">
                Work email address
                <input
                  autoComplete="email"
                  className={inputClass}
                  name="email"
                  placeholder="you@organization.com"
                  required
                  type="email"
                />
              </label>
              {isSignup && (
                <label className="block text-sm font-medium text-text-main sm:col-span-2">
                  Organization location
                  <input
                    autoComplete="street-address"
                    className={inputClass}
                    maxLength={200}
                    name="companyAddress"
                    placeholder="City, state, or office address"
                    required
                  />
                </label>
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
                  className="rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error sm:col-span-2"
                  role="alert"
                >
                  {notice}
                </p>
              )}
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
                disabled={isSubmitting}
                type="submit"
              >
                {isSignup && <BellRing aria-hidden="true" className="h-4 w-4" />}
                {isSubmitting
                  ? 'Please wait…'
                  : isSignup
                    ? 'Create industry account'
                    : 'Log in to industry workspace'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
              {isSignup ? 'Already have an industry account?' : 'New to SkillBridge?'}{' '}
              <button
                className="font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setMode(isSignup ? 'login' : 'signup')
                  setNotice('')
                }}
                type="button"
              >
                {isSignup ? 'Log in' : 'Create an account'}
              </button>
            </p>
            <p className="mt-5 text-center text-xs leading-5 text-text-muted">
              Demo accounts and order updates are stored in this browser. In-app
              updates refresh while the industry workspace is open.
            </p>
          </div>
        </section>
      </main>
    </IndustryLayout>
  )
}

export default IndustryAuthPage
