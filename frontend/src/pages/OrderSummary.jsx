import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ImageOff,
  Lock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  User,
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
  'mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

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
          failureData.error?.description ||
            'Payment could not be processed. Please try again with valid test credentials.',
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

  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / 1500) * 100))

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors focus-visible:outline-none"
          to="/marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Continue shopping
        </Link>

        {/* Stepper Header */}
        <header className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-border/70">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary uppercase tracking-wider">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Step 1 of 2: Checkout Review</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
              Order Summary & Delivery
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {itemCount} {itemCount === 1 ? 'handcrafted item' : 'handcrafted items'} · Supporting verified master artisans
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-text-muted">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
              Bag & Details
            </span>
            <span className="text-border">―</span>
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] font-bold">2</span>
              Razorpay Checkout
            </span>
          </div>
        </header>

        {!isCustomer && currentUser ? (
          <section className="mt-8 rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-card sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
              <ShoppingBag aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-bold text-text-main">
              Your bag is for customer accounts
            </h2>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-sm text-text-secondary">
              You’re signed in as a {currentUser.accountType || 'community member'}.
              Please switch to a customer account before placing a marketplace order.
            </p>
          </section>
        ) : !isCustomer ? (
          <section className="mt-8 rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-card sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBag aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-bold text-text-main">
              Log in to view your bag
            </h2>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-sm text-text-secondary">
              Sign in with your customer account to finalize your order and support master makers.
            </p>
            <button
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-hover focus-visible:outline-none"
              onClick={() => openAuth('login')}
              type="button"
            >
              Sign in or create account
            </button>
          </section>
        ) : items.length ? (
          <form
            key={addressLoadComplete ? 'address-loaded' : 'address-loading'}
            className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_400px]"
            onSubmit={handleSubmit}
          >
            <div className="space-y-8">
              {/* Free Delivery Incentive Progress Bar */}
              <div className="overflow-hidden rounded-2xl border border-secondary/25 bg-surface p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-text-main">
                    <Sparkles className="h-4 w-4 text-accent" />
                    {subtotal >= 1500
                      ? "You've unlocked FREE Delivery across India! 🎁"
                      : `Add ₹${(1500 - subtotal).toLocaleString('en-IN')} more to unlock FREE Delivery`}
                  </span>
                  <span className="text-secondary font-bold">{freeDeliveryProgress}%</span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>

              {/* Items in Bag List */}
              <section
                aria-labelledby="bag-items-heading"
                className="rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-8"
              >
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <h2
                    className="font-serif text-xl font-bold text-text-main"
                    id="bag-items-heading"
                  >
                    Items in your bag ({itemCount})
                  </h2>
                  <span className="text-xs font-medium text-text-muted">
                    Handmade directly by makers
                  </span>
                </div>

                <ul className="mt-6 divide-y divide-border/70">
                  {items.map((item) => (
                    <li
                      className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                      key={item.name}
                    >
                      {item.image ? (
                        <img
                          alt={item.imageAlt}
                          className="h-24 w-full rounded-2xl object-cover shadow-xs sm:w-28 shrink-0"
                          src={item.image}
                        />
                      ) : (
                        <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-text-muted sm:w-28">
                          <ImageOff aria-hidden="true" className="h-7 w-7" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                            {item.category}
                          </span>
                          <h3 className="font-serif text-lg font-bold text-text-main">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-text-muted">
                            Master artisan: <span className="font-medium text-text-secondary">{item.artisan}</span>
                          </p>
                          <p className="mt-1 font-serif text-base font-bold text-primary">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background p-1 sm:self-center">
                          <button
                            aria-label={`Decrease ${item.name} quantity`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-primary transition-all disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.name, item.quantity - 1)
                            }
                            type="button"
                          >
                            <Minus aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-7 text-center text-xs font-bold text-text-main">
                            {item.quantity}
                          </span>
                          <button
                            aria-label={`Increase ${item.name} quantity`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-primary transition-all disabled:opacity-40"
                            disabled={
                              Number.isFinite(item.stock) &&
                              item.quantity >= item.stock
                            }
                            onClick={() =>
                              updateQuantity(item.name, item.quantity + 1)
                            }
                            type="button"
                          >
                            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label={`Remove ${item.name} from bag`}
                            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-error hover:bg-red-50 transition-colors"
                            onClick={() => removeFromCart(item.name)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Delivery Details Form */}
              <section
                aria-labelledby="delivery-heading"
                className="rounded-3xl border border-border/80 bg-surface p-6 shadow-card sm:p-8"
              >
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div>
                    <h2
                      className="font-serif text-xl font-bold text-text-main"
                      id="delivery-heading"
                    >
                      Delivery & Shipping Address
                    </h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Your order will be securely packed and dispatched by the maker.
                    </p>
                  </div>
                  <Truck className="h-5 w-5 text-secondary" />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Full Name
                    <div className="relative">
                      <input
                        autoComplete="name"
                        className={fieldClass}
                        defaultValue={savedAddress?.fullName ?? currentUser?.name ?? ''}
                        name="fullName"
                        placeholder="Recipient full name"
                        required
                      />
                    </div>
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Phone Number
                    <input
                      autoComplete="tel"
                      className={fieldClass}
                      defaultValue={savedAddress?.phone ?? ''}
                      name="phone"
                      placeholder="10-digit mobile number"
                      required
                      type="tel"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary sm:col-span-2">
                    Email Address
                    <input
                      autoComplete="email"
                      className={fieldClass}
                      defaultValue={savedAddress?.email ?? currentUser?.email ?? ''}
                      name="email"
                      placeholder="Order confirmation will be sent here"
                      required
                      type="email"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary sm:col-span-2">
                    Street Address & Locality
                    <textarea
                      autoComplete="street-address"
                      className={fieldClass}
                      defaultValue={savedAddress?.address ?? ''}
                      name="address"
                      placeholder="Flat, house no., building, apartment, street"
                      required
                      rows="2"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    City
                    <input
                      autoComplete="address-level2"
                      className={fieldClass}
                      defaultValue={savedAddress?.city ?? ''}
                      name="city"
                      placeholder="City / Town"
                      required
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
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
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    PIN Code
                    <input
                      autoComplete="postal-code"
                      className={fieldClass}
                      defaultValue={savedAddress?.postalCode ?? ''}
                      inputMode="numeric"
                      name="postalCode"
                      pattern="[0-9]{6}"
                      placeholder="6-digit postal code"
                      required
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary sm:col-span-2">
                    Special Note for Maker <span className="font-normal text-text-muted lowercase">(optional)</span>
                    <textarea
                      className={fieldClass}
                      name="note"
                      placeholder="Gift message, packaging instructions, or landmark details"
                      rows="2"
                    />
                  </label>
                </div>
              </section>
            </div>

            {/* Price Details & Payment Aside */}
            <aside className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xl sm:p-7 lg:sticky lg:top-24 space-y-6">
              <div className="border-b border-border/70 pb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-text-main">
                  Payment Summary
                </h2>
                <div className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Lock className="h-3.5 w-3.5" />
                  <span>256-bit Encrypted</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-text-main">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Delivery / Shipping</span>
                  <span className={shipping === 0 ? 'font-bold text-success' : 'font-semibold text-text-main'}>
                    {shipping ? formatPrice(shipping) : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Platform Fee</span>
                  <span className="text-success font-semibold">₹0 (Waived)</span>
                </div>

                <div className="border-t border-border/80 pt-4 flex justify-between items-baseline">
                  <span className="font-bold text-text-main text-base">Total Payable</span>
                  <span className="font-serif text-2xl font-bold text-primary">
                    {formatPrice(subtotal + shipping)}
                  </span>
                </div>
              </div>

              {formError && (
                <div
                  className="rounded-xl border border-error/30 bg-red-50 p-3.5 text-xs leading-5 text-error flex items-start gap-2"
                  role="alert"
                >
                  <span className="font-bold shrink-0">●</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Razorpay Trust Card */}
              <div className="rounded-2xl border border-secondary/25 bg-secondary/5 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-text-main">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span>Razorpay Secure Test Gateway</span>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-success uppercase">
                    Active
                  </span>
                </div>
                <p className="text-text-muted leading-relaxed">
                  Support test payments via <strong>UPI</strong>, <strong>Cards</strong> (Visa, Mastercard, RuPay), <strong>NetBanking</strong>, and <strong>Wallets</strong>.
                </p>
              </div>

              {/* Primary Pay Now Action */}
              <button
                className="relative inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                disabled={!addressLoadComplete || isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Connecting to Razorpay…</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay {formatPrice(subtotal + shipping)} via Razorpay</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-text-muted">
                <span>100% Direct Artisan Payout</span>
                <span>•</span>
                <span>Money-Back Guarantee</span>
              </div>
            </aside>
          </form>
        ) : (
          <section className="mt-8 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-20 text-center shadow-xs">
            <ShoppingBag aria-hidden="true" className="mx-auto h-12 w-12 text-secondary/50" />
            <h2 className="mt-4 font-serif text-2xl font-bold text-text-main">
              Your bag is empty
            </h2>
            <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">
              Explore authentic crafts handwoven and sculpted by master artisans across India.
            </p>
            <Link
              className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
              to="/marketplace"
            >
              Browse Artisan Crafts
            </Link>
          </section>
        )}
      </main>
    </MarketplaceLayout>
  )
}

export default OrderSummary
