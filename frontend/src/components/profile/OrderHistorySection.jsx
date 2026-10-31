import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  CreditCard,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
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

const STATUS_COLORS = {
  Completed: 'bg-green-100 text-green-700',
  Shipped: 'bg-blue-100 text-blue-700',
  'Ready to ship': 'bg-indigo-100 text-indigo-700',
  Processing: 'bg-yellow-100 text-yellow-700',
  'Awaiting response': 'bg-gray-100 text-gray-600',
  Rejected: 'bg-red-100 text-red-600',
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
    if (!window.confirm('Cancel this order?')) return
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
              : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Refresh orders"
            className="rounded-lg border border-border p-2 text-text-secondary hover:border-border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            disabled={loading}
            onClick={loadOrders}
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!compact && (
            <Link
              className="text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              to="/marketplace/orders"
            >
              View full history
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-error/30 bg-red-50 p-3 text-sm text-error" role="alert">
          {error}
        </p>
      ) : !loading && displayOrders.length ? (
        <ul className="mt-5 space-y-4">
          {displayOrders.map((order) => {
            const orderId = order.id || order.orderNumber || order._id
            const status = order.status || order.orderStatus || 'Awaiting response'
            const total = order.totalAmount || order.total || 0
            const canCancel = ['Awaiting response', 'Processing'].includes(status)
            const isPaid = order.paymentStatus === 'paid'

            return (
              <li
                className="rounded-xl border border-border bg-background p-4 sm:p-5"
                key={orderId}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Order reference
                    </p>
                    <p className="mt-1 font-semibold text-text-main">{orderId}</p>
                    {order.razorpayPaymentId && (
                      <p className="mt-0.5 text-xs text-text-muted">
                        Payment: <span className="font-mono text-text-secondary">{order.razorpayPaymentId}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <time
                      className="text-sm text-text-secondary"
                      dateTime={order.createdAt}
                    >
                      {new Date(order.createdAt).toLocaleString()}
                    </time>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      <PackageCheck aria-hidden="true" className="h-4 w-4" />
                      {status}
                    </span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </span>
                    ) : order.paymentStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-error">
                        <XCircle className="h-3.5 w-3.5" />
                        Payment Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-warning">
                        <Clock className="h-3.5 w-3.5" />
                        Payment Pending
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-4 divide-y divide-border border-t border-border">
                  {(order.items || []).map((item, idx) => (
                    <li
                      className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center"
                      key={item.id || item.name || idx}
                    >
                      <div>
                        <p className="font-medium text-text-main">{item.name || item.title}</p>
                        <p className="mt-1 text-sm text-text-muted">
                          {item.category} · By {item.artisanName || item.artisan || 'Artisan'} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-text-main">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold text-text-main">Total</span>
                  <span className="text-sm font-bold text-text-main">{formatPrice(total)}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {!isPaid && status !== 'Rejected' && (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"
                      disabled={payingId === orderId}
                      onClick={() => handleRetryPayment(order)}
                      type="button"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {payingId === orderId ? 'Opening gateway…' : 'Pay Now'}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-1.5 text-xs font-semibold text-error hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50"
                      disabled={cancellingId === orderId}
                      onClick={() => handleCancel(orderId)}
                      type="button"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {cancellingId === orderId ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : !loading ? (
        <div className="mt-5 rounded-xl border border-dashed border-border-strong px-4 py-8 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto h-7 w-7 text-secondary" />
          <p className="mt-3 font-medium text-text-main">No orders yet</p>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            Browse handmade crafts and place your first order.
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
          View all {orders.length} orders
        </Link>
      )}
    </section>
  )
}

export default OrderHistorySection
