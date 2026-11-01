import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Layers,
  MapPin,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  UserCheck,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import { useCart } from '../hooks/useCart'
import { useAuthDialog } from '../hooks/useAuthDialog'
import content from '../data/local-storage.json'
import { getProductSlug } from '../utils/marketplace'
import {
  getMarketplaceProductByIdApi,
  getMarketplaceProductsApi,
} from '../services/marketplace-api'

const sampleProducts = content.marketplace.products
const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, items } = useCart()
  const { currentUser } = useAuthDialog()

  const [backendProducts, setBackendProducts] = useState([])
  const [singleProduct, setSingleProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageUnavailable, setImageUnavailable] = useState(false)
  const [addedRecently, setAddedRecently] = useState(false)

  useEffect(() => {
    getMarketplaceProductByIdApi(slug)
      .then((res) => {
        if (res?.success && res.product) {
          setSingleProduct(res.product)
        }
      })
      .catch(() => {})

    getMarketplaceProductsApi()
      .then((res) => {
        if (res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setBackendProducts(res.products)
        }
      })
      .catch((err) => {
        console.warn('Backend marketplace fetch error:', err.message)
      })
  }, [slug])

  const products = useMemo(
    () => [
      ...(singleProduct ? [singleProduct] : []),
      ...backendProducts,
      ...sampleProducts,
    ],
    [singleProduct, backendProducts],
  )

  const product = products.find(
    (item) =>
      getProductSlug(item.name || item.title) === slug ||
      item.slug === slug ||
      String(item.id || item._id) === slug,
  )

  // Extract all images for the product (supports multiple images or single image)
  const allImages = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img) => typeof img === 'string' && img.trim() !== '')
    }
    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      return [product.image.trim()]
    }
    return []
  }, [product])

  // Reset selected image index when product changes
  useEffect(() => {
    setSelectedImageIndex(0)
    setImageUnavailable(false)
  }, [product])

  if (currentUser && currentUser.accountType !== 'customer') {
    if (currentUser.accountType === 'artisan') return <Navigate replace to="/artisan/profile" />
    if (currentUser.accountType === 'expert') return <Navigate replace to="/expert/dashboard" />
    if (currentUser.accountType === 'industry') return <Navigate replace to="/industry/dashboard" />
  }

  const isCustomer = currentUser && (currentUser.accountType ?? 'customer') === 'customer'
  const cartQuantity =
    items.find((item) => item.name === product?.name)?.quantity ?? 0

  if (!product) {
    return (
      <MarketplaceLayout>
        <main className="mx-auto max-w-3xl px-5 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold text-text-main">
            Product Not Found
          </h1>
          <p className="mt-3 text-text-secondary">
            This artisanal craft listing may have moved or is currently in custom commission.
          </p>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            to="/marketplace"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Return to Marketplace
          </Link>
        </main>
      </MarketplaceLayout>
    )
  }

  const activeImage = allImages[selectedImageIndex] || allImages[0] || product.image
  const addSelectionToBag = () => {
    addToCart(product, quantity)
    setAddedRecently(true)
    setTimeout(() => setAddedRecently(false), 2200)
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-text-muted">
          <Link
            className="inline-flex items-center gap-1.5 transition hover:text-primary"
            to="/marketplace"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Marketplace</span>
          </Link>
          <span>/</span>
          <span className="text-secondary font-semibold">{product.category}</span>
          <span>/</span>
          <span className="truncate max-w-[200px] text-text-secondary">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Product Gallery Section (col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-card group">
              {/* Category Pill Tag */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-xs backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-secondary" />
                <span>{product.category}</span>
              </div>

              {/* Main Image Container */}
              <div className="aspect-square w-full overflow-hidden bg-surface-muted/40 flex items-center justify-center">
                {!activeImage || imageUnavailable ? (
                  <div className="flex flex-col items-center justify-center text-text-muted p-8 text-center">
                    <ShoppingBag className="h-12 w-12 stroke-1 text-text-muted mb-2" />
                    <p className="text-sm">Artisan product photo loading or unavailable</p>
                  </div>
                ) : (
                  <img
                    alt={product.imageAlt || product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImageUnavailable(true)}
                    src={activeImage}
                  />
                )}
              </div>

              {/* Navigation arrows for multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    aria-label="Previous product image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-text-main shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => {
                      setImageUnavailable(false)
                      setSelectedImageIndex((prev) =>
                        prev > 0 ? prev - 1 : allImages.length - 1,
                      )
                    }}
                    type="button"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next product image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-text-main shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => {
                      setImageUnavailable(false)
                      setSelectedImageIndex((prev) =>
                        prev < allImages.length - 1 ? prev + 1 : 0,
                      )
                    }}
                    type="button"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {allImages.map((imgUrl, index) => {
                  const isSelected = selectedImageIndex === index
                  return (
                    <button
                      aria-label={`Select product image ${index + 1}`}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'border-primary ring-3 ring-primary/20 scale-105 shadow-sm'
                          : 'border-border opacity-70 hover:opacity-100 hover:border-text-secondary'
                      }`}
                      key={index}
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setImageUnavailable(false)
                      }}
                      type="button"
                    >
                      <img
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                        src={imgUrl}
                      />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Trust Pillars Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-surface/80 p-3.5 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-secondary" />
                <p className="mt-1.5 text-xs font-bold text-text-main">100% Handmade</p>
                <p className="text-[0.68rem] text-text-muted">Direct artisan craft</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 p-3.5 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 text-xs font-bold text-text-main">Direct Payouts</p>
                <p className="text-[0.68rem] text-text-muted">Fair wage guaranteed</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 p-3.5 text-center">
                <Truck className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-1.5 text-xs font-bold text-text-main">Eco Shipping</p>
                <p className="text-[0.68rem] text-text-muted">Safely packaged</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface/80 p-3.5 text-center">
                <UserCheck className="mx-auto h-5 w-5 text-success" />
                <p className="mt-1.5 text-xs font-bold text-text-main">Verified Maker</p>
                <p className="text-[0.68rem] text-text-muted">SkillBridge certified</p>
              </div>
            </div>
          </div>

          {/* Product Details & Actions (col-span-5) */}
          <section className="lg:col-span-5 flex flex-col justify-start">
            {/* Header info */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {product.rating === 'New' ? 'New Artisan Listing' : `${product.rating} Rating`}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-muted">
                  <MapPin className="h-3 w-3 text-secondary" />
                  {product.location}
                </span>
              </div>

              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                {product.name}
              </h1>

              {/* Price Display */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold tracking-tight text-primary">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs font-medium text-text-muted">
                  Inclusive of all taxes · Direct artisan settlement
                </span>
              </div>

              <p className="mt-1 text-xs text-text-muted">
                {product.stock === undefined
                  ? 'Limited edition handmade listing · Free shipping eligible over ₹1,000'
                  : `${product.stock} pieces available in artisan workshop`}
              </p>
            </div>

            {/* Artisan Creator Badge */}
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/80 bg-surface/70 p-4 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-serif font-bold text-lg">
                  {product.artisan ? product.artisan.charAt(0) : 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-text-main">
                      {product.artisan || 'Master Artisan'}
                    </span>
                    <ShieldCheck className="h-4 w-4 text-secondary" />
                  </div>
                  <p className="text-xs text-text-muted">Certified Traditional Craftsperson</p>
                </div>
              </div>
              <Link
                to="/find-artisans"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View artisan profile →
              </Link>
            </div>

            {/* Expert Evaluation Appraisal Card */}
            {(product.averageEvaluationRating > 0 || product.evaluationStatus === 'Evaluated') && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                      <Award className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        Certified Expert Appraisal
                      </p>
                      <p className="text-[11px] text-emerald-700">Evaluated by verified master craftspeople</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-serif text-xl font-bold text-emerald-800">
                      <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                      {(product.averageEvaluationRating || 0).toFixed(1)} <span className="text-xs font-normal text-emerald-700">/ 10</span>
                    </span>
                  </div>
                </div>

                {/* 5-Point Criteria Breakdown */}
                {product.evaluationCriteriaAverages && (
                  <div className="mt-3.5 space-y-2 text-xs">
                    {[
                      { label: 'Quality & Materials', val: product.evaluationCriteriaAverages.productQuality },
                      { label: 'Creativity & Originality', val: product.evaluationCriteriaAverages.creativityOriginality },
                      { label: 'Craftsmanship Technique', val: product.evaluationCriteriaAverages.craftsmanship },
                      { label: 'Design & Finishing', val: product.evaluationCriteriaAverages.designFinishing },
                      { label: 'Market Potential', val: product.evaluationCriteriaAverages.marketPotential },
                    ].filter((c) => c.val > 0).map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-text-secondary">{label}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-emerald-200 overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(val / 10) * 100}%` }} />
                          </div>
                          <span className="font-bold text-emerald-900 text-[11px]">{val.toFixed(1)}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {product.latestExpertFeedback && (
                  <p className="mt-3 border-t border-emerald-500/15 pt-2.5 text-xs italic text-emerald-900 leading-relaxed">
                    "{product.latestExpertFeedback}"
                  </p>
                )}
              </div>
            )}

            {/* Description & Specs */}
            <div className="mt-6 space-y-4 border-t border-border/70 pt-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  About This Craft
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {product.description}
                </p>
              </div>

              {(product.craftTime || product.dimensions) && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {product.craftTime && (
                    <div className="flex items-start gap-2 rounded-xl bg-surface-muted/60 p-3">
                      <Clock className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[0.68rem] font-bold uppercase text-text-muted">Crafting Time</p>
                        <p className="text-xs font-semibold text-text-main">{product.craftTime}</p>
                      </div>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex items-start gap-2 rounded-xl bg-surface-muted/60 p-3">
                      <Ruler className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[0.68rem] font-bold uppercase text-text-muted">Dimensions</p>
                        <p className="text-xs font-semibold text-text-main">{product.dimensions}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Purchase & Bag Actions */}
            <div className="mt-8 space-y-3.5 border-t border-border/70 pt-6">
              <div className="flex items-center gap-3">
                {/* Quantity Controls */}
                <div className="inline-flex h-12 items-center rounded-xl border border-border bg-surface px-1 shadow-xs">
                  <button
                    aria-label="Decrease quantity"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-muted hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    type="button"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span aria-live="polite" className="min-w-10 text-center font-bold text-sm text-text-main">
                    {quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-muted hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                    disabled={
                      Number.isFinite(product.stock) &&
                      quantity + cartQuantity >= product.stock
                    }
                    onClick={() =>
                      setQuantity((value) =>
                        Number.isFinite(product.stock)
                          ? Math.min(value + 1, product.stock - cartQuantity)
                          : value + 1,
                      )
                    }
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Bag */}
                <button
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-surface px-5 font-bold text-primary shadow-xs transition-all duration-200 hover:bg-primary/5 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    product.stock === 0 ||
                    (Number.isFinite(product.stock) && cartQuantity >= product.stock)
                  }
                  onClick={addSelectionToBag}
                  type="button"
                >
                  {addedRecently ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-success">Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      <span>{isCustomer ? 'Add to Bag' : 'Log in to Add'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Now (Immediate Checkout) */}
              <button
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover px-6 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  product.stock === 0 ||
                  (Number.isFinite(product.stock) && cartQuantity >= product.stock)
                }
                onClick={() => {
                  if (!isCustomer) {
                    addSelectionToBag()
                    return
                  }
                  addSelectionToBag()
                  navigate('/marketplace/order-summary')
                }}
                type="button"
              >
                <span>{isCustomer ? 'Proceed to Checkout (Order Now)' : 'Log in to Order'}</span>
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 text-[0.72rem] text-text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span>Encrypted checkout via Razorpay · Direct artisan wage escrow</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </MarketplaceLayout>
  )
}

export default ProductDetail
