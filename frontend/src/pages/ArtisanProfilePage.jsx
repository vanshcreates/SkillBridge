import { createElement, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bot,
  Sparkles,
  ArrowUpRight,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  Clock3,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MapPin,
  PackagePlus,
  Palette,
  Phone,
  Search,
  Store,
  Truck,
  UserRound,
  WalletCards,
  Edit3,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ArtisanLayout from '../components/layout/ArtisanLayout'
import ProfileImageControl from '../components/profile/ProfileImageControl'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getAccountHomePath } from '../utils/account-routing'
import {
  getArtisanShopApi,
  saveArtisanShopApi,
  getArtisanListingsApi,
  createArtisanListingApi,
  publishArtisanListingApi,
  getArtisanOrdersApi,
  updateArtisanOrderStatusApi,
  getArtisanCoursesApi,
  getArtisanPaymentsApi,
  updateArtisanProfileApi,
} from '../services/artisan-api'

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'arts', label: 'My Shop', icon: Store },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'profile', label: 'Profile Info', icon: UserRound },
  { id: 'payments', label: 'Payment History', icon: WalletCards },
]

const inputClass =
  'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25'

function getStatusStyle(status) {
  if (status === 'Rejected') return 'bg-red-50 text-error'
  if (status === 'Completed') return 'bg-green-50 text-success'
  if (status === 'Awaiting response') return 'bg-amber-50 text-warning'
  return 'bg-surface-muted text-secondary'
}

