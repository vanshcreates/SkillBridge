import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  Printer,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`

const OrderConfirmation = () => {
  const location = useLocation()
  const order = location.state?.order
  const paymentSuccess =
    location.state?.paymentSuccess || order?.paymentStatus === 'paid'
  const paymentId = location.state?.paymentId || order?.razorpayPaymentId
  const [copied, setCopied] = useState(false)

  // Trigger celebration confetti on mount if paid
  useEffect(() => {
    if (paymentSuccess) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4A0010', '#A9572E', '#E5B25D', '#1E7D48', '#FFD700'],
        })
      } catch (e) {
        console.warn('Confetti note:', e)
      }
    }
  }, [paymentSuccess])

  const handleCopyPaymentId = () => {
    if (!paymentId) return
    navigator.clipboard.writeText(paymentId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {order ? (
          <section className="overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-2xl transition-all">
            {/* Header Stage */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary px-6 py-10 text-center text-white sm:px-10">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-secondary/30 blur-2xl" />

              <div className="relative z-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md shadow-inner border border-white/20">
                  <Check aria-hidden="true" className="h-8 w-8 text-accent-light" />
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-accent-light backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {paymentSuccess ? 'Order Confirmed & Payment Verified' : 'Order Request Stored'}
                  </span>
                </div>
                <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl text-white">
                  Thank you, {order.customer?.fullName || 'Craft Enthusiast'}!
                </h1>
                <p className="mx-auto mt-2.5 max-w-lg text-sm text-white/85 leading-relaxed">
                  {paymentSuccess
                    ? 'Your test payment via Razorpay has been verified and settled. The master artisan has been notified to begin handcrafting.'
                    : 'Your order request has been saved. The artisan will review it shortly.'}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-10 space-y-8">
              {/* Order Reference & Payment ID Bar */}
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-background/60 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Order Reference Number
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-text-main">
                    {order.orderNumber || order.id || order._id}
                  </p>
                  {paymentId && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-text-muted">Razorpay ID:</span>
                      <span className="font-mono text-xs font-semibold text-secondary">
                        {paymentId}
                      </span>
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-text-secondary hover:bg-surface-muted hover:text-text-main"
                        onClick={handleCopyPaymentId}
                        title="Copy payment ID"
                        type="button"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {paymentSuccess ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-green-50 px-3.5 py-1.5 text-xs font-bold text-success shadow-xs">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Paid via Razorpay (Test)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-secondary">
                    <ClipboardList aria-hidden="true" className="h-4 w-4" />
                    Payment Pending
                  </span>
                )}
              </div>

              {/* Order Fulfillment Stepper */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Order Progression
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-xs">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-text-main">Order Placed</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-xs">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-text-main">Payment Settled</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary font-bold shadow-xs">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-text-main">Artisan Crafting</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-muted text-text-muted">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-text-muted">Dispatched</span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h2 className="font-serif text-xl font-bold text-text-main">
                  Handcrafted Items
                </h2>
                <ul className="mt-4 divide-y divide-border/80 rounded-2xl border border-border/80 bg-background/50 p-4">
                  {(order.items || []).map((item) => (
                    <li
                      className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1"
                      key={item.name || item.title || item.id}
                    >
                      <div>
                        <p className="font-semibold text-text-main text-sm">
                          {item.name || item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          Qty {item.quantity} · Crafted by {item.artisanName || item.artisan || 'Master Artisan'}
                        </p>
                      </div>
                      <p className="shrink-0 font-serif font-bold text-text-main">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delivery Address */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-background/60 p-4 text-sm">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <div className="leading-6 text-text-secondary text-xs sm:text-sm">
                  <p className="font-bold text-text-main">Delivery Address</p>
                  <p className="mt-0.5">
                    {order.customer?.address || order.shippingAddress?.address},{' '}
                    {order.customer?.city || order.shippingAddress?.city},{' '}
                    {order.customer?.state || order.shippingAddress?.state}{' '}
                    {order.customer?.postalCode || order.shippingAddress?.postalCode}
                  </p>
                  {order.shippingAddress?.phone && (
                    <p className="text-text-muted mt-0.5">Contact: {order.shippingAddress.phone}</p>
                  )}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="space-y-2.5 rounded-2xl border border-border/80 bg-surface p-5 text-sm">
                <div className="flex justify-between text-text-secondary text-xs sm:text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-text-secondary text-xs sm:text-sm">
                  <span>Shipping & Delivery</span>
                  <span className="text-success font-medium">
                    {order.shipping ? formatPrice(order.shipping) : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-3 text-base font-bold text-text-main">
                  <span>Total Amount Paid</span>
                  <span className="font-serif text-xl font-bold text-primary">
                    {formatPrice(order.total ?? order.totalAmount ?? 0)}
                  </span>
                </div>
              </div>

              {/* Razorpay Trust Strip */}
              <div className="rounded-xl border border-secondary/25 bg-secondary/5 p-4 text-xs leading-relaxed text-text-secondary flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-text-main">
                    Secure Payment Processed via Razorpay Test Mode
                  </p>
                  <p className="mt-0.5 text-text-muted">
                    This order was processed securely using Razorpay in Test Mode. The artisan has received the order specifications and compensation settlement has been initialized.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-text-main shadow-xs transition hover:bg-surface-muted hover:border-border-strong print:hidden"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                <Link
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  to="/marketplace"
                >
                  <PackageCheck aria-hidden="true" className="h-4 w-4" />
                  <span>Explore More Crafts</span>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-surface px-6 py-20 text-center shadow-card">
            <Package className="mx-auto h-12 w-12 text-secondary/60" />
            <h1 className="mt-4 font-serif text-3xl font-bold text-text-main">
              No recent order found
            </h1>
            <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
              Add handmade crafts to your bag and complete checkout to review your confirmed order details.
            </p>
            <Link
              className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-sm"
              to="/marketplace"
            >
              Browse Marketplace
            </Link>
          </section>
        )}
      </main>
    </MarketplaceLayout>
  )
}

export default OrderConfirmation
