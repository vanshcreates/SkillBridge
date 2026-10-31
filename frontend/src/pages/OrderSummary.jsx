import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CreditCard,
  ImageOff,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { useCart } from '../hooks/useCart'
import {
  getCustomerAddressesApi,
  addCustomerAddressApi,
} from '../services/marketplace-api'
import {
  createPaymentOrderApi,
  verifyPaymentApi,
  reportPaymentFailureApi,
} from '../services/payment-api'
import { loadRazorpayScript } from '../utils/razorpay'

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`
const fieldClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const OrderSummary = () => {
  const navigate = useNavigate()
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()
  const { currentUser, openAuth } = useAuthDialog()
  const [savedAddress, setSavedAddress] = useState(null)
  const [addressLoadComplete, setAddressLoadComplete] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const shipping = subtotal === 0 || subtotal >= 1500 ? 0 : 99
  const isCustomer =
    currentUser && (currentUser.accountType ?? 'customer') === 'customer'

  useEffect(() => {
    let isMounted = true
    setAddressLoadComplete(false)
    if (!isCustomer) {
      setSavedAddress(null)
      setAddressLoadComplete(true)
      return () => {
        isMounted = false
      }
    }

    const loadAddress = async () => {
      try {
        const response = await getCustomerAddressesApi()
        if (response?.success && Array.isArray(response.addresses)) {
          if (isMounted) {
            setSavedAddress(
              response.addresses.find((address) => address.isDefault) ||
                response.addresses[0] ||
                null,
            )
            setFormError('')
          }
        }
      } catch (error) {
        console.warn(
          'Unable to load customer addresses from backend:',
          error.message,
        )
      } finally {
        if (isMounted) setAddressLoadComplete(true)
      }
    }

    loadAddress()
    return () => {
      isMounted = false
    }
  }, [currentUser, isCustomer])

  if (currentUser && currentUser.accountType !== 'customer') {
    if (currentUser.accountType === 'artisan') return <Navigate replace to="/artisan/profile" />
    if (currentUser.accountType === 'expert') return <Navigate replace to="/expert/dashboard" />
    if (currentUser.accountType === 'industry') return <Navigate replace to="/industry/dashboard" />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isCustomer) {
      openAuth('login')
      setFormError('Log in with a customer account before placing an order.')
      return
    }
    setFormError('')
    const formData = new FormData(event.currentTarget)
    const customer = Object.fromEntries(formData.entries())
    setIsSubmitting(true)

    try {
      const databaseProductIdPattern = /^[0-9a-f]{24}$/i
      const hasDatabaseProducts = items.every((item) =>
        databaseProductIdPattern.test(item.id || item._id || ''),
      )
      if (!hasDatabaseProducts) {
        throw new Error(
          'Sample listings cannot be ordered. Remove them from your bag and choose published marketplace products.',
        )
      }

      // 1. Ensure Razorpay Checkout SDK is dynamically loaded
      const isScriptLoaded = await loadRazorpayScript()
      if (!isScriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error(
          'Could not load the Razorpay checkout interface. Please check your internet connection.',
        )
      }

      // 2. Initialize payment order on backend (calculates amounts from database)
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.id || item._id,
          quantity: item.quantity,
        })),
        shippingAddress: customer,
        note: customer.note,
      }

      const response = await createPaymentOrderApi(orderPayload)
      if (!response?.success || !response.razorpayOrderId) {
        throw new Error(response?.message || 'Unable to initialize payment order.')
      }

      const {
        razorpayOrderId,
        amount,
        currency,
        keyId,
        orderId,
        orderNumber,
      } = response

      // 3. Configure and trigger Razorpay Checkout popup in Test Mode
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'SkillBridge',
        description: `Order #${orderNumber || orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: customer.fullName || currentUser?.name || '',
          email: customer.email || currentUser?.email || '',
          contact: customer.phone || currentUser?.phone || '',
        },
        notes: {
          orderId,
          orderNumber,
        },
        theme: {
          color: '#8B4513',
        },
        handler: async function (paymentResponse) {
          try {
            setIsSubmitting(true)
            // 4. Verify payment signature on backend using HMAC SHA256
            const verifyResponse = await verifyPaymentApi({
              orderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            })

            if (verifyResponse?.success && verifyResponse.order) {
              // Persist address to profile for future convenience
              addCustomerAddressApi(customer).catch(() => {})
              clearCart()
              navigate('/marketplace/order-confirmation', {
                state: {
                  order: {
                    ...verifyResponse.order,
                    customer: verifyResponse.order.customer || customer,
                    total:
                      verifyResponse.order.total ??
                      verifyResponse.order.totalAmount,
                  },
                  paymentSuccess: true,
                  paymentId: paymentResponse.razorpay_payment_id,
                },
              })
            } else {
              setFormError(
                verifyResponse?.message ||
                  'Payment was received, but server verification failed. Please contact support.',
              )
              setIsSubmitting(false)
            }
          } catch (err) {
            console.error('Payment verification error:', err)
            setFormError(
              err.message ||
                'Payment verification failed. Please check your order history.',
            )
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: function () {
            reportPaymentFailureApi({
              orderId,
              razorpay_order_id: razorpayOrderId,
              error: { description: 'Payment modal closed by user.' },
            }).catch(() => {})
            setFormError(
              'Payment was cancelled. You can retry whenever you are ready.',
            )
            setIsSubmitting(false)
          },
        },
      }

      const razorpayInstance = new window.Razorpay(options)

      razorpayInstance.on('payment.failed', function (failureData) {
        reportPaymentFailureApi({
          orderId,
          razorpay_order_id: razorpayOrderId,
          error: failureData.error,
        }).catch(() => {})
        setFormError(
          `Payment failed: ${failureData.error?.description || failureData.error?.reason || 'Transaction was declined.'}`,
        )
        setIsSubmitting(false)
      })

      razorpayInstance.open()
    } catch (error) {
      console.error('Checkout error:', error)
      setFormError(error.message)
      setIsSubmitting(false)
    }
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Continue shopping
        </Link>
        <header className="mt-6">
          <p className="text-sm font-semibold text-secondary">Your bag</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-text-main sm:text-4xl">
            Order summary
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · review your order and delivery details
          </p>
        </header>

        {!isCustomer && currentUser ? (
          <section className="mt-8 rounded-2xl border border-border bg-surface px-5 py-10 text-center shadow-card sm:px-8">
            <ShoppingBag aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-text-main">
              Your bag is for customer accounts
            </h2>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-text-secondary">
              You’re signed in as {currentUser.accountType || 'a community member'}.
              Log out of this account before signing in as a customer.
            </p>
          </section>
        ) : !isCustomer ? (
          <section className="mt-8 rounded-2xl border border-border bg-surface px-5 py-10 text-center shadow-card sm:px-8">
            <ShoppingBag aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-text-main">
              Log in to view your bag
            </h2>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-text-secondary">
              Sign in with a customer account to manage your bag and place your order.
            </p>
            <button
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={() => openAuth('login')}
              type="button"
            >
              Log in or create an account
            </button>
          </section>
        ) : items.length ? (
          <form
            key={addressLoadComplete ? 'address-loaded' : 'address-loading'}
            className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]"
            onSubmit={handleSubmit}
          >
            <div className="space-y-7">
              <section
                aria-labelledby="bag-items-heading"
                className="rounded-2xl border border-border bg-surface p-5 sm:p-7"
              >
                <h2
                  className="font-serif text-xl font-semibold text-text-main"
                  id="bag-items-heading"
                >
                  Items in your bag
                </h2>
                <ul className="mt-5 divide-y divide-border">
                  {items.map((item) => (
                    <li
                      className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row"
                      key={item.name}
                    >
                      {item.image ? (
                        <img
                          alt={item.imageAlt}
                          className="h-28 w-full rounded-xl object-cover sm:w-32"
                          src={item.image}
                        />
                      ) : (
                        <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted sm:w-32">
                          <ImageOff aria-hidden="true" className="h-7 w-7" />
                          <span className="sr-only">No product photo available</span>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                            {item.category}
                          </p>
                          <h3 className="mt-1 font-serif text-lg font-semibold text-text-main">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-text-muted">
                            By {item.artisan}
                          </p>
                          <p className="mt-2 font-semibold text-primary">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:self-start">
                          <button
                            aria-label={`Decrease ${item.name} quantity`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:text-primary"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.name, item.quantity - 1)
                            }
                            type="button"
                          >
                            <Minus aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            aria-label={`Increase ${item.name} quantity`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:text-primary"
                            disabled={
                              Number.isFinite(item.stock) &&
                              item.quantity >= item.stock
                            }
                            onClick={() =>
                              updateQuantity(item.name, item.quantity + 1)
                            }
                            type="button"
                          >
                            <Plus aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Remove ${item.name} from bag`}
                            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-error hover:bg-red-50"
                            onClick={() => removeFromCart(item.name)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="delivery-heading"
                className="rounded-2xl border border-border bg-surface p-5 sm:p-7"
              >
                <h2
                  className="font-serif text-xl font-semibold text-text-main"
                  id="delivery-heading"
                >
                  Delivery details
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Share where the artisan can send your handcrafted order.
                </p>
                <p className="mt-3 rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs leading-5 text-text-muted">
                  {savedAddress
                    ? 'Your last delivery address has been filled in. It will be remembered on this device for your next order.'
                    : 'After your first order, this delivery address will be remembered on this device for next time.'}
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-text-main">
                    Full name
                    <input
                      autoComplete="name"
                      className={fieldClass}
                      defaultValue={savedAddress?.fullName ?? currentUser?.name ?? ''}
                      name="fullName"
                      placeholder="Your name"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    Phone number
                    <input
                      autoComplete="tel"
                      className={fieldClass}
                      defaultValue={savedAddress?.phone ?? ''}
                      name="phone"
                      placeholder="Your phone number"
                      required
                      type="tel"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    Email address
                    <input
                      autoComplete="email"
                      className={fieldClass}
                      defaultValue={savedAddress?.email ?? currentUser?.email ?? ''}
                      name="email"
                      placeholder="you@example.com"
                      required
                      type="email"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    Street address
                    <textarea
                      autoComplete="street-address"
                      className={fieldClass}
                      defaultValue={savedAddress?.address ?? ''}
                      name="address"
                      placeholder="House number, street, area"
                      required
                      rows="3"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    City
                    <input
                      autoComplete="address-level2"
                      className={fieldClass}
                      defaultValue={savedAddress?.city ?? ''}
                      name="city"
                      placeholder="City"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    State
                    <input
                      autoComplete="address-level1"
                      className={fieldClass}
                      defaultValue={savedAddress?.state ?? ''}
                      name="state"
                      placeholder="State"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    PIN code
                    <input
                      autoComplete="postal-code"
                      className={fieldClass}
                      inputMode="numeric"
                      defaultValue={savedAddress?.postalCode ?? ''}
                      name="postalCode"
                      pattern="[0-9]{6}"
                      placeholder="6-digit PIN code"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    Note for the artisan <span className="font-normal text-text-muted">(optional)</span>
                    <textarea
                      className={fieldClass}
                      name="note"
                      placeholder="Any helpful delivery or customization notes"
                      rows="2"
                    />
                  </label>
                </div>
              </section>
            </div>

            <aside className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7 lg:sticky lg:top-6">
              <h2 className="font-serif text-xl font-semibold text-text-main">
                Price details
              </h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4 text-text-secondary">
                  <span>Delivery</span>
                  <span>{shipping ? formatPrice(shipping) : 'Free'}</span>
                </div>
                {subtotal > 0 && subtotal < 1500 && (
                  <p className="text-xs leading-5 text-text-muted">
                    Free delivery on orders over ₹1,500.
                  </p>
                )}
                <div className="flex justify-between gap-4 border-t border-border pt-4 text-base font-bold text-text-main">
                  <span>Total payable</span>
                  <span className="text-primary">{formatPrice(subtotal + shipping)}</span>
                </div>
              </div>

              {formError && (
                <p
                  className="mt-5 rounded-lg border border-error/30 bg-red-50 p-3 text-sm leading-5 text-error"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="mt-5 rounded-lg border border-border bg-background p-3.5 text-xs text-text-muted space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-text-main">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-success" />
                  <span>Razorpay Test Mode Secure Payment</span>
                </div>
                <p className="leading-5">
                  Complete test payments via UPI, Cards, NetBanking, and Wallets using official Razorpay test credentials.
                </p>
              </div>

              <button
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50"
                disabled={!addressLoadComplete || isSubmitting}
                type="submit"
              >
                <CreditCard aria-hidden="true" className="h-4 w-4" />
                {isSubmitting ? 'Opening payment gateway…' : `Pay ${formatPrice(subtotal + shipping)} now`}
              </button>
            </aside>
          </form>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
            <ShoppingBag aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-text-main">
              Your bag is empty
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Find something handmade to start your order.
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
              to="/marketplace"
            >
              Browse crafts
            </Link>
          </section>
        )}
      </main>
    </MarketplaceLayout>
  )
}

export default OrderSummary
