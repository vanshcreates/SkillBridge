import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import { useCart } from '../hooks/useCart'
import { useAuthDialog } from '../hooks/useAuthDialog'
import content from '../data/local-storage.json'
import { getProductSlug } from '../utils/marketplace'
import {
  getPublishedArtisanListings,
  toMarketplaceProduct,
} from '../utils/artisan-storage'
import { getMarketplaceProductsApi } from '../services/marketplace-api'

const sampleProducts = content.marketplace.products
const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, items } = useCart()
  const { currentUser } = useAuthDialog()

  if (currentUser && currentUser.accountType !== 'customer') {
    if (currentUser.accountType === 'artisan') return <Navigate replace to="/artisan/profile" />
    if (currentUser.accountType === 'expert') return <Navigate replace to="/expert/dashboard" />
    if (currentUser.accountType === 'industry') return <Navigate replace to="/industry/dashboard" />
  }

  const isCustomer = currentUser && (currentUser.accountType ?? 'customer') === 'customer'
  const [backendProducts, setBackendProducts] = useState([])
  const [artisanProducts] = useState(() => {
    try {
      return getPublishedArtisanListings().map(toMarketplaceProduct)
    } catch (error) {
      console.error('Unable to load artisan product details.', error)
      return []
    }
  })

  useEffect(() => {
    getMarketplaceProductsApi()
      .then((res) => {
        if (res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setBackendProducts(res.products)
        }
      })
      .catch((err) => {
        console.warn('Backend marketplace fetch error (using local):', err.message)
      })
  }, [])

  const products = useMemo(
    () => [...sampleProducts, ...backendProducts, ...artisanProducts],
    [backendProducts, artisanProducts],
  )

  const product = products.find(
    (item) =>
      getProductSlug(item.name || item.title) === slug ||
      item.slug === slug ||
      String(item.id || item._id) === slug,
  )

  const cartQuantity =
    items.find((item) => item.name === product?.name)?.quantity ?? 0
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageUnavailable, setImageUnavailable] = useState(false)

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

  if (!product) {
    return (
      <MarketplaceLayout>
        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="font-serif text-3xl font-semibold text-text-main">
            Product not found
          </h1>
          <p className="mt-3 text-text-secondary">
            This listing may have moved. Browse the marketplace to find another craft.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
            to="/marketplace"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Browse marketplace
          </Link>
        </main>
      </MarketplaceLayout>
    )
  }

  const activeImage = allImages[selectedImageIndex] || allImages[0] || product.image
  const addSelectionToBag = () => addToCart(product, quantity)

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to marketplace
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Product Gallery Section */}
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-muted shadow-sm">
              {!activeImage || imageUnavailable ? (
                <div className="flex aspect-square items-center justify-center text-text-muted">
                  Product image unavailable
                </div>
              ) : (
                <img
                  alt={product.imageAlt || product.name}
                  className="aspect-square w-full object-cover transition duration-300"
                  onError={() => setImageUnavailable(true)}
                  src={activeImage}
                />
              )}

              {/* Navigation arrows for multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    aria-label="Previous product image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-text-main shadow-md backdrop-blur-sm transition hover:bg-white hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-text-main shadow-md backdrop-blur-sm transition hover:bg-white hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail carousel */}
            {allImages.length > 1 && (
              <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 pt-1">
                {allImages.map((imgUrl, index) => {
                  const isSelected = selectedImageIndex === index
                  return (
                    <button
                      aria-label={`Select product image ${index + 1}`}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 shadow-sm scale-105'
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
          </div>

          {/* Product Details & Actions */}
          <section className="flex flex-col items-start py-1">
            <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              {product.category}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-text-main sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Star aria-hidden="true" className="h-4 w-4 fill-accent text-accent" />
                {product.rating === 'New'
                  ? 'New artisan listing'
                  : `${product.rating} rating`}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4 text-secondary" />
                {product.location}
              </span>
            </div>

            <p className="mt-6 text-3xl font-semibold text-primary">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {product.stock === undefined
                ? 'Sample listing price · shipping shown at order summary'
                : `${product.stock} available · shipping shown at order summary`}
            </p>

            <div className="mt-7 w-full border-y border-border py-5">
              <p className="text-sm font-semibold text-text-main">
                Made by {product.artisan}
              </p>
              <p className="mt-2 leading-7 text-text-secondary">
                {product.description}
              </p>
              {product.craftTime && (
                <p className="mt-2 text-sm text-text-secondary">
                  <strong>Crafting time:</strong> {product.craftTime}
                </p>
              )}
              {product.dimensions && (
                <p className="mt-1 text-sm text-text-secondary">
                  <strong>Dimensions:</strong> {product.dimensions}
                </p>
              )}
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Each item celebrates skilled handmade work. Availability and
                delivery details will be confirmed by the artisan after your
                request.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 w-full">
              <div className="inline-flex h-12 items-center rounded-lg border border-border bg-surface">
                <button
                  aria-label="Decrease quantity"
                  className="inline-flex h-11 w-11 items-center justify-center text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  type="button"
                >
                  <Minus aria-hidden="true" className="h-4 w-4" />
                </button>
                <span aria-live="polite" className="min-w-8 text-center font-semibold">
                  {quantity}
                </span>
                <button
                  aria-label="Increase quantity"
                  className="inline-flex h-11 w-11 items-center justify-center text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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
                  <Plus aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-primary px-5 py-3 font-semibold text-primary transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  product.stock === 0 ||
                  (Number.isFinite(product.stock) && cartQuantity >= product.stock)
                }
                onClick={addSelectionToBag}
                type="button"
              >
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                {isCustomer ? 'Add to bag' : 'Log in to add'}
              </button>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                {isCustomer ? 'Order now' : 'Log in to order'}
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-text-muted">
              Demo order flow only. No payment is collected and the request is
              not sent to the artisan.
            </p>
          </section>
        </div>
      </main>
    </MarketplaceLayout>
  )
}

export default ProductDetail
