import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Edit2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  ShoppingBag,
  Sparkles,
  User,
  UserRound,
  X,
} from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { getAccountHomePath } from '../utils/account-routing'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import OrderHistorySection from '../components/profile/OrderHistorySection'
import ProfileImageControl from '../components/profile/ProfileImageControl'
import SavedAddressesSection from '../components/profile/SavedAddressesSection'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { useCart } from '../hooks/useCart'
import { getCustomerProfileApi, updateCustomerProfileApi } from '../services/marketplace-api'

const formatRole = (role) => {
  if (!role) return 'Customer'
  return role.replace(/(^\w|[-_]\w)/g, (match) =>
    match.replace(/[-_]/, ' ').toUpperCase(),
  )
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-main outline-none focus:border-secondary focus:ring-3 focus:ring-secondary/15 transition-all'

const ProfilePage = () => {
  const { currentUser, openAuth, logout, setCurrentUser } = useAuthDialog()
  const { itemCount } = useCart()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileLoadError, setProfileLoadError] = useState('')

  // Load profile from backend on mount
  useEffect(() => {
    if (!currentUser) return
    getCustomerProfileApi()
      .then((data) => {
        if (data?.success && data.profile) {
          setProfile(data.profile)
          setStats(data.profile.stats || null)
          setProfileLoadError('')
          return
        }
        throw new Error(data?.message || 'The customer profile could not be loaded.')
      })
      .catch((error) => {
        setProfile(currentUser)
        setProfileLoadError(
          `${error.message || 'The customer profile could not be loaded.'} Showing your saved sign-in profile instead.`,
        )
      })
  }, [currentUser])

  const displayUser = profile || currentUser

  if (!currentUser) {
    return (
      <MarketplaceLayout>
        <main className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <UserRound aria-hidden="true" className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold text-text-main">
            Sign In to View Your Profile
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Log in or create a customer account to access your orders, track artisan fulfillment, and manage saved delivery addresses.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={() => openAuth('login')}
              type="button"
            >
              Sign In
            </button>
            <button
              className="rounded-xl border border-border-strong px-6 py-3 font-semibold text-primary transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => openAuth('signup')}
              type="button"
            >
              Create Customer Profile
            </button>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-main"
              to="/"
            >
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
          </div>
        </main>
      </MarketplaceLayout>
    )
  }

  if (currentUser.accountType !== 'customer') {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }

  const location = [displayUser?.city, displayUser?.state].filter(Boolean).join(', ')

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    setSaveSuccess(false)
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData.entries())
    try {
      const data = await updateCustomerProfileApi(values)
      if (data?.success) {
        const updated = data.profile || { ...displayUser, ...values }
        setProfile(updated)
        // Update auth context so header shows new name
        if (setCurrentUser) setCurrentUser(updated)
        setSaveSuccess(true)
        setEditing(false)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setEditError(data?.message || 'Failed to update profile.')
      }
    } catch (error) {
      setEditError(
        error.message || 'Unable to save profile changes. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Back to Marketplace</span>
        </Link>

        {/* Profile Card */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-card">
          <div className="h-36 bg-gradient-to-r from-primary via-primary-hover to-[#5a2e16] sm:h-44 relative">
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>SkillBridge Patron</span>
            </div>
          </div>
          <div className="px-5 pb-7 sm:px-9 sm:pb-9">
            <div className="-mt-14 flex flex-col justify-between gap-4 sm:-mt-16 sm:flex-row sm:items-end">
              <div className="relative">
                <ProfileImageControl
                  className="h-24 w-24 rounded-2xl border-4 border-surface shadow-lg text-3xl sm:h-28 sm:w-28"
                  size="large"
                  user={displayUser}
                />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {!editing && (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2 text-xs font-bold text-primary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    onClick={() => setEditing(true)}
                    type="button"
                  >
                    <Edit2 aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2 text-xs font-bold text-text-secondary transition hover:border-error/40 hover:bg-red-50 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  onClick={logout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-xs font-semibold text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>Profile details updated successfully.</span>
              </div>
            )}
            {profileLoadError && (
              <p
                className="mt-4 rounded-xl border border-warning/30 bg-amber-50 px-4 py-3 text-xs text-warning"
                role="status"
              >
                {profileLoadError}
              </p>
            )}

            {editing ? (
              <form className="mt-6" onSubmit={handleEditSubmit}>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="text-xs font-bold text-text-main">
                    Full Name
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.name || ''}
                      name="name"
                      required
                    />
                  </label>
                  <label className="text-xs font-bold text-text-main">
                    Phone Number
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.phone || ''}
                      name="phone"
                      type="tel"
                    />
                  </label>
                  <label className="text-xs font-bold text-text-main">
                    City
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.city || ''}
                      name="city"
                    />
                  </label>
                  <label className="text-xs font-bold text-text-main">
                    State
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.state || ''}
                      name="state"
                    />
                  </label>
                  <label className="text-xs font-bold text-text-main sm:col-span-2">
                    Bio / About You
                    <textarea
                      className={fieldClass}
                      defaultValue={displayUser?.bio || ''}
                      name="bio"
                      rows="3"
                    />
                  </label>
                </div>
                {editError && (
                  <p className="mt-3 text-xs font-medium text-error" role="alert">{editError}</p>
                )}
                <div className="mt-5 flex gap-2.5">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-60"
                    disabled={saving}
                    type="submit"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'Saving Changes…' : 'Save Profile'}</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-text-secondary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    onClick={() => { setEditing(false); setEditError('') }}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">
                  {formatRole(displayUser?.accountType)}
                </span>
                <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                  {displayUser?.name}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                  <span>{displayUser?.email}</span>
                </p>
                {location && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-secondary" />
                    <span>{location}</span>
                  </p>
                )}
                {displayUser?.bio && (
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
                    {displayUser.bio}
                  </p>
                )}
                {displayUser?.createdAt && (
                  <p className="mt-4 text-[0.72rem] text-text-muted">
                    Member since {new Date(displayUser.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Stats bar */}
        {stats && (
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Orders', value: stats.totalOrders ?? 0, icon: Package },
              { label: 'Active Orders', value: stats.activeOrders ?? 0, icon: ShoppingBag },
              { label: 'Wishlist Finds', value: stats.wishlistCount ?? 0, icon: Sparkles },
              { label: 'Saved Addresses', value: stats.addressCount ?? 0, icon: MapPin },
            ].map(({ label, value, icon: Icon }) => (
              <div
                className="rounded-2xl border border-border/80 bg-surface p-4 text-center shadow-xs transition-all hover:border-secondary/30"
                key={label}
              >
                <Icon className="mx-auto h-4 w-4 text-secondary mb-1 opacity-70" />
                <p className="text-2xl font-extrabold text-primary">{value}</p>
                <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
              </div>
            ))}
          </section>
        )}

        {/* Quick Links */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            className="group rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:border-secondary/40 hover:shadow-card"
            to="/marketplace"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                Explore Handmade Crafts
              </h2>
              <ArrowLeft className="h-4 w-4 rotate-180 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
              Discover verified traditional crafts and support local makers directly.
            </p>
          </Link>
          <Link
            className="group rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:border-secondary/40 hover:shadow-card"
            to="/marketplace/order-summary"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                Your Shopping Bag ({itemCount})
              </h2>
              <ArrowLeft className="h-4 w-4 rotate-180 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
              Review saved artisan pieces and proceed with fast Razorpay checkout.
            </p>
          </Link>
        </section>

        <OrderHistorySection user={displayUser} compact />

        <SavedAddressesSection user={displayUser} />
      </main>
    </MarketplaceLayout>
  )
}

export default ProfilePage
