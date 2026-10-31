import { useEffect, useState } from 'react'
import { PackageCheck, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getOrderHistory } from '../../utils/order-storage'

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`

const OrderHistorySection = ({ user, compact = false }) => {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    try {
      setOrders(getOrderHistory(user))
      setError('')
    } catch (loadError) {
      console.error('Unable to load order history.', loadError)
      setOrders([])
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  return (
    <section
      aria-labelledby="profile-orders-heading"
      className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-secondary">Your purchases</p>
          <h2
            className="mt-1 font-serif text-xl font-semibold text-text-main"
            id="profile-orders-heading"
          >
            Order history
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {loading
              ? 'Loading your orders…'
              : `${orders.length} ${orders.length === 1 ? 'order request' : 'order requests'}`}
          </p>
        </div>
        {!compact && (
          <Link
            className="text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            to="/marketplace/orders"
          >
            View full history
          </Link>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-error/30 bg-red-50 p-3 text-sm text-error" role="alert">
          {error}
        </p>
      ) : !loading && orders.length ? (
        <ul className="mt-5 space-y-4">
          {(compact ? orders.slice(0, 3) : orders).map((order) => (
            <li
              className="rounded-xl border border-border bg-background p-4 sm:p-5"
              key={order.id}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Order reference
                  </p>
                  <p className="mt-1 font-semibold text-text-main">{order.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <time
                    className="text-sm text-text-secondary"
                    dateTime={order.createdAt}
                  >
                    {new Date(order.createdAt).toLocaleString()}
                  </time>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-secondary">
                    <PackageCheck aria-hidden="true" className="h-4 w-4" />
                    {order.status}
                  </span>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-border border-t border-border">
                {order.items.map((item) => (
                  <li
                    className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center"
                    key={item.name}
                  >
                    <div>
                      <p className="font-medium text-text-main">{item.name}</p>
                      <p className="mt-1 text-sm text-text-muted">
                        {item.category} · By {item.artisan} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-text-main">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold text-text-main">
                <span>Estimated total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : !loading ? (
        <div className="mt-5 rounded-xl border border-dashed border-border-strong px-4 py-8 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto h-7 w-7 text-secondary" />
          <p className="mt-3 font-medium text-text-main">No order requests yet</p>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            Submit a marketplace order with this profile’s email to see it here.
          </p>
          <Link
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            to="/marketplace"
          >
            Browse crafts
          </Link>
        </div>
      ) : null}

      {!loading && compact && orders.length > 3 && (
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/marketplace/orders"
        >
          View all {orders.length} order requests
        </Link>
      )}
    </section>
  )
}

export default OrderHistorySection
