import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import OrderHistorySection from '../components/profile/OrderHistorySection'
import { useAuthDialog } from '../hooks/useAuthDialog'

const OrderHistory = () => {
  const { currentUser } = useAuthDialog()

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
        <header className="mt-6">
          <p className="text-sm font-semibold text-secondary">Your purchases</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-text-main sm:text-4xl">
            Order history
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Review order requests made from this browser.
          </p>
        </header>
        <OrderHistorySection user={currentUser} />
        <p className="mt-6 rounded-xl border border-border bg-surface-muted px-4 py-3 text-xs leading-5 text-text-muted">
          Demo history is local to this browser and is not a confirmed order
          status. No payment is collected and requests are not sent to artisans.
        </p>
      </main>
    </MarketplaceLayout>
  )
}

export default OrderHistory
