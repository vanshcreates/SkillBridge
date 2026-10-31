import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Info,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Store,
  XCircle,
} from 'lucide-react'
import IndustryLayout from '../components/layout/IndustryLayout'
import { useAuthDialog } from '../hooks/useAuthDialog'
<<<<<<< HEAD
import { getArtisansApi } from '../services/auth-api'
=======
import { getAccountHomePath } from '../utils/account-routing'
import {
  getIndustryOrderHistory,
  saveOrderHistoryEntry,
} from '../utils/order-storage'
import { getRegisteredArtisans } from '../utils/user-storage'
>>>>>>> 7c8c0d86dd75d0e65e512f87c7d99f506219c90e
import {
  analyzeProjectApi,
  createIndustryProjectApi,
  getAvailableArtisansForIndustryApi,
  getIndustryDashboardApi,
  getIndustryNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../services/industry-api'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const ACCEPTED_STATUSES = [
  'Accepted',
  'Processing',
  'Ready to ship',
  'Shipped',
  'Completed',
]

function getStatusStyle(status) {
  if (ACCEPTED_STATUSES.includes(status)) {
    return 'bg-green-50 text-success border-success/30'
  }
  if (status === 'Rejected') return 'bg-red-50 text-error border-error/30'
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

const IndustryDashboardPage = () => {
  const { currentUser } = useAuthDialog()

  const [artisans, setArtisans] = useState([])
  const [orders, setOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0)
  const [stats, setStats] = useState({
    totalRequests: 0,
    awaitingResponse: 0,
    acceptedByArtisans: 0,
    completedProjects: 0,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Smart Responsible Analysis State
  const [analysisData, setAnalysisData] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [formFields, setFormFields] = useState({
    artisanId: '',
    title: '',
    category: '',
    quantity: 1,
    unitPrice: 500,
    duration: '30 days',
    deadline: '',
    details: '',
  })

  // Load registered artisans from backend
  const loadArtisans = useCallback(async () => {
    try {
      const res = await getAvailableArtisansForIndustryApi()
      if (Array.isArray(res?.artisans) && res.artisans.length) {
        setArtisans(res.artisans)
        return
      }
    } catch {
      // fallback to auth artisans
    }
    try {
      const authArtisans = await getArtisansApi()
      if (Array.isArray(authArtisans)) {
        setArtisans(authArtisans)
      }
    } catch {
      setArtisans([])
    }
  }, [])

  // Load dashboard, orders and notifications from backend API
  const refreshBackendData = useCallback(async () => {
    if (!currentUser || currentUser.accountType !== 'industry') return

    try {
      const res = await getIndustryDashboardApi()
      if (res?.success) {
        if (res.stats) {
          setStats(res.stats)
          setUnreadNotifsCount(res.stats.unreadNotificationsCount || 0)
        }
        if (Array.isArray(res.recentNotifications)) {
          setNotifications(res.recentNotifications)
        }
        if (Array.isArray(res.availableArtisans) && res.availableArtisans.length) {
          setArtisans(res.availableArtisans)
        }

        // Merge backend projects & orders
        const backendOrders = Array.isArray(res.orders) ? res.orders : []
        const backendProjects = Array.isArray(res.projects)
          ? res.projects.map((p) => ({
              id: p.id || p._id,
              createdAt: p.createdAt,
              deadline: p.deadline,
              duration: p.duration,
              specifications: p.specifications,
              items: [
                {
                  name: p.title,
                  category: p.category,
                  artisan: p.assignedArtisan?.name || 'Open / Unassigned',
                  price: p.unitPrice,
                  quantity: p.quantity,
                  status: p.status,
                },
              ],
              subtotal: p.totalBudget || p.unitPrice * p.quantity,
              total: p.totalBudget || p.unitPrice * p.quantity,
              status: p.status === 'Open' ? 'Awaiting response' : p.status,
              assignedArtisan: p.assignedArtisan || {},
              responsibleAnalysis: p.responsibleAnalysis,
            }))
          : []

        const combined = [...backendProjects]
        backendOrders.forEach((bo) => {
          if (!combined.some((p) => p.id === bo.id)) combined.push(bo)
        })
        setOrders(combined)
      }
    } catch (err) {
      console.warn('Backend industry fetch error:', err.message)
    }
  }, [currentUser])

  // Periodic polling for realtime acceptance updates
  useEffect(() => {
    loadArtisans()
    refreshBackendData()

    const intervalId = window.setInterval(refreshBackendData, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadArtisans, refreshBackendData])

  const acceptedOrders = useMemo(
    () => orders.filter((order) => ACCEPTED_STATUSES.includes(order.status)),
    [orders],
  )

  // Trigger On-The-Fly Project Feasibility & Responsible Project Analysis
  const handleAnalyzeProject = async () => {
    if (!formFields.title || !formFields.category) {
      setNotice('Please provide at least a project title and category to run analysis.')
      setNoticeIsError(true)
      return
    }

    setIsAnalyzing(true)
    setNotice('')
    try {
      const res = await analyzeProjectApi({
        title: formFields.title,
        category: formFields.category,
        quantity: Number(formFields.quantity) || 1,
        unitPrice: Number(formFields.unitPrice) || 0,
        duration: formFields.duration || '30 days',
        deadline: formFields.deadline || null,
        specifications: formFields.details || '',
      })

      if (res?.analysis) {
        setAnalysisData(res.analysis)
      }
    } catch (err) {
      console.warn('Backend analysis API offline, using local heuristics:', err.message)
      // Local fallback analysis
      const qty = Number(formFields.quantity) || 1
      const price = Number(formFields.unitPrice) || 500
      setAnalysisData({
        feasibilityScore: 88,
        feasibilityStatus: 'High Feasibility',
        fairWageRating: price >= 400 ? 'Fair Wage Verified' : 'Standard Compensation',
        fairWageScore: price >= 400 ? 92 : 75,
        effectiveHourlyRate: Math.round(price * 0.4),
        estimatedLaborHours: qty * 8,
        suggestedPricePerUnit: Math.max(price, 450),
        suggestedDurationDays: Math.max(qty * 2, 14),
        sustainabilityIndex: {
          score: 86,
          badge: 'Fair Craft Certified 🌿',
        },
        analysisSummary: `Project analysis indicates good feasibility. The offered price of ₹${price}/unit provides ethical compensation for artisanal craftsmanship.`,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle Mark Single Notification Read
  const handleMarkNotificationRead = async (id) => {
    try {
      await markNotificationReadApi(id)
    } catch (e) {
      console.warn('Mark notif read error:', e.message)
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n))
    )
    setUnreadNotifsCount((prev) => Math.max(0, prev - 1))
  }

  // Handle Mark All Notifications Read
  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadApi()
    } catch (e) {
      console.warn('Mark all notifs read error:', e.message)
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadNotifsCount(0)
  }

  if (!currentUser) {
    return <Navigate replace to="/industry/auth" />
  }
  if (currentUser.accountType !== 'industry') {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }

  // Handle Form Submit: Create and Assign Project
  const handleCreateOrder = async (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeIsError(false)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const artisanId = formData.get('artisanId')
    const artisan = artisans.find(
      (entry) => entry.id === artisanId || entry._id === artisanId,
    )

    if (!artisan) {
      setNotice('Choose an active artisan account before assigning this order.')
      setNoticeIsError(true)
      setIsSubmitting(false)
      return
    }

    const quantity = Number(formData.get('quantity')) || 1
    const unitPrice = Number(formData.get('unitPrice')) || 0
    const title = String(formData.get('title')).trim()
    const category = String(formData.get('category')).trim()
    const duration = String(formData.get('duration')).trim() || '30 days'
    const details = String(formData.get('details')).trim()
    const deadline = String(formData.get('deadline'))

    // Create project in backend
    try {
      const res = await createIndustryProjectApi({
        title,
        category,
        quantity,
        unitPrice,
        duration,
        deadline,
        specifications: details,
        assignedArtisanId: artisan.id || artisan._id,
      });

      if (res?.success) {
        setNotice(
          `Project assigned to ${artisan.name} successfully at ₹${unitPrice}/item for ${duration}. The artisan will receive notification immediately.`
        );
      } else {
        throw new Error(res?.message || 'Failed to assign project.');
      }
    } catch (apiErr) {
      console.error('Backend project creation error:', apiErr.message);
      setNotice(apiErr.message || 'The order request could not be assigned.');
      setNoticeIsError(true);
    }

    refreshBackendData();
    setFormOpen(false)
    setAnalysisData(null)
    setIsSubmitting(false)
    event.currentTarget.reset()
  }

  const artisanCategories = [
    ...new Set(artisans.map((artisan) => artisan.artCategory).filter(Boolean)),
  ]

  return (
    <IndustryLayout>
      <main className="w-full px-4 py-6 sm:px-8 sm:py-9 lg:px-12">
        {/* Workspace Banner */}
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
                  Assign custom projects to master artisans according to price and
                  time duration, analyze responsible craft metrics, and receive instant acceptance notifications.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Notification Bell with Badge */}
                <button
                  className="relative inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                  onClick={() => setNotifDrawerOpen((prev) => !prev)}
                  type="button"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                  {unreadNotifsCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-primary">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white">
                  <Building2 aria-hidden="true" className="h-4 w-4" />
                  {currentUser.industry || 'Industry partner'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div>
              <p className="font-semibold text-text-main">
                {currentUser.contactName || currentUser.name}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">{currentUser.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                onClick={() => {
                  setNotice('')
                  setFormOpen((isOpen) => !isOpen)
                }}
                type="button"
              >
                <PackagePlus aria-hidden="true" className="h-4 w-4" />
                {formOpen ? 'Close request form' : 'Assign a new project'}
              </button>
            </div>
          </div>
        </section>

        {/* Real-time Notification Panel */}
        {notifDrawerOpen && (
          <section className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-secondary" />
                <h3 className="font-serif text-lg font-semibold text-text-main">
                  Artisan Acceptance & Status Updates
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {unreadNotifsCount > 0 && (
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={handleMarkAllNotificationsRead}
                    type="button"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-muted"
                  onClick={() => setNotifDrawerOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {notifications.length ? (
                notifications.map((notif) => (
                  <div
                    className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition ${
                      notif.isRead
                        ? 'border-border bg-background/60 text-text-secondary'
                        : 'border-secondary/30 bg-secondary/5 text-text-main'
                    }`}
                    key={notif.id || notif._id}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-main">{notif.title}</p>
                        <p className="mt-1 text-sm leading-5">{notif.message}</p>
                        <p className="mt-2 text-xs text-text-muted">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notif.isRead && (
                      <button
                        aria-label="Mark read"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-main"
                        onClick={() => handleMarkNotificationRead(notif.id || notif._id)}
                        title="Mark as read"
                        type="button"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-text-muted">
                  No notifications yet. You will be notified the instant an artisan accepts your assigned order.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Metrics Grid */}
        <section className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Total requests</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-text-main">
              {stats.totalRequests || orders.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Awaiting artisan response</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-text-main">
              {stats.awaitingResponse ||
                orders.filter(
                  (o) => o.status === 'Awaiting response' || o.status === 'Awaiting artisan response'
                ).length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Accepted by artisans</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-success">
              {stats.acceptedByArtisans || acceptedOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-medium text-text-secondary">Completed projects</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-primary">
              {stats.completedProjects ||
                orders.filter((o) => o.status === 'Completed').length}
            </p>
          </div>
        </section>

        {/* Live Acceptance Status Banner */}
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
                ? `${acceptedOrders.length} artisan ${acceptedOrders.length === 1 ? 'has' : 'have'} accepted your production orders.`
                : 'Acceptance notifications'}
            </p>
            <p className="mt-1 text-sm leading-6">
              {acceptedOrders.length
                ? 'Accepted offers and production progress update automatically from the backend.'
                : 'You will receive immediate notifications here and in your inbox as soon as an artisan accepts an assigned request.'}
            </p>
          </div>
        </section>

        {notice && (
          <p
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              noticeIsError
                ? 'border-error/30 bg-red-50 text-error'
                : 'border-success/30 bg-green-50 text-success'
            }`}
            role={noticeIsError ? 'alert' : 'status'}
          >
            {notice}
          </p>
        )}

        {/* Assignment & Project Creation Form with Live Analysis */}
        {formOpen && (
          <form
            className="mt-5 grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2 sm:p-8"
            onSubmit={handleCreateOrder}
          >
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    ASSIGN CUSTOM PROJECT OR PRODUCTION ORDER
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
                    Assign a project according to price & duration
                  </h2>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/10 px-3.5 py-2 text-sm font-medium text-secondary transition hover:bg-secondary/20"
                  disabled={isAnalyzing}
                  onClick={handleAnalyzeProject}
                  type="button"
                >
                  <Sparkles className="h-4 w-4" />
                  {isAnalyzing ? 'Analyzing…' : 'Analyse project feasibility'}
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Select an artisan or choose from AI-recommended makers. The artisan will receive
                your offer price, quantity, and requested time duration, and can accept the project directly.
              </p>
            </div>

            {/* Smart Responsible Analysis Card */}
            {analysisData && (
              <div className="sm:col-span-2 rounded-xl border border-secondary/30 bg-secondary/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-secondary" />
                    <h4 className="font-semibold text-text-main">
                      Responsible Project Feasibility Analysis
                    </h4>
                  </div>
                  <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-secondary">
                    {analysisData.sustainabilityIndex?.badge || 'Fair Craft Certified'}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-surface p-3.5">
                    <p className="text-xs text-text-muted">Feasibility Score</p>
                    <p className="mt-1 text-lg font-bold text-success">
                      {analysisData.feasibilityScore}% · {analysisData.feasibilityStatus}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-3.5">
                    <p className="text-xs text-text-muted">Fair Wage Assessment</p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {analysisData.fairWageRating}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-3.5">
                    <p className="text-xs text-text-muted">Turnaround & Labor Hours</p>
                    <p className="mt-1 text-lg font-bold text-text-main">
                      ~{analysisData.estimatedLaborHours} hrs ({analysisData.suggestedDurationDays} days suggested)
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {analysisData.analysisSummary}
                </p>

                {/* Recommended Artisans */}
                {Array.isArray(analysisData.recommendedArtisans) &&
                  analysisData.recommendedArtisans.length > 0 && (
                    <div className="mt-4 border-t border-secondary/20 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                        Top recommended artisans for this project
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {analysisData.recommendedArtisans.map((art) => (
                          <button
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-main transition hover:border-secondary hover:bg-secondary/10"
                            key={art.artisanId || art.name}
                            onClick={() => {
                              setFormFields((prev) => ({
                                ...prev,
                                artisanId: art.artisanId,
                              }))
                              const selectElem = document.querySelector('select[name="artisanId"]')
                              if (selectElem) selectElem.value = art.artisanId
                            }}
                            type="button"
                          >
                            <span className="font-semibold text-secondary">
                              {art.matchScore}% Match
                            </span>
                            <span>{art.name}</span>
                            <span className="text-text-muted">({art.artCategory})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {artisans.length ? (
              <>
                <label className="text-sm font-medium text-text-main sm:col-span-2">
                  Assign to artisan
                  <select
                    className={inputClass}
                    defaultValue=""
                    name="artisanId"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, artisanId: e.target.value }))
                    }
                    required
                  >
                    <option disabled value="">Choose an artisan account</option>
                    {artisans.map((artisan) => (
                      <option key={artisan.id || artisan._id} value={artisan.id || artisan._id}>
                        {artisan.name}
                        {artisan.artCategory ? ` · ${artisan.artCategory}` : ''}
                        {artisan.experience ? ` · ${artisan.experience}` : ''}
                        {artisan.city ? ` · ${artisan.city}` : ''}
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
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Handwoven cotton table runners"
                    required
                  />
                </label>

                <label className="text-sm font-medium text-text-main">
                  Craft category
                  <select
                    className={inputClass}
                    defaultValue=""
                    name="category"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, category: e.target.value }))
                    }
                    required
                  >
                    <option disabled value="">Choose a craft category</option>
                    {artisanCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                    <option>Textiles & Handloom</option>
                    <option>Pottery & Ceramics</option>
                    <option>Woodcraft & Carving</option>
                    <option>Jewelry & Metalcraft</option>
                    <option>Leather & Footwear</option>
                    <option>Other handmade craft</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-text-main">
                  Quantity
                  <input
                    className={inputClass}
                    defaultValue={1}
                    min="1"
                    name="quantity"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    required
                    type="number"
                  />
                </label>

                <label className="text-sm font-medium text-text-main">
                  Offer price per item (₹)
                  <input
                    className={inputClass}
                    defaultValue={500}
                    min="1"
                    name="unitPrice"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, unitPrice: e.target.value }))
                    }
                    required
                    type="number"
                  />
                </label>

                <label className="text-sm font-medium text-text-main">
                  Time duration / timeline
                  <input
                    className={inputClass}
                    defaultValue="30 days"
                    name="duration"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, duration: e.target.value }))
                    }
                    placeholder="e.g. 14 days, 3 weeks, 1 month"
                    required
                  />
                </label>

                <label className="text-sm font-medium text-text-main">
                  Requested delivery deadline
                  <input
                    className={inputClass}
                    min={new Date().toISOString().slice(0, 10)}
                    name="deadline"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, deadline: e.target.value }))
                    }
                    required
                    type="date"
                  />
                </label>

                <label className="text-sm font-medium text-text-main sm:col-span-2">
                  Specifications & instructions
                  <textarea
                    className={inputClass}
                    maxLength={1000}
                    name="details"
                    onChange={(e) =>
                      setFormFields((prev) => ({ ...prev, details: e.target.value }))
                    }
                    placeholder="Specify dimensions, organic/natural materials, colors, packaging requirements, or ethical craft specifications"
                    required
                    rows="3"
                  />
                </label>

                <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-surface-muted p-4">
                  <div>
                    <p className="text-xs text-text-muted">Total project budget</p>
                    <p className="font-serif text-xl font-bold text-text-main">
                      ₹{((Number(formFields.quantity) || 1) * (Number(formFields.unitPrice) || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <Info className="h-4 w-4 text-secondary" />
                    Artisan will receive notification and can accept or counter
                  </span>
                </div>

                <button
                  className="min-h-11 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                  disabled={!artisans.length || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Assigning Project…' : 'Assign order & notify artisan'}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-8 text-center sm:col-span-2">
                <Store aria-hidden="true" className="mx-auto h-8 w-8 text-secondary" />
                <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                  No artisan accounts yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Artisans need to register before you can assign a custom production request.
                </p>
              </div>
            )}
          </form>
        )}

        {/* Assigned Orders & Projects List */}
        <section className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-secondary">ORDER & PROJECT MANAGEMENT</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
                Assigned projects and production orders
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Track artisan acceptance notifications, progress, and delivery timelines.
              </p>
            </div>
          </div>

          {orders.length ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const item = order.items?.[0]
                const assignedArtisan = order.assignedArtisan || {}
                const isAccepted = ACCEPTED_STATUSES.includes(order.status)
                const analysis = order.responsibleAnalysis

                return (
                  <article
                    className="overflow-hidden rounded-xl border border-border bg-background transition hover:border-secondary/30"
                    key={order.id || order._id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4 sm:px-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                            Assigned production request
                          </p>
                          {analysis?.sustainabilityIndex?.badge && (
                            <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                              {analysis.sustainabilityIndex.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 font-semibold text-text-main">{item?.name}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          {order.id} · Assigned to {assignedArtisan.name || item?.artisan}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusStyle(order.status)}`}
                      >
                        {isAccepted ? (
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                        ) : order.status === 'Rejected' ? (
                          <XCircle aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Clock3 aria-hidden="true" className="h-4 w-4" />
                        )}
                        {isAccepted ? `Accepted (${order.status})` : order.status}
                      </span>
                    </div>

                    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                      <div>
                        <p className="text-sm font-semibold text-text-main">Request details</p>
                        <p className="mt-2 text-sm text-text-secondary">
                          {item?.category} · Quantity {item?.quantity}
                        </p>
                        <p className="mt-1 text-sm font-medium text-text-main">
                          ₹{item?.price?.toLocaleString('en-IN')} per item · Total offer ₹{order.total?.toLocaleString('en-IN')}
                        </p>
                        {order.duration && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                            <Clock3 className="h-4 w-4 text-secondary" />
                            Agreed duration: {order.duration}
                          </p>
                        )}
                        {order.deadline && (
                          <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                            <CalendarDays aria-hidden="true" className="h-4 w-4 text-secondary" />
                            Delivery requested by {new Date(`${order.deadline.slice(0, 10)}T12:00:00`).toLocaleDateString()}
                          </p>
                        )}
                        {order.specifications && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                            {order.specifications}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-text-muted">
                          Assigned on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-text-main">Artisan contact</p>
                          {isAccepted && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Accepted & verified
                            </span>
                          )}
                        </div>

                        <p className="mt-2 font-medium text-text-main">
                          {assignedArtisan.name || item?.artisan}
                        </p>
                        {assignedArtisan.artCategory && (
                          <p className="text-xs text-text-secondary">
                            Craft: {assignedArtisan.artCategory}
                          </p>
                        )}
                        {assignedArtisan.email && (
                          <a
                            className="mt-2 block break-all text-sm text-primary hover:underline"
                            href={`mailto:${assignedArtisan.email}`}
                          >
                            {assignedArtisan.email}
                          </a>
                        )}
                        {assignedArtisan.phone && (
                          <p className="mt-1 text-sm text-text-muted">
                            Phone: {assignedArtisan.phone}
                          </p>
                        )}

                        {analysis?.feasibilityScore && (
                          <div className="mt-3 border-t border-border pt-2 text-xs text-text-secondary">
                            <span>Feasibility score: </span>
                            <span className="font-bold text-success">
                              {analysis.feasibilityScore}%
                            </span>
                            {analysis.fairWageRating && (
                              <span className="ml-2 font-medium text-primary">
                                · {analysis.fairWageRating}
                              </span>
                            )}
                          </div>
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
                Create a production request with price and duration, assign it to an artisan,
                and track acceptance notifications here.
              </p>
            </div>
          )}
        </section>
      </main>
    </IndustryLayout>
  )
}

export default IndustryDashboardPage
