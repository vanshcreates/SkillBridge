import { ArrowLeft, PackageCheck } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import OrderHistorySection from '../components/profile/OrderHistorySection'
import { useAuthDialog } from '../hooks/useAuthDialog'

const OrderHistory = () => {
  const { currentUser } = useAuthDialog()

  if (currentUser && currentUser.accountType !== 'customer') {
    if (currentUser.accountType === 'artisan') return <Navigate replace to="/artisan/profile" />
    if (currentUser.accountType === 'expert') return <Navigate replace to="/expert/dashboard" />
    if (currentUser.accountType === 'industry') return <Navigate replace to="/industry/dashboard" />
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
        <header className="mt-6 border-b border-border/70 pb-5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
            <PackageCheck className="h-3.5 w-3.5" />
            <span>Order Records</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
            Customer Order History
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            Track status, review artisan assignments, and settle pending payments securely via Razorpay.
          </p>
        </header>

        <OrderHistorySection user={currentUser} />
      </main>
    </MarketplaceLayout>
  )
}

export default OrderHistory
