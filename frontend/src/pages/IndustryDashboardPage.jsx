import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackagePlus,
  Store,
  XCircle,
} from 'lucide-react'
import IndustryLayout from '../components/layout/IndustryLayout'
import { useAuthDialog } from '../hooks/useAuthDialog'
import {
  getIndustryOrderHistory,
  saveOrderHistoryEntry,
} from '../utils/order-storage'
import { getRegisteredArtisans } from '../utils/user-storage'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const ACCEPTED_STATUSES = [
  'Processing',
  'Ready to ship',
  'Shipped',
  'Completed',
]

function readArtisans() {
  try {
    return { artisans: getRegisteredArtisans(), error: '' }
  } catch (error) {
    console.error('Unable to load artisans for industry orders.', error)
    return {
      artisans: [],
      error: error.message || 'Artisan accounts could not be loaded.',
    }
  }
}

function readOrders(industry) {
  try {
    return { orders: getIndustryOrderHistory(industry), error: '' }
  } catch (error) {
    console.error('Unable to load industry orders.', error)
    return {
      orders: [],
      error: error.message || 'Your order requests could not be loaded.',
    }
  }
}

function getStatusStyle(status) {
  if (ACCEPTED_STATUSES.includes(status)) {
    return 'bg-green-50 text-success'
  }
  if (status === 'Rejected') return 'bg-red-50 text-error'
  return 'bg-amber-50 text-amber-800'
}

