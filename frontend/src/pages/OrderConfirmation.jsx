import { Check, ClipboardList, MapPin, PackageCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import { useCart } from '../hooks/useCart'

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`

const OrderConfirmation = () => {
  const location = useLocation()
  const { latestOrder } = useCart()
  const order = location.state?.order ?? latestOrder

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        {order ? (
          <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
            <div className="bg-primary px-6 py-9 text-center text-white sm:px-10">
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                <Check aria-hidden="true" className="h-7 w-7" />
              </span>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
                Request saved
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                Thank you, {order.customer.fullName}
              </h1>
              <p className="mt-3 text-sm text-white/80">
                Your demo order request has been created for this session.
              </p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-text-muted">Request reference</p>
                  <p className="mt-1 font-semibold text-text-main">{order.id}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-secondary">
                  <ClipboardList aria-hidden="true" className="h-4 w-4" />
                  Demo request · no payment taken
                </span>
              </div>

              <div className="mt-6">
                <h2 className="font-serif text-xl font-semibold text-text-main">
                  Order items
                </h2>
                <ul className="mt-4 divide-y divide-border">
                  {order.items.map((item) => (
                    <li
                      className="flex items-center justify-between gap-4 py-3"
                      key={item.name}
                    >
                      <div>
                        <p className="font-medium text-text-main">{item.name}</p>
                        <p className="mt-1 text-sm text-text-muted">
                          Qty {item.quantity} · {item.artisan}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-text-main">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-background p-4">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <div className="text-sm leading-6 text-text-secondary">
                  <p className="font-semibold text-text-main">Delivery address</p>
                  <p>
                    {order.customer.address}, {order.customer.city},{' '}
                    {order.customer.state} {order.customer.postalCode}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Delivery</span>
                  <span>{order.shipping ? formatPrice(order.shipping) : 'Free'}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold text-text-main">
                  <span>Estimated total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              <p className="mt-6 rounded-lg border border-border bg-background p-4 text-sm leading-6 text-text-muted">
                This is a front-end demo. The request and delivery details are
                saved in this browser and can be reviewed by the matching
                artisan profile on this device. No remote notification or
                payment is sent. Connect an order backend and payment provider
                to accept real orders.
              </p>

              <Link
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                to="/marketplace"
              >
                <PackageCheck aria-hidden="true" className="h-5 w-5" />
                Continue exploring crafts
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <h1 className="font-serif text-2xl font-semibold text-text-main">
              No recent order request
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Add products to your bag and submit an order request to see the summary.
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
              to="/marketplace"
            >
              Browse marketplace
            </Link>
          </section>
        )}
      </main>
    </MarketplaceLayout>
  )
}

export default OrderConfirmation
