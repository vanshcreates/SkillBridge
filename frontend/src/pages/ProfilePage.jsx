import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, Edit2, LogOut, MapPin, Save, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import OrderHistorySection from '../components/profile/OrderHistorySection'
import ProfileImageControl from '../components/profile/ProfileImageControl'
import SavedAddressesSection from '../components/profile/SavedAddressesSection'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { useCart } from '../hooks/useCart'
import { getCustomerProfileApi, updateCustomerProfileApi } from '../services/marketplace-api'

const formatRole = (role) => {
  if (!role) return 'Community member'
  return role.replace(/(^\w|[-_]\w)/g, (match) =>
    match.replace(/[-_]/, ' ').toUpperCase(),
  )
}

const fieldClass =
  'mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-main outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25'

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
        <main className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-secondary">
            <UserRound aria-hidden="true" className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold text-text-main">
            Sign in to view your profile
          </h1>
          <p className="mt-3 leading-7 text-text-secondary">
            Log in or create an account to access your profile, orders, and saved addresses.
          </p>
          <button
            className="mt-7 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            onClick={() => openAuth('login')}
            type="button"
          >
            Log in
          </button>
          <button
            className="ml-3 mt-7 rounded-lg border border-border-strong px-5 py-3 font-semibold text-primary transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => openAuth('signup')}
            type="button"
          >
            Create profile
          </button>
        </main>
      </MarketplaceLayout>
    )
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to marketplace
        </Link>

        {/* Profile card */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
          <div className="h-32 bg-primary sm:h-44" />
          <div className="px-5 pb-7 sm:px-9 sm:pb-9">
            <div className="-mt-12 flex flex-col justify-between gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <ProfileImageControl
                className="h-24 w-24 border-4 border-surface text-3xl sm:h-28 sm:w-28"
                size="large"
                user={displayUser}
              />
              <div className="flex flex-wrap gap-2">
                {!editing && (
                  <button
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    onClick={() => setEditing(true)}
                    type="button"
                  >
                    <Edit2 aria-hidden="true" className="h-4 w-4" />
                    Edit profile
                  </button>
                )}
                <button
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  onClick={logout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully.
              </div>
            )}
            {profileLoadError && (
              <p
                className="mt-4 rounded-lg border border-warning/30 bg-amber-50 px-4 py-3 text-sm text-warning"
                role="status"
              >
                {profileLoadError}
              </p>
            )}

            {editing ? (
              <form className="mt-5" onSubmit={handleEditSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-text-main">
                    Full name
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.name || ''}
                      name="name"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    Phone
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.phone || ''}
                      name="phone"
                      type="tel"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    City
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.city || ''}
                      name="city"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    State
                    <input
                      className={fieldClass}
                      defaultValue={displayUser?.state || ''}
                      name="state"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    Bio
                    <textarea
                      className={fieldClass}
                      defaultValue={displayUser?.bio || ''}
                      name="bio"
                      rows="3"
                    />
                  </label>
                </div>
                {editError && (
                  <p className="mt-3 text-sm text-error" role="alert">{editError}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-60"
                    disabled={saving}
                    type="submit"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    onClick={() => { setEditing(false); setEditError('') }}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-secondary">
                  {formatRole(displayUser?.accountType)}
                </p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-text-main sm:text-4xl">
                  {displayUser?.name}
                </h1>
                <p className="mt-2 text-text-secondary">{displayUser?.email}</p>
                {location && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-muted">
                    <MapPin aria-hidden="true" className="h-4 w-4 text-secondary" />
                    {location}
                  </p>
                )}
                {displayUser?.bio && (
                  <p className="mt-5 max-w-2xl leading-7 text-text-secondary">
                    {displayUser.bio}
                  </p>
                )}
                {displayUser?.createdAt && (
                  <p className="mt-5 text-xs text-text-muted">
                    Member since {new Date(displayUser.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Stats bar */}
        {stats && (
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total orders', value: stats.totalOrders ?? 0 },
              { label: 'Active orders', value: stats.activeOrders ?? 0 },
              { label: 'Wishlist items', value: stats.wishlistCount ?? 0 },
              { label: 'Saved addresses', value: stats.addressCount ?? 0 },
            ].map(({ label, value }) => (
              <div
                className="rounded-2xl border border-border bg-surface p-4 text-center"
                key={label}
              >
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="mt-1 text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </section>
        )}

        {/* Quick links */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            className="rounded-2xl border border-border bg-surface p-5 transition hover:border-border-strong hover:shadow-card"
            to="/marketplace"
          >
            <h2 className="font-serif text-lg font-semibold text-text-main">
              Explore handmade crafts
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Discover thoughtful products and the people who make them.
            </p>
          </Link>
          <Link
            className="rounded-2xl border border-border bg-surface p-5 transition hover:border-border-strong hover:shadow-card"
            to="/marketplace/order-summary"
          >
            <h2 className="font-serif text-lg font-semibold text-text-main">
              Your bag ({itemCount})
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Review saved items and continue to the order summary.
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