const ArtisanProfilePage = () => {
  const { currentUser, authenticate } = useAuthDialog()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [publishedCourseState, setPublishedCourseState] = useState({
    courses: [],
    error: '',
  })
  const { courses: expertCourses, error: publishedCourseError } =
    publishedCourseState
  const courses = expertCourses
  const [courseSearch, setCourseSearch] = useState('')
  const [courseCategory, setCourseCategory] = useState('All courses')
  const [shopFormOpen, setShopFormOpen] = useState(false)
  const [shopNotice, setShopNotice] = useState('')
  const [shopError, setShopError] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingNotice, setListingNotice] = useState('')
  const [listingError, setListingError] = useState(false)
  const [pricingInputs, setPricingInputs] = useState({
    materialCost: '',
    laborHours: '',
    packagingCost: '',
  })
  const [productImages, setProductImages] = useState([])
  const [productImagePreviews, setProductImagePreviews] = useState([])
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileNotice, setProfileNotice] = useState('')
  const [profileNoticeIsError, setProfileNoticeIsError] = useState(false)
  const [listingPrice, setListingPrice] = useState('')
  const [artisanOrders, setArtisanOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')
  const [orderNotice, setOrderNotice] = useState('')
  const [orderNoticeIsError, setOrderNoticeIsError] = useState(false)
  const [paymentsData, setPaymentsData] = useState(null)
  const [savedListingState, setSavedListingState] = useState({
    listings: [],
    error: '',
  })
  const { listings, error: listingStorageError } = savedListingState
  const [savedShopState, setSavedShopState] = useState({
    shop: null,
    error: '',
  })
  const { shop, error: shopStorageError } = savedShopState

  useEffect(() => {
    let isMounted = true

    getArtisanShopApi()
      .then((res) => {
        if (isMounted && res?.shop) {
          setSavedShopState({ shop: res.shop, error: '' })
        }
      })
      .catch((e) => console.warn('Artisan shop API:', e.message))

    getArtisanListingsApi()
      .then((res) => {
        if (isMounted && Array.isArray(res?.listings)) {
          setSavedListingState({ listings: res.listings, error: '' })
        }
      })
      .catch((e) => console.warn('Artisan listings API:', e.message))

    getArtisanOrdersApi()
      .then((res) => {
        if (isMounted && Array.isArray(res?.orders)) {
          setArtisanOrders(res.orders)
        }
      })
      .catch((e) => console.warn('Artisan orders API:', e.message))

    getArtisanCoursesApi()
      .then((res) => {
        if (isMounted && Array.isArray(res?.courses) && res.courses.length > 0) {
          setPublishedCourseState({ courses: res.courses, error: '' })
        }
      })
      .catch((e) => console.warn('Artisan courses API:', e.message))

    getArtisanPaymentsApi()
      .then((res) => {
        if (isMounted && res?.summary) {
          setPaymentsData(res)
        }
      })
      .catch((e) => console.warn('Artisan payments API:', e.message))

    return () => {
      isMounted = false
    }
  }, [currentUser])

  // Periodic poll to refresh backend orders for realtime new order notifications
  useEffect(() => {
    let isMounted = true
    const refreshOrders = () => {
      getArtisanOrdersApi()
        .then((res) => {
          if (isMounted && Array.isArray(res?.orders)) {
            setArtisanOrders(res.orders)
            setOrdersError('')
          }
        })
        .catch((e) => {
          console.warn('Backend orders poll:', e.message)
        })
    }

    refreshOrders()
    const intervalId = window.setInterval(refreshOrders, 4000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [currentUser])

  if (!currentUser) {
    return <Navigate replace to="/artisan/auth" />
  }
  if (currentUser.accountType !== 'artisan') {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }

  const activeSectionInfo = sections.find(
    (section) => section.id === activeSection,
  )
  const filteredCourses = courses.filter((course) => {
    const searchText = courseSearch.trim().toLowerCase()
    const matchesSearch =
      !searchText ||
      [
        course.title,
        course.description,
        course.category,
        course.instructor,
        course.expertise,
        course.level,
        ...course.lessons.map((lesson) =>
          typeof lesson === 'string' ? lesson : lesson.title,
        ),
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchText)
    const matchesCategory =
      courseCategory === 'All courses' || course.category === courseCategory

    return matchesSearch && matchesCategory
  })

  const handleSaveShop = async (event) => {
    event.preventDefault()
    setShopNotice('')
    setShopError(false)
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: formData.get('shopName'),
      category: formData.get('shopCategory'),
      location: formData.get('shopLocation'),
      description: formData.get('shopDescription'),
    }

    try {
      const res = await saveArtisanShopApi(payload)
      if (res?.shop) {
        setSavedShopState({ shop: res.shop, error: '' })
        setShopFormOpen(false)
        setShopNotice('Your shop details have been saved to your cloud profile.')
      } else {
        throw new Error(res?.message || 'Unable to save shop details.')
      }
    } catch (error) {
      setShopNotice(error.message || 'Unable to save your shop details.')
      setShopError(true)
    }
  }

  const handleOrderStatusChange = async (orderId, status) => {
    setOrderNotice('')
    setOrderNoticeIsError(false)
    try {
      const res = await updateArtisanOrderStatusApi(orderId, status)
      if (res?.success) {
        setArtisanOrders((orders) =>
          orders.map((order) =>
            order.id === orderId || order._id === orderId
              ? (res.order || { ...order, status })
              : order
          ),
        )
        if (status === 'Completed') {
          setOrderNotice(`Order ${orderId} marked Completed. The industry partner/customer has been notified to release payment.`)
        } else {
          setOrderNotice(`Order ${orderId} marked ${status.toLowerCase()}.`)
        }
      } else {
        throw new Error(res?.message || 'The order status could not be updated.')
      }
    } catch (error) {
      console.error('Unable to update artisan order.', error)
      setOrderNotice(error.message || 'The order status could not be updated.')
      setOrderNoticeIsError(true)
    }
  }

  const handleCreateListing = async (event) => {
    event.preventDefault()
    setListingNotice('')
    setListingError(false)
    if (!shop) {
      setListingNotice('Create your shop before adding products.')
      setListingError(true)
      return
    }
    const formElement = event.currentTarget
    const formData = new FormData(formElement)

    const payloadFormData = new FormData()
    payloadFormData.append('title', formData.get('title'))
    payloadFormData.append('category', formData.get('category'))
    payloadFormData.append('description', formData.get('description'))
    payloadFormData.append('price', formData.get('price'))
    payloadFormData.append('stock', formData.get('stock'))
    payloadFormData.append('materialCost', formData.get('materialCost') || 0)
    payloadFormData.append('laborHours', formData.get('laborHours') || 0)
    payloadFormData.append('packagingCost', formData.get('packagingCost') || 0)

    for (const file of productImages) {
      payloadFormData.append('images', file)
    }

    try {
      const res = await createArtisanListingApi(payloadFormData)
      if (res?.listing) {
        setSavedListingState((existingState) => ({
          listings: [res.listing, ...existingState.listings],
          error: '',
        }))
        setShowListingForm(false)
        setProductImages([])
        setProductImagePreviews([])
        setPricingInputs({
          materialCost: '',
          laborHours: '',
          packagingCost: '',
        })
        setListingPrice('')
        setListingNotice('Your product was saved as a draft. Publish it when it is ready for buyers.')
        formElement.reset()
      } else {
        throw new Error(res?.message || 'Unable to save this listing.')
      }
    } catch (error) {
      setListingNotice(error.message || 'Unable to save this listing.')
      setListingError(true)
    }
  }

  const handleProductImagesChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newFiles = [...productImages, ...files].slice(0, 8)
    setProductImages(newFiles)
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setProductImagePreviews(newPreviews)
  }

  const handleRemoveProductImage = (indexToRemove) => {
    const updatedFiles = productImages.filter((_, idx) => idx !== indexToRemove)
    setProductImages(updatedFiles)
    const updatedPreviews = updatedFiles.map((file) => URL.createObjectURL(file))
    setProductImagePreviews(updatedPreviews)
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setProfileNotice('')
    setProfileNoticeIsError(false)

    const formData = new FormData(event.currentTarget)
    const updatePayload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      artCategory: formData.get('artCategory'),
      experience: formData.get('experience'),
      hourlyRate: Number(formData.get('hourlyRate')) || 0,
      bio: formData.get('bio'),
    }

    try {
      const res = await updateArtisanProfileApi(updatePayload)
      if (res?.user) {
        authenticate(res.user)
      } else {
        authenticate({ ...currentUser, ...updatePayload })
      }
      setProfileNotice('Profile details updated successfully.')
      setProfileModalOpen(false)
    } catch {
      authenticate({ ...currentUser, ...updatePayload })
      setProfileNotice('Profile updated locally.')
      setProfileModalOpen(false)
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePublishListing = async (listingId) => {
    setListingNotice('')
    setListingError(false)
    try {
      const res = await publishArtisanListingApi(listingId)
      if (res?.listing) {
        setSavedListingState((state) => ({
          listings: state.listings.map((listing) =>
            (listing.id === listingId || listing._id === listingId) ? res.listing : listing,
          ),
          error: '',
        }))
        setListingNotice('Your product is now published in the marketplace.')
      } else {
        throw new Error(res?.message || 'Unable to publish this product.')
      }
    } catch (error) {
      console.error('Unable to publish product listing.', error)
      setListingNotice(error.message || 'Unable to publish this product.')
      setListingError(true)
    }
  }

  const artisanHourlyRate = Number(currentUser?.hourlyRate || 0)
  const productionCost =
    Number(pricingInputs.materialCost || 0) +
    Number(pricingInputs.laborHours || 0) * artisanHourlyRate +
    Number(pricingInputs.packagingCost || 0)
  const suggestedPriceRange =
    productionCost > 0
      ? [
          Math.ceil((productionCost * 1.2) / 10) * 10,
          Math.ceil((productionCost * 1.3) / 10) * 10,
        ]
      : null

  return (
    <ArtisanLayout>
      <main className="w-full px-4 py-6 sm:px-8 sm:py-9 lg:px-12">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="relative overflow-hidden bg-primary px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="absolute -right-12 -top-32 h-72 w-72 rounded-full border border-white/10" />
            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                  Artisan workspace
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <ProfileImageControl
                    className="border-2 border-white/60 bg-white/10 text-white"
                    size="hero"
                    user={currentUser}
                  />
                  <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
                    Good to see you, {currentUser.name}
                  </h1>
                </div>
                <p className="mt-2 text-sm text-white/75 sm:text-base">
                  Build your creative practice, learn from experts, and grow your shop.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Artisan account
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div>
              <p className="font-semibold text-text-main">
                {shop?.name || currentUser.artCategory || 'Your artisan profile'}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">
                {currentUser.experience || 'Add your craft experience'} · Artisan since{' '}
                {currentUser.createdAt
                  ? new Date(currentUser.createdAt).toLocaleDateString()
                  : 'today'}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={() => {
                setActiveSection('arts')
                setShopNotice('')
                if (shop) {
                  setShowListingForm(true)
                } else {
                  setShopFormOpen(true)
                }
              }}
              type="button"
            >
              <PackagePlus aria-hidden="true" className="h-4 w-4" />
              {shop ? 'Add a product' : 'Create your shop'}
            </button>
          </div>
        </section>

        <nav
          aria-label="Artisan workspace"
          className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface shadow-card"
        >
          <div className="flex min-w-max gap-1 p-2" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => {
              const isSelected = activeSection === id
              return (
                <button
                  aria-controls={`artisan-panel-${id}`}
                  aria-selected={isSelected}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-background hover:text-primary'
                  }`}
                  id={`artisan-tab-${id}`}
                  key={id}
                  onClick={() => setActiveSection(id)}
                  role="tab"
                  type="button"
                >
                  {createElement(Icon, {
                    'aria-hidden': true,
                    className: 'h-4 w-4',
                  })}
                  {label}
                </button>
              )
            })}
          </div>
        </nav>

        <section
          aria-labelledby={`artisan-tab-${activeSection}`}
          className="mt-5 min-h-80 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8"
          id={`artisan-panel-${activeSection}`}
          role="tabpanel"
          tabIndex={0}
        >
          <div className="mb-6">
            <p className="text-sm font-semibold text-secondary">ARTISAN WORKSPACE</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-text-main">
              {activeSectionInfo.label}
            </h2>
          </div>
          {listingStorageError && (
            <p
              className="mb-5 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
              role="alert"
            >
              {listingStorageError}
            </p>
          )}
          {shopStorageError && (
            <p
              className="mb-5 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
              role="alert"
            >
              {shopStorageError}
            </p>
          )}

          {activeSection === 'dashboard' && (
            <div>
              {/* Voice AI Assistant Banner */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary/30 bg-gradient-to-r from-secondary/10 via-surface to-primary/5 p-4 sm:p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-xs">
                    <Bot className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-text-main flex items-center gap-2">
                      <span>Operate with AI Voice Assistant</span>
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[0.65rem] font-bold text-secondary uppercase">
                        Hands-Free
                      </span>
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-relaxed">
                      Speak naturally in Punjabi, Hindi or English to check pending orders, add products, track earnings, or update prices.
                    </p>
                  </div>
                </div>

                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition active:scale-95 cursor-pointer"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-voice-assistant'))}
                  type="button"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Open Voice Assistant (ਬੋਲ ਕੇ ਕੰਮ ਕਰੋ)</span>
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'My product listings', value: listings.length, icon: Boxes },
                  {
                    label: 'Orders to fulfill',
                    value: artisanOrders.filter((order) =>
                      ['Awaiting response', 'Processing', 'Ready to ship', 'Shipped'].includes(order.status),
                    ).length,
                    icon: ClipboardList,
                  },
                  { label: 'Published courses', value: courses.length, icon: GraduationCap },
                  { label: 'Payments received', value: `₹${(paymentsData?.summary?.totalEarnings ?? 0).toLocaleString('en-IN')}`, icon: WalletCards },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    className="rounded-xl border border-border bg-background p-5"
                    key={label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-text-secondary">{label}</p>
                      {createElement(Icon, {
                        'aria-hidden': true,
                        className: 'h-5 w-5 text-secondary',
                      })}
                    </div>
                    <p className="mt-4 font-serif text-2xl font-semibold text-text-main">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-text-main">
                        {shop?.name || 'Create your shop'}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {shop
                          ? shop.description
                          : 'Set up your shop profile before adding products to your catalogue.'}
                      </p>
                    </div>
                    <button
                      className="text-sm font-semibold text-primary underline underline-offset-4"
                      onClick={() => {
                        setActiveSection('arts')
                        if (!shop) setShopFormOpen(true)
                      }}
                      type="button"
                    >
                      {shop ? 'Manage shop' : 'Set up shop'}
                    </button>
                  </div>
                  {!shop ? (
                    <button
                      className="mt-5 flex w-full flex-col items-center rounded-xl border border-dashed border-border-strong px-4 py-8 text-center transition hover:bg-surface"
                      onClick={() => {
                        setActiveSection('arts')
                        setShopFormOpen(true)
                      }}
                      type="button"
                    >
                      <Store aria-hidden="true" className="h-8 w-8 text-secondary" />
                      <span className="mt-3 font-semibold text-text-main">
                        Open your artisan shop
                      </span>
                      <span className="mt-1 text-sm text-text-muted">
                        Give your handmade business a name and a story
                      </span>
                    </button>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-text-muted">
                      <span>{shop.category}</span>
                      {shop.location && <span>{shop.location}</span>}
                      <span>{listings.length} product drafts</span>
                    </div>
                  )}
                </section>
                <section className="rounded-xl border border-border bg-surface-muted p-5 sm:p-6">
                  <p className="text-sm font-semibold text-secondary">NEXT STEP</p>
                  <h3 className="mt-2 font-serif text-xl font-semibold text-text-main">
                    Make your products shine
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    Learn a new technique from craft experts or build skills
                    for your creative practice.
                  </p>
                  <button
                    className="mt-5 inline-flex items-center gap-2 font-semibold text-primary"
                    onClick={() => setActiveSection('training')}
                    type="button"
                  >
                    Explore expert courses
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </section>
              </div>
            </div>
          )}

          {activeSection === 'training' && (
            <div>
              <div className="mb-6 rounded-xl bg-primary p-5 text-white sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                  Learn from craft experts
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">
                  Skills grow when they are shared.
                </h3>
                <p className="max-w-2xl leading-7 text-white/85">
                  Explore guided courses in traditional arts, materials, and
                  creative business skills.
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Search the course library or choose a craft area to find a good next lesson.
                </p>
              </div>

              {publishedCourseError && (
                <p
                  className="mb-5 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
                  role="alert"
                >
                  {publishedCourseError}
                </p>
              )}

              <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem]">
                <label className="relative block">
                  <span className="sr-only">Search courses and experts</span>
                  <Search
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    className="w-full rounded-lg border border-border bg-white py-3 pl-11 pr-4 text-text-main outline-none transition placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/25"
                    onChange={(event) => setCourseSearch(event.target.value)}
                    placeholder="Search courses, crafts, or experts"
                    type="search"
                    value={courseSearch}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Filter courses by category</span>
                  <select
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-text-main outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25"
                    onChange={(event) => setCourseCategory(event.target.value)}
                    value={courseCategory}
                  >
                    {['All courses', ...new Set(courses.map((course) => course.category))].map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-text-main">
                  {courseCategory === 'All courses' ? 'Course library' : courseCategory}
                </p>
                <span aria-live="polite" className="text-sm text-text-muted">
                  {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
                </span>
              </div>

              {filteredCourses.length ? (
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {filteredCourses.map((course) => {
                    const Icon = course.icon ?? GraduationCap
                  return (
                    <article
                      className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-background p-5 transition hover:border-border-strong"
                      key={course.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-muted">
                          {course.level}
                        </span>
                      </div>
                      <p className="mt-5 text-xs font-bold tracking-[0.12em] text-secondary">
                        {course.category}
                      </p>
                      <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-text-main">
                        {course.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">
                        {course.description}
                      </p>
                      <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface px-3 py-3">
                        <span
                          aria-hidden="true"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white"
                        >
                          {course.instructor
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text-main">
                            {course.instructor}
                          </p>
                          <p className="text-xs leading-5 text-text-muted">
                            {course.expertise}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 aria-hidden="true" className="h-4 w-4" />
                          {course.duration}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
                          {course.lessons.length} lessons
                        </span>
                      </div>
                      <Link
                        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                        to={`/artisan/courses/${encodeURIComponent(course.id)}`}
                      >
                        Open course
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </article>
                  )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
                  <Search aria-hidden="true" className="mx-auto h-8 w-8 text-secondary" />
                  <h3 className="mt-3 font-semibold text-text-main">
                    {courses.length ? 'No matching courses' : 'No courses published yet'}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {courses.length
                      ? 'Try another course title, craft, expert, or category.'
                      : 'Courses published by training experts will appear here.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'arts' && (
            <div>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <p className="max-w-2xl leading-7 text-text-secondary">
                  Create your shop identity first, then build its product catalogue.
                  Shop details and product drafts are saved on this device.
                </p>
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  onClick={() => {
                    if (shop) {
                      setListingNotice('')
                      setShowListingForm((isVisible) => !isVisible)
                    } else {
                      setShopNotice('')
                      setShopFormOpen(true)
                    }
                  }}
                  type="button"
                >
                  {shop
                    ? <PackagePlus aria-hidden="true" className="h-4 w-4" />
                    : <Store aria-hidden="true" className="h-4 w-4" />}
                  {shop
                    ? showListingForm ? 'Cancel' : 'Add a product'
                    : 'Create your shop'}
                </button>
              </div>

              {shopNotice && (
                <p
                  className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                    shopError
                      ? 'border-error/30 bg-red-50 text-error'
                      : 'border-success/30 bg-green-50 text-success'
                  }`}
                  role={shopError ? 'alert' : 'status'}
                >
                  {shopNotice}
                </p>
              )}

              {shop && !shopFormOpen && (
                <section className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-background p-5 sm:p-6">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                      <Store aria-hidden="true" className="h-4 w-4" />
                      Your artisan shop
                    </span>
                    <h3 className="mt-2 font-serif text-2xl font-semibold text-text-main">
                      {shop.name}
                    </h3>
                    <p className="mt-2 max-w-3xl leading-7 text-text-secondary">
                      {shop.description}
                    </p>
                    <p className="mt-3 text-sm text-text-muted">
                      {shop.category}{shop.location ? ` · ${shop.location}` : ''}
                    </p>
                  </div>
                  <button
                    className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-primary hover:bg-surface"
                    onClick={() => {
                      setShopNotice('')
                      setShopFormOpen(true)
                    }}
                    type="button"
                  >
                    Edit shop details
                  </button>
                </section>
              )}

              {!shop && !shopFormOpen && (
                <div className="mb-5 rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
                  <Store aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
                  <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                    Start with your shop
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                    Choose a name and introduce the work you make. You can add
                    products to your shop after setup.
                  </p>
                  <button
                    className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                    onClick={() => setShopFormOpen(true)}
                    type="button"
                  >
                    Set up my shop
                  </button>
                </div>
              )}

              {shopFormOpen && (
                <form
                  className="mb-5 grid gap-4 rounded-xl border border-border bg-background p-5 sm:grid-cols-2 sm:p-6"
                  onSubmit={handleSaveShop}
                >
                  <div className="sm:col-span-2">
                    <h3 className="font-serif text-xl font-semibold text-text-main">
                      {shop ? 'Edit your shop' : 'Create your artisan shop'}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      Give customers a first introduction to your craft and the
                      work they will find here.
                    </p>
                  </div>
                  <label className="text-sm font-medium text-text-main">
                    Shop name
                    <input
                      className={inputClass}
                      defaultValue={shop?.name ?? ''}
                      maxLength={70}
                      name="shopName"
                      placeholder="e.g. Harpreet's Phulkari Studio"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    Craft category
                    <input
                      className={inputClass}
                      defaultValue={shop?.category ?? currentUser.artCategory ?? ''}
                      maxLength={60}
                      name="shopCategory"
                      placeholder="Embroidery and Phulkari"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    Location <span className="font-normal text-text-muted">(optional)</span>
                    <input
                      className={inputClass}
                      defaultValue={shop?.location ?? ''}
                      maxLength={100}
                      name="shopLocation"
                      placeholder="City, region"
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    About your shop
                    <textarea
                      className={inputClass}
                      defaultValue={shop?.description ?? currentUser.bio ?? ''}
                      maxLength={500}
                      name="shopDescription"
                      placeholder="Share what you make, the materials you use, and what inspires your work"
                      required
                      rows="4"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3 sm:col-span-2">
                    <button
                      className="min-h-11 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-hover"
                      type="submit"
                    >
                      {shop ? 'Save shop details' : 'Create shop'}
                    </button>
                    {shop && (
                      <button
                        className="min-h-11 rounded-lg border border-border-strong px-5 py-2.5 font-semibold text-primary hover:bg-surface"
                        onClick={() => setShopFormOpen(false)}
                        type="button"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {listingNotice && (
                <p
                  className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                    listingError
                      ? 'border-error/30 bg-red-50 text-error'
                      : 'border-success/30 bg-green-50 text-success'
                  }`}
                  role={listingError ? 'alert' : 'status'}
                >
                  {listingNotice}
                </p>
              )}

              {shop && showListingForm && (
                <form
                  className="mb-5 grid gap-4 rounded-xl border border-border bg-background p-5 sm:grid-cols-2"
                  onSubmit={handleCreateListing}
                >
                  <h3 className="font-serif text-xl font-semibold text-text-main sm:col-span-2">
                    New product listing
                  </h3>
                  <label className="text-sm font-medium text-text-main">
                    Product name
                    <input className={inputClass} maxLength={100} name="title" placeholder="e.g. Handwoven table runner" required />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    Category
                    <input className={inputClass} defaultValue={shop?.category || currentUser.artCategory || ''} maxLength={60} name="category" placeholder="Product category" required />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    Your selling price (₹)
                    <input
                      className={inputClass}
                      min="1"
                      name="price"
                      onChange={(event) => setListingPrice(event.target.value)}
                      placeholder="1200"
                      required
                      type="number"
                      value={listingPrice}
                    />
                  </label>
                  <label className="text-sm font-medium text-text-main">
                    Available quantity
                    <input className={inputClass} min="0" name="stock" placeholder="1" required type="number" />
                  </label>
                  <fieldset className="rounded-lg border border-border bg-white p-4 sm:col-span-2">
                    <legend className="px-1 text-sm font-semibold text-text-main">
                      Cost-based price guide (optional)
                    </legend>
                    <p className="mb-3 text-xs leading-5 text-text-muted">
                      An editable estimate using your costs and a 20–30% allowance
                      for your time and business. This is not a market quote.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ['materialCost', 'Materials per item (₹)', '0.01'],
                        ['laborHours', 'Hours per item', '0.01'],
                        ['packagingCost', 'Packaging per item (₹)', '0.01'],
                      ].map(([name, label, step]) => (
                        <label className="text-xs font-medium text-text-secondary" key={name}>
                          {label}
                          <input
                            className={inputClass}
                            min="0"
                            name={name}
                            onChange={(event) =>
                              setPricingInputs((values) => ({
                                ...values,
                                [name]: event.target.value,
                              }))
                            }
                            placeholder="0"
                            step={step}
                            type="number"
                            value={pricingInputs[name]}
                          />
                        </label>
                      ))}
                    </div>
                    {suggestedPriceRange && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-muted p-3">
                        <p className="text-sm text-text-secondary">
                          Cost-based guide:{' '}
                          <strong className="text-text-main">
                            ₹{suggestedPriceRange[0].toLocaleString('en-IN')}–
                            ₹{suggestedPriceRange[1].toLocaleString('en-IN')}
                          </strong>
                        </p>
                        <button
                          className="rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white"
                          onClick={() => setListingPrice(String(suggestedPriceRange[0]))}
                          type="button"
                        >
                          Use lower estimate
                        </button>
                      </div>
                    )}
                  </fieldset>
                  <label className="text-sm font-medium text-text-main sm:col-span-2">
                    Product description
                    <textarea className={inputClass} maxLength={500} name="description" placeholder="Materials, process, size, and what makes it special" required rows="3" />
                  </label>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-main">
                      Product Images <span className="font-normal text-text-muted">(upload one or multiple)</span>
                    </label>
                    <p className="mt-1 text-xs text-text-muted">
                      Upload clear photos of your craft from different angles. JPG, PNG, or WebP.
                    </p>

                    <div className="mt-2.5">
                      {productImagePreviews.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-3">
                          {productImagePreviews.map((preview, idx) => (
                            <div
                              key={idx}
                              className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                            >
                              <img
                                alt={`Product preview ${idx + 1}`}
                                className="h-full w-full object-cover"
                                src={preview}
                              />
                              {idx === 0 && (
                                <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  Cover
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveProductImage(idx)}
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition hover:bg-error hover:opacity-100"
                                aria-label="Remove image"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-background p-5 text-center transition hover:border-secondary hover:bg-surface-muted">
                        <Upload className="h-6 w-6 text-secondary" />
                        <span className="mt-2 text-sm font-semibold text-text-main">
                          {productImagePreviews.length > 0
                            ? 'Add more photos'
                            : 'Click to select product images'}
                        </span>
                        <span className="mt-0.5 text-xs text-text-muted">
                          Choose one or multiple files
                        </span>
                        <input
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          multiple
                          onChange={handleProductImagesChange}
                          type="file"
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    className="min-h-11 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-hover sm:col-span-2"
                    type="submit"
                  >
                    Save as draft
                  </button>
                </form>
              )}

              {shop && listings.length ? (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[48rem] text-left text-sm">
                    <thead className="bg-background text-text-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold">Stock</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Marketplace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {listings.map((listing) => (
                        <tr key={listing.id}>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-text-main">{listing.title}</p>
                            <p className="mt-1 text-xs text-text-muted">{listing.category}</p>
                          </td>
                          <td className="px-4 py-4 text-text-secondary">
                            ₹{listing.price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 text-text-secondary">{listing.stock}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-secondary">
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {listing.status === 'Published' ? (
                              <span className="text-xs font-medium text-success">
                                Visible to buyers
                              </span>
                            ) : (
                              <button
                                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
                                onClick={() => handlePublishListing(listing.id)}
                                type="button"
                              >
                                Publish
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : shop ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
                  <Palette aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
                  <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                    Your shop is ready for its first product
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                    Add a draft with a product name, price, and description.
                    You can review your saved drafts here.
                  </p>
                  <button
                    className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                    onClick={() => setShowListingForm(true)}
                    type="button"
                  >
                    Add your first product
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {activeSection === 'orders' && (
            <div>
              <p className="mb-5 max-w-3xl leading-7 text-text-secondary">
                Review orders for your work, contact customers, and update
                fulfillment status as you prepare each order.
              </p>
              {orderNotice && (
                <p
                  className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                    orderNoticeIsError
                      ? 'border-error/30 bg-red-50 text-error'
                      : 'border-success/30 bg-green-50 text-success'
                  }`}
                  role={orderNoticeIsError ? 'alert' : 'status'}
                >
                  {orderNotice}
                </p>
              )}
              {ordersError && (
                <p
                  className="mb-4 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
                  role="alert"
                >
                  {ordersError}
                </p>
              )}
              {artisanOrders.length ? (
                <div className="space-y-5">
                  {artisanOrders.map((order) => {
                    const isAwaiting = order.status === 'Awaiting response'
                    const nextStatuses = {
                      Processing: ['Ready to ship', 'Completed'],
                      'Ready to ship': ['Shipped', 'Completed'],
                      Shipped: ['Completed'],
                    }[order.status] ?? []
                    const customer = order.customer
                    const deliveryAddress = [
                      customer.address,
                      [customer.city, customer.state].filter(Boolean).join(', '),
                      customer.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')
                    const artisanSubtotal = order.items.reduce(
                      (total, item) => total + item.price * item.quantity,
                      0,
                    )

                    return (
                      <article
                        className="overflow-hidden rounded-xl border border-border bg-background"
                        key={order.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4 sm:px-6">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                              Order reference
                            </p>
                            <h3 className="mt-1 font-semibold text-text-main">{order.id}</h3>
                            <p className="mt-1 text-sm text-text-secondary">
                              Placed{' '}
                              <time dateTime={order.createdAt}>
                                {new Date(order.createdAt).toLocaleString()}
                              </time>
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusStyle(order.status)}`}
                          >
                            <Clock3 aria-hidden="true" className="h-4 w-4" />
                            {order.status}
                          </span>
                        </div>

                        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
                          <div>
                            <h4 className="font-semibold text-text-main">Items in this order</h4>
                            <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface px-4">
                              {order.items.map((item) => (
                                <li
                                  className="flex flex-wrap justify-between gap-3 py-3"
                                  key={`${order.id}-${item.name}`}
                                >
                                  <div>
                                    <p className="font-medium text-text-main">{item.name}</p>
                                    <p className="mt-1 text-sm text-text-muted">
                                      {item.category} · Qty {item.quantity} · ₹
                                      {item.price.toLocaleString('en-IN')} each
                                    </p>
                                  </div>
                                  <p className="font-semibold text-text-main">
                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                  </p>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold text-text-main">
                              <span>Items subtotal</span>
                              <span>₹{artisanSubtotal.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="rounded-lg border border-border bg-surface p-4">
                            <h4 className="font-semibold text-text-main">
                              {order.source === 'industry'
                                ? 'Industry contact and delivery'
                                : 'Customer and delivery'}
                            </h4>
                            <div className="mt-3 space-y-2.5 text-sm text-text-secondary">
                              <p className="font-medium text-text-main">
                                {customer.fullName || 'Customer'}
                              </p>
                              {customer.email && (
                                <p className="flex items-start gap-2">
                                  <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                                  <a className="break-all hover:text-primary" href={`mailto:${customer.email}`}>
                                    {customer.email}
                                  </a>
                                </p>
                              )}
                              {customer.phone && (
                                <p className="flex items-center gap-2">
                                  <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-secondary" />
                                  <a className="hover:text-primary" href={`tel:${customer.phone}`}>
                                    {customer.phone}
                                  </a>
                                </p>
                              )}
                              {deliveryAddress && (
                                <p className="flex items-start gap-2">
                                  <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                                  <span>{deliveryAddress}</span>
                                </p>
                              )}
                              {customer.note && (
                                <p className="rounded-md bg-background p-3 leading-6">
                                  <span className="font-semibold text-text-main">
                                    {order.source === 'industry'
                                      ? 'Industry request: '
                                      : 'Customer note: '}
                                  </span>
                                  {customer.note}
                                </p>
                              )}
                              {!customer.fullName && !customer.email && !customer.phone && (
                                <p className="text-text-muted">
                                  Customer contact details are not available for this older order.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {order.status === 'Completed' && (
                          <div className="mx-5 mb-4 sm:mx-6 rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                            {order.paymentStatus === 'paid' ? (
                              <div className="flex items-center gap-2.5 text-success">
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                                <div>
                                  <p className="font-semibold">
                                    Payment Received: ₹{artisanSubtotal.toLocaleString('en-IN')}
                                  </p>
                                  <p className="text-xs text-text-muted">
                                    Paid via Razorpay {order.razorpayPaymentId ? `· Ref: ${order.razorpayPaymentId}` : ''}
                                    {order.paidAt && ` · ${new Date(order.paidAt).toLocaleString()}`}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5 text-amber-800">
                                <Clock3 className="h-5 w-5 shrink-0 text-amber-600" />
                                <div>
                                  <p className="font-semibold">
                                    Order Completed · Payment Pending from {order.source === 'industry' ? 'Industry Partner' : 'Customer'}
                                  </p>
                                  <p className="text-xs text-amber-700">
                                    The {order.source === 'industry' ? 'industry partner' : 'customer'} has been notified to release ₹{artisanSubtotal.toLocaleString('en-IN')}.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
                          <p className="text-xs leading-5 text-text-muted">
                            {order.status === 'Completed' && order.paymentStatus === 'paid'
                              ? 'Payment verified via Razorpay.'
                              : order.status === 'Completed'
                              ? 'Awaiting industry payment release via Razorpay.'
                              : 'Mark order as Completed when finished to enable payment release.'}
                          </p>
                          {isAwaiting && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-error/40 px-4 py-2 text-sm font-semibold text-error transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                                onClick={() => handleOrderStatusChange(order.id, 'Rejected')}
                                type="button"
                              >
                                <X aria-hidden="true" className="h-4 w-4" />
                                Reject order
                              </button>
                              <button
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
                                onClick={() => handleOrderStatusChange(order.id, 'Processing')}
                                type="button"
                              >
                                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                                Accept order
                              </button>
                            </div>
                          )}
                          {nextStatuses.length > 0 && (
                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary">
                              <Truck aria-hidden="true" className="h-4 w-4 text-secondary" />
                              Update status
                              <select
                                aria-label={`Update status for order ${order.id}`}
                                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/25"
                                onChange={(event) =>
                                  handleOrderStatusChange(order.id, event.target.value)
                                }
                                value={order.status}
                              >
                                {[order.status, ...nextStatuses].map(
                                  (status) => (
                                    <option key={status} value={status}>{status}</option>
                                  ),
                                )}
                              </select>
                            </label>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
                  <ClipboardList aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
                  <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                    No orders for your shop yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                    New customer requests for products listed under your artisan
                    name will appear here for review and fulfillment.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-border bg-background p-5 sm:col-span-2">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <ProfileImageControl size="large" user={currentUser} />
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-text-main">
                        Profile photo
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        Add a photo so people can recognize the artisan behind your work.
                        JPG, PNG, or WebP, up to 5 MB. Synced with your account.
                      </p>
                      <p className="mt-3 text-sm font-semibold text-primary">
                        Click your photo to view or change it.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(true)}
                    className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit profile
                  </button>
                </div>
              </section>

              {profileNotice && (
                <div
                  className={`rounded-xl border p-4 sm:col-span-2 ${
                    profileNoticeIsError
                      ? 'border-error/40 bg-red-50 text-error'
                      : 'border-success/40 bg-green-50 text-success'
                  }`}
                >
                  <p className="text-sm font-semibold">{profileNotice}</p>
                </div>
              )}
              {[
                { label: 'Full name', value: currentUser.name },
                { label: 'Email address', value: currentUser.email },
                { label: 'Phone number', value: currentUser.phone || 'Not provided' },
                { label: 'Craft category', value: currentUser.artCategory || 'Not provided' },
                { label: 'Experience', value: currentUser.experience || 'Not provided' },
                {
                  label: 'Hourly rate',
                  value: currentUser.hourlyRate ? `₹${currentUser.hourlyRate}/hr` : 'Not set',
                },
              ].map(({ label, value }) => (
                <div className="rounded-xl border border-border bg-background p-5" key={label}>
                  <p className="text-sm font-medium text-text-muted">{label}</p>
                  <p className="mt-2 font-semibold text-text-main">{value}</p>
                </div>
              ))}
              <div className="rounded-xl border border-border bg-background p-5 sm:col-span-2">
                <p className="text-sm font-medium text-text-muted">About your work</p>
                <p className="mt-2 leading-7 text-text-main">
                  {currentUser.bio || 'No description added yet.'}
                </p>
              </div>
              {profileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                  <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
                    <button
                      type="button"
                      onClick={() => setProfileModalOpen(false)}
                      className="absolute right-4 top-4 rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text-main"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h3 className="font-serif text-2xl font-bold text-text-main">
                      Edit Artisan Profile
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Update your artisan details, hourly rate, and crafts showcase.
                    </p>
                    <form className="mt-5 space-y-4" onSubmit={handleSaveProfile}>
                      <div>
                        <label className="block text-sm font-semibold text-text-main">Full Name</label>
                        <input
                          name="name"
                          defaultValue={currentUser.name || ''}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-main">Phone Number</label>
                        <input
                          name="phone"
                          defaultValue={currentUser.phone || ''}
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-text-main">Craft Category</label>
                          <input
                            name="artCategory"
                            defaultValue={currentUser.artCategory || ''}
                            placeholder="e.g. Pottery, Woodwork"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-text-main">Experience</label>
                          <input
                            name="experience"
                            defaultValue={currentUser.experience || ''}
                            placeholder="e.g. 5+ years"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-main">Hourly Rate (₹)</label>
                        <input
                          type="number"
                          name="hourlyRate"
                          min="0"
                          defaultValue={currentUser.hourlyRate || ''}
                          placeholder="e.g. 350"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-main">About Your Work (Bio)</label>
                        <textarea
                          name="bio"
                          rows="4"
                          defaultValue={currentUser.bio || ''}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setProfileModalOpen(false)}
                          className="rounded-lg border border-border-strong px-4 py-2 font-semibold text-text-main hover:bg-surface-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                          {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                          {profileSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'payments' && (
            <div>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-xl border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary">Total Earnings</p>
                  <p className="mt-2 font-serif text-2xl font-bold text-success">
                    ₹{(paymentsData?.summary?.totalEarnings ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">From fulfilled customer orders</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary">Pending Payouts</p>
                  <p className="mt-2 font-serif text-2xl font-bold text-secondary">
                    ₹{(paymentsData?.summary?.pendingPayout ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">In processing or in transit</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary">Orders Settled</p>
                  <p className="mt-2 font-serif text-2xl font-bold text-text-main">
                    {paymentsData?.summary?.payoutsCount ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Completed order settlements</p>
                </div>
              </div>

              {paymentsData?.payouts?.length ? (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead className="bg-background text-text-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Items</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paymentsData.payouts.map((p) => (
                        <tr key={p.orderId}>
                          <td className="px-4 py-3 font-medium text-text-main">{p.orderId}</td>
                          <td className="px-4 py-3 text-text-secondary">
                            {new Date(p.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{p.customerName}</td>
                          <td className="px-4 py-3 text-text-secondary">{p.itemsCount}</td>
                          <td className="px-4 py-3 font-semibold text-text-main">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              p.paymentStatus === 'Paid'
                                ? 'bg-green-50 text-success'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {p.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border-strong bg-background px-5 py-10 text-center">
                  <WalletCards aria-hidden="true" className="mx-auto h-9 w-9 text-secondary" />
                  <h3 className="mt-3 font-serif text-xl font-semibold text-text-main">
                    Your payouts will show here
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
                    As customers place orders and you mark them as completed, your earnings and payout breakdown will automatically appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </ArtisanLayout>
  )
}

export default ArtisanProfilePage
