import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  cancelCustomerOrderApi,
  getCustomerOrdersApi,
} from '../../services/marketplace-api'
import {
  createPaymentOrderApi,
  verifyPaymentApi,
  reportPaymentFailureApi,
} from '../../services/payment-api'
import { loadRazorpayScript } from '../../utils/razorpay'

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`

const STATUS_BADGES = {
  Completed: {
    bg: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  Shipped: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  'Ready to ship': {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  Processing: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  'Awaiting response': {
    bg: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  },
  Rejected: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
}

const OrderHistorySection = ({ user, compact = false }) => {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [payingId, setPayingId] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCustomerOrdersApi()
      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.warn('Customer orders fetch error:', err.message)
      setOrders([])
      setError('Could not load orders from the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [user])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order request?')) return
    setCancellingId(orderId)
    try {
      const data = await cancelCustomerOrderApi(orderId)
      if (data?.success) {
        await loadOrders()
      } else {
        alert(data?.message || 'Could not cancel order.')
      }
    } catch {
      alert('Failed to cancel order. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleRetryPayment = async (order) => {
    const orderId = order.id || order.orderNumber || order._id
    setPayingId(orderId)
    try {
      const isScriptLoaded = await loadRazorpayScript()
      if (!isScriptLoaded || typeof window.Razorpay === 'undefined') {
        alert('Could not load the Razorpay checkout interface. Please check your internet connection.')
        setPayingId(null)
        return
      }

      const response = await createPaymentOrderApi({ existingOrderId: orderId })
      if (!response?.success || !response.razorpayOrderId) {
        throw new Error(response?.message || 'Unable to initialize payment for this order.')
      }

      const { razorpayOrderId, amount, currency, keyId } = response
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'SkillBridge',
        description: `Order #${order.orderNumber || orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: order.shippingAddress?.fullName || user?.name || '',
          email: order.shippingAddress?.email || user?.email || '',
          contact: order.shippingAddress?.phone || user?.phone || '',
        },
        theme: {
          color: '#8B4513',
        },
        handler: async function (paymentResponse) {
          try {
            const verifyRes = await verifyPaymentApi({
              orderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            })
            if (verifyRes?.success) {
              await loadOrders()
            } else {
              alert(verifyRes?.message || 'Payment verification failed.')
            }
          } catch (err) {
            alert(err.message || 'Payment verification failed.')
          } finally {
            setPayingId(null)
          }
        },
        modal: {
          ondismiss: function () {
            reportPaymentFailureApi({
              orderId,
              razorpay_order_id: razorpayOrderId,
              error: { description: 'Payment modal closed by user.' },
            }).catch(() => {})
            setPayingId(null)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (failRes) {
        reportPaymentFailureApi({
          orderId,
          razorpay_order_id: razorpayOrderId,
          error: failRes.error,
        }).catch(() => {})
        alert(`Payment failed: ${failRes.error?.description || 'Transaction declined.'}`)
        setPayingId(null)
      })
      rzp.open()
    } catch (err) {
      alert(err.message || 'Unable to initiate payment.')
      setPayingId(null)
    }
  }

  const displayOrders = compact ? orders.slice(0, 3) : orders

  return (
    <section
      aria-labelledby="profile-orders-heading"
      className="mt-6 rounded-3xl border border-border/80 bg-surface p-5 sm:p-8 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
            <Package className="h-3.5 w-3.5" />
            <span>Patron Purchases</span>
          </div>
          <h2
            className="mt-1 font-serif text-2xl font-bold tracking-tight text-text-main"
            id="profile-orders-heading"
          >
            Order & Payment History
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {loading
              ? 'Loading your order records…'
              : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed with independent craftspeople`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            aria-label="Refresh orders"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
            disabled={loading}
            onClick={loadOrders}
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {compact && orders.length > 3 && (
            <Link
              className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              to="/marketplace/orders"
            >
              <span>View All ({orders.length})</span>
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-error/30 bg-red-50 p-4 text-xs font-medium text-error" role="alert">
          {error}
        </p>
      ) : !loading && displayOrders.length ? (
        <ul className="mt-6 space-y-4">
          {displayOrders.map((order) => {
            const orderId = order.id || order.orderNumber || order._id
            const status = order.status || order.orderStatus || 'Awaiting response'
            const total = order.totalAmount || order.total || 0
            const canCancel = ['Awaiting response', 'Processing'].includes(status)
            const isPaid = order.paymentStatus === 'paid'
            const badgeMeta = STATUS_BADGES[status] || {
              bg: 'bg-gray-50 text-gray-700 border-gray-200',
              dot: 'bg-gray-400',
            }

            return (
              <li
                className="overflow-hidden rounded-2xl border border-border/80 bg-background/50 p-5 shadow-xs transition-all hover:border-secondary/30"
                key={orderId}
              >
                {/* Header row */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border/60 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs font-bold text-text-main">
                        #{order.orderNumber || orderId}
                      </p>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[0.65rem] font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Paid via Razorpay</span>
                        </span>
                      ) : order.paymentStatus === 'failed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[0.65rem] font-bold text-error">
                          <XCircle className="h-3 w-3" />
                          <span>Payment Failed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.65rem] font-bold text-warning">
                          <Clock className="h-3 w-3" />
                          <span>Payment Pending</span>
                        </span>
                      )}
                    </div>
                    {order.razorpayPaymentId && (
                      <p className="mt-1 text-[0.68rem] text-text-muted">
                        Ref: <span className="font-mono text-text-secondary">{order.razorpayPaymentId}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <time
                      className="text-xs text-text-muted"
                      dateTime={order.createdAt}
                    >
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeMeta.bg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badgeMeta.dot}`} />
                      <span>{status}</span>
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <ul className="divide-y divide-border/60 py-2">
                  {(order.items || []).map((item, idx) => (
                    <li
                      className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center"
                      key={item.id || item.name || idx}
                    >
                      <div>
                        <p className="text-sm font-bold text-text-main">{item.name || item.title}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {item.category} · Maker: <span className="text-secondary font-medium">{item.artisanName || item.artisan || 'Artisan'}</span> · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-mono font-bold text-sm text-text-main">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                {/* Total & Action Footer */}
                <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-3.5 sm:flex-row sm:items-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-text-muted">Grand Total:</span>
                    <span className="font-mono text-base font-extrabold text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isPaid && status !== 'Rejected' && (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover px-4 py-2 text-xs font-bold text-white shadow-xs hover:shadow hover:brightness-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50 cursor-pointer"
                        disabled={payingId === orderId}
                        onClick={() => handleRetryPayment(order)}
                        type="button"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{payingId === orderId ? 'Opening Gateway…' : 'Pay via Razorpay'}</span>
                      </button>
                    )}
                    {canCancel && (
                      <button
                        className="inline-flex items-center gap-1 rounded-xl border border-error/30 bg-surface px-3 py-2 text-xs font-semibold text-error hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50 cursor-pointer"
                        disabled={cancellingId === orderId}
                        onClick={() => handleCancel(orderId)}
                        type="button"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>{cancellingId === orderId ? 'Cancelling…' : 'Cancel Order'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : !loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong bg-surface/50 px-4 py-12 text-center backdrop-blur-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <ShoppingBag aria-hidden="true" className="h-6 w-6 stroke-1" />
          </div>
          <p className="mt-3 font-serif text-lg font-bold text-text-main">No Orders Placed Yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-text-muted">
            Explore authentic handmade crafts from verified rural artisans and place your first fair-trade order.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            to="/marketplace"
          >
            Explore Marketplace Crafts
          </Link>
        </div>
      ) : null}
    </section>
  )
}

export default OrderHistorySection
