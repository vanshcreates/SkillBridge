import { ArrowLeft, LogOut, MapPin, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import OrderHistorySection from '../components/profile/OrderHistorySection'
import SavedAddressesSection from '../components/profile/SavedAddressesSection'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { useCart } from '../hooks/useCart'

const formatRole = (role) => {
  if (!role) return 'Community member'
  return role.replace(/(^\w|[-_]\w)/g, (match) =>
    match.replace(/[-_]/, ' ').toUpperCase(),
  )
}

const ProfilePage = () => {
  const { currentUser, openAuth, logout } = useAuthDialog()
  const { itemCount } = useCart()

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
            Log in with a demo profile email or create a profile on this device.
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

  const location = [currentUser.city, currentUser.state].filter(Boolean).join(', ')

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

        <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
          <div className="h-32 bg-primary sm:h-44" />
          <div className="px-5 pb-7 sm:px-9 sm:pb-9">
            <div className="-mt-12 flex flex-col justify-between gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-surface-muted text-primary sm:h-28 sm:w-28">
                <UserRound aria-hidden="true" className="h-12 w-12 sm:h-14 sm:w-14" />
              </div>
              <button
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                onClick={logout}
                type="button"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Log out
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-secondary">
                {formatRole(currentUser.accountType)}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-text-main sm:text-4xl">
                {currentUser.name}
              </h1>
              <p className="mt-2 text-text-secondary">{currentUser.email}</p>
              {location && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-muted">
                  <MapPin aria-hidden="true" className="h-4 w-4 text-secondary" />
                  {location}
                </p>
              )}
              {currentUser.bio && (
                <p className="mt-5 max-w-2xl leading-7 text-text-secondary">
                  {currentUser.bio}
                </p>
              )}
              {currentUser.createdAt && (
                <p className="mt-5 text-xs text-text-muted">
                  Profile created{' '}
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
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

        <OrderHistorySection user={currentUser} compact />

        <SavedAddressesSection user={currentUser} />

        <p className="mt-6 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm leading-6 text-text-muted">
          Demo profile: account details are stored only in this browser. This
          app does not provide secure authentication or cloud account syncing.
          Saved delivery addresses are also stored locally on this device.
        </p>
      </main>
    </MarketplaceLayout>
  )
}

export default ProfilePage