const IndustryDashboardPage = () => {
  const { currentUser } = useAuthDialog()
  const [artisanState] = useState(readArtisans)
  const [ordersState, setOrdersState] = useState(() => readOrders(currentUser))
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)
  const { artisans, error: artisanError } = artisanState
  const { orders, error: orderError } = ordersState

  const refreshOrders = useCallback(() => {
    setOrdersState(readOrders(currentUser))
  }, [currentUser])

  useEffect(() => {
    refreshOrders()
    const intervalId = window.setInterval(refreshOrders, 2000)
    window.addEventListener('storage', refreshOrders)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('storage', refreshOrders)
    }
  }, [refreshOrders])

  const acceptedOrders = useMemo(
    () => orders.filter((order) => ACCEPTED_STATUSES.includes(order.status)),
    [orders],
  )

  if (!currentUser) {
    return <Navigate replace to="/industry/auth" />
  }
  if (currentUser.accountType !== 'industry') {
    return <Navigate replace to="/marketplace" />
  }

  const handleCreateOrder = (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeIsError(false)
    const formData = new FormData(event.currentTarget)
    const artisan = artisans.find(
      (entry) => entry.id === formData.get('artisanId'),
    )
    if (!artisan) {
      setNotice('Choose an active artisan account before assigning this order.')
      setNoticeIsError(true)
      return
    }

    const quantity = Number(formData.get('quantity'))
    const unitPrice = Number(formData.get('unitPrice'))
    const title = String(formData.get('title')).trim()
    const category = String(formData.get('category')).trim()
    const details = String(formData.get('details')).trim()
    const deadline = String(formData.get('deadline'))

    try {
      const requestedDelivery = new Date(`${deadline}T12:00:00`).toLocaleDateString()
      saveOrderHistoryEntry(
        {
          id: `industry-${Date.now()}`,
          source: 'industry',
          assignedArtisanId: artisan.id,
          assignedArtisan: {
            id: artisan.id,
            name: artisan.name,
            email: artisan.email,
            artCategory: artisan.artCategory,
          },
          createdAt: new Date().toISOString(),
          deadline,
          specifications: details,
          items: [
            {
              name: title,
              category,
              artisan: artisan.name,
              price: unitPrice,
              quantity,
            },
          ],
          subtotal: unitPrice * quantity,
          shipping: 0,
          total: unitPrice * quantity,
          customer: {
            fullName: currentUser.contactName || currentUser.name,
            contactName: currentUser.contactName || currentUser.name,
            companyName: currentUser.name,
            phone: currentUser.phone,
            email: currentUser.email,
            address: currentUser.companyAddress,
            note: `Industry production request. Delivery requested by ${requestedDelivery}.${details ? ` ${details}` : ''}`,
          },
        },
        currentUser,
      )
      refreshOrders()
      setFormOpen(false)
      setNotice(`Order request assigned to ${artisan.name}.`)
      event.currentTarget.reset()
    } catch (error) {
      console.error('Unable to assign industry order.', error)
      setNotice(error.message || 'The order request could not be assigned.')
      setNoticeIsError(true)
    }
  }

  const artisanCategories = [
    ...new Set(artisans.map((artisan) => artisan.artCategory).filter(Boolean)),
  ]

  return (
    <IndustryLayout>
      <main className="w-full px-4 py-6 sm:px-8 sm:py-9 lg:px-12">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="relative overflow-hidden bg-primary px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="absolute -right-12 -top-32 h-72 w-72 rounded-full border border-white/10" />
            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                  Industry partner workspace
                </p>
                <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                  Welcome, {currentUser.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                  Assign production work directly to artisans and follow each
                  response from one place.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white">
                <Building2 aria-hidden="true" className="h-4 w-4" />
                {currentUser.industry || 'Industry partner'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div>
              <p className="font-semibold text-text-main">
                {currentUser.contactName || currentUser.name}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">{currentUser.email}</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={() => {
                setNotice('')
                setFormOpen((isOpen) => !isOpen)
              }}
              type="button"
            >
              <PackagePlus aria-hidden="true" className="h-4 w-4" />
              {formOpen ? 'Close request form' : 'Assign an order'}
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Total requests</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-text-main">
              {orders.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Awaiting artisan response</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-text-main">
              {orders.filter((order) => order.status === 'Awaiting response').length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Accepted by artisans</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-success">
              {acceptedOrders.length}
            </p>
          </div>
        </section>

        <section
          aria-live="polite"
          className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
            acceptedOrders.length
              ? 'border-success/30 bg-green-50 text-success'
              : 'border-border bg-surface text-text-secondary'
          }`}
          role="status"
        >
          <BellRing aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {acceptedOrders.length
                ? `${acceptedOrders.length} artisan ${acceptedOrders.length === 1 ? 'has' : 'have'} accepted your order${acceptedOrders.length === 1 ? '' : 's'}.`
                : 'Acceptance notifications'}
            </p>
            <p className="mt-1 text-sm leading-6">
              {acceptedOrders.length
                ? 'Accepted offers and subsequent fulfillment updates appear below. This workspace refreshes order statuses automatically.'
                : 'You will see an update here as soon as an artisan accepts an assigned request.'}
            </p>
          </div>
        </section>

        {(notice || artisanError || orderError) && (
          <p
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              noticeIsError || artisanError || orderError
                ? 'border-error/30 bg-red-50 text-error'
                : 'border-success/30 bg-green-50 text-success'
            }`}
            role={noticeIsError || artisanError || orderError ? 'alert' : 'status'}
          >
            {artisanError || orderError || notice}
          </p>
        )}

        {formOpen && (
          <form
            className="mt-5 grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2 sm:p-8"
            onSubmit={handleCreateOrder}
          >
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-secondary">NEW PRODUCTION REQUEST</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
                Assign work to an artisan
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                The selected artisan will receive this request in their Orders
                workspace and can accept or reject it.
              </p>
            </div>
            {artisans.length ? (
              <>
                <label className="text-sm font-medium text-text-main sm:col-span-2">
                  Assign to artisan
                  <select
                    className={inputClass}
                    defaultValue=""
                    name="artisanId"
                    required
                  >
                    <option disabled value="">Choose an artisan account</option>
                    {artisans.map((artisan) => (
                      <option key={artisan.id} value={artisan.id}>
                        {artisan.name}
                        {artisan.artCategory ? ` · ${artisan.artCategory}` : ''}
                        {artisan.email ? ` · ${artisan.email}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-text-main">
                  Order or product name
                  <input
                    className={inputClass}
                    maxLength={100}
                    name="title"
                    placeholder="e.g. Handwoven cotton table runners"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-text-main">
                  Craft category
                  <select className={inputClass} defaultValue="" name="category" required>
                    <option disabled value="">Choose a craft category</option>
                    {artisanCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                    <option>Other handmade craft</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-text-main">
                  Quantity
                  <input
                    className={inputClass}
                    min="1"
                    name="quantity"
                    required
                    type="number"
                  />
                </label>
                <label className="text-sm font-medium text-text-main">
                  Offer per item (₹)
                  <input
                    className={inputClass}
                    min="1"
                    name="unitPrice"
                    required
                    type="number"
                  />
                </label>
                <label className="text-sm font-medium text-text-main">
                  Requested delivery date
                  <input
                    className={inputClass}
                    min={new Date().toISOString().slice(0, 10)}
                    name="deadline"
                    required
                    type="date"
                  />
                </label>
                <label className="text-sm font-medium text-text-main sm:col-span-2">
                  Specifications or instructions
                  <textarea
                    className={inputClass}
                    maxLength={1000}
                    name="details"
                    placeholder="Materials, sizes, colors, packaging, or other requirements"
                    required
                    rows="4"
                  />
                </label>
                <p className="text-xs leading-5 text-text-muted sm:col-span-2">
                  The offer and request are saved in this browser demo. No payment
                  is processed and no remote notification is sent.
                </p>
                <button
                  className="min-h-11 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                  disabled={!artisans.length}
                  type="submit"
                >
                  Assign order request
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-8 text-center sm:col-span-2">
                <Store aria-hidden="true" className="mx-auto h-8 w-8 text-secondary" />
                <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                  No artisan accounts yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Artisans need to create an account before you can assign a request.
                </p>
              </div>
            )}
          </form>
        )}

        <section className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-secondary">ORDER MANAGEMENT</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
              Assigned orders
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Track artisan responses and see when an offer moves into production.
            </p>
          </div>
          {orders.length ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const item = order.items[0]
                const assignedArtisan = order.assignedArtisan
                const isAccepted = ACCEPTED_STATUSES.includes(order.status)

                return (
                  <article
                    className="overflow-hidden rounded-xl border border-border bg-background"
                    key={order.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4 sm:px-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                          Assigned order
                        </p>
                        <h3 className="mt-1 font-semibold text-text-main">{item?.name}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          {order.id} · Assigned to {assignedArtisan.name || item?.artisan}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusStyle(order.status)}`}
                      >
                        {isAccepted ? (
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                        ) : order.status === 'Rejected' ? (
                          <XCircle aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Clock3 aria-hidden="true" className="h-4 w-4" />
                        )}
                        {order.status}
                      </span>
                    </div>
                    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                      <div>
                        <p className="text-sm font-semibold text-text-main">Request details</p>
                        <p className="mt-2 text-sm text-text-secondary">
                          {item?.category} · Quantity {item?.quantity}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          ₹{item?.price?.toLocaleString('en-IN')} per item · Total offer
                          {' '}₹{order.total?.toLocaleString('en-IN')}
                        </p>
                        {order.deadline && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                            <CalendarDays aria-hidden="true" className="h-4 w-4" />
                            Requested by {new Date(`${order.deadline}T12:00:00`).toLocaleDateString()}
                          </p>
                        )}
                        {order.specifications && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                            {order.specifications}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" />
                          Assigned {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface p-4">
                        <p className="text-sm font-semibold text-text-main">
                          Artisan contact
                        </p>
                        {assignedArtisan.artCategory && (
                          <p className="mt-2 text-sm text-text-secondary">
                            {assignedArtisan.artCategory}
                          </p>
                        )}
                        {assignedArtisan.email && (
                          <a
                            className="mt-1 block break-all text-sm text-primary hover:underline"
                            href={`mailto:${assignedArtisan.email}`}
                          >
                            {assignedArtisan.email}
                          </a>
                        )}
                        {!assignedArtisan.email && (
                          <p className="mt-2 text-sm text-text-muted">
                            Contact details are not available.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
              <PackagePlus aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
              <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                No orders assigned yet
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                Create a production request and assign it to an artisan to start
                receiving responses here.
              </p>
            </div>
          )}
          <p className="mt-5 text-xs leading-5 text-text-muted">
            Order updates are stored locally in this demo. Status refreshes every
            two seconds while this workspace is open.
          </p>
        </section>
      </main>
    </IndustryLayout>
  )
}

export default IndustryDashboardPage
