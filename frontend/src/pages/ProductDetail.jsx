import { useState } from 'react'
import { ArrowLeft, MapPin, Minus, Plus, ShoppingBag, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import { useCart } from '../hooks/useCart'
import { useAuthDialog } from '../hooks/useAuthDialog'
import content from '../data/local-storage.json'
import { getProductSlug } from '../utils/marketplace'
import {
  getPublishedArtisanListings,
  toMarketplaceProduct,
} from '../utils/artisan-storage'

const sampleProducts = content.marketplace.products
const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, items } = useCart()
  const { currentUser } = useAuthDialog()
  const isCustomer = currentUser && (currentUser.accountType ?? 'customer') === 'customer'
  const [artisanProducts] = useState(() => {
    try {
      return getPublishedArtisanListings().map(toMarketplaceProduct)
    } catch (error) {
      console.error('Unable to load artisan product details.', error)
      return []
    }
  })
  const products = [...sampleProducts, ...artisanProducts]
  const product = products.find((item) => getProductSlug(item.name) === slug)
  const cartQuantity =
    items.find((item) => item.name === product?.name)?.quantity ?? 0
  const [quantity, setQuantity] = useState(1)
  const [imageUnavailable, setImageUnavailable] = useState(false)

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
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-muted">
            {!product.image || imageUnavailable ? (
              <div className="flex aspect-square items-center justify-center text-text-muted">
                Product image unavailable
              </div>
            ) : (
              <img
                alt={product.imageAlt}
                className="aspect-square w-full object-cover"
                onError={() => setImageUnavailable(true)}
                src={product.image}
              />
            )}
          </div>

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
                  : `${product.rating} sample rating`}
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
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Each item celebrates skilled handmade work. Availability and
                delivery details will be confirmed by the artisan after your
                request.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
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
                onClick={addSelectionToBag}
                disabled={
                  product.stock === 0 ||
                  (Number.isFinite(product.stock) && cartQuantity >= product.stock)
                }
                type="button"
              >
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                {isCustomer ? 'Add to bag' : 'Log in to add'}
              </button>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!isCustomer) {
                    addSelectionToBag()
                    return
                  }
                  addSelectionToBag()
                  navigate('/marketplace/order-summary')
                }}
                disabled={
                  product.stock === 0 ||
                  (Number.isFinite(product.stock) && cartQuantity >= product.stock)
                }
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
