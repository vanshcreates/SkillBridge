import { useState } from 'react'
import { Heart, ImageOff, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProductSlug } from '../../utils/marketplace'
import { useAuthDialog } from '../../hooks/useAuthDialog'

const ProductCard = ({ product, onAddToCart }) => {
  const { currentUser } = useAuthDialog()
  const isCustomer = currentUser && (currentUser.accountType ?? 'customer') === 'customer'
  const [saved, setSaved] = useState(false)
  const [imageUnavailable, setImageUnavailable] = useState(false)
  const productUrl = `/marketplace/products/${getProductSlug(product.name)}`

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {!product.image || imageUnavailable ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
            <ImageOff aria-hidden="true" className="h-8 w-8" />
            <span className="text-sm">Product image unavailable</span>
          </div>
        ) : (
          <Link
            aria-label={`View details for ${product.name}`}
            className="block h-full"
            to={productUrl}
          >
          <img
            alt={product.imageAlt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageUnavailable(true)}
            src={product.image}
          />
          </Link>
        )}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-primary shadow-card">
            {product.badge}
          </span>
        )}
        <button
          aria-label={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          aria-pressed={saved}
          className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full shadow-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 ${
            saved
              ? 'bg-primary text-white'
              : 'bg-card/95 text-text-secondary hover:text-primary'
          }`}
          onClick={() => setSaved((current) => !current)}
          type="button"
        >
          <Heart aria-hidden="true" className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
            {product.category}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-text-secondary">
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-accent text-accent" />
            {product.rating}
          </span>
        </div>
        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-text-main">
          <Link className="hover:text-secondary focus-visible:outline-none focus-visible:underline" to={productUrl}>
          {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          By {product.artisan}
        </p>
        {Number.isFinite(product.stock) && (
          <p className="mt-1 text-xs font-medium text-text-muted">
            {product.stock > 0
              ? `${product.stock} available`
              : 'Currently out of stock'}
          </p>
        )}
        <p className="mt-3 flex-1 text-sm leading-6 text-text-secondary">
          {product.description}
        </p>
        <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">
          {product.location}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-serif text-xl font-semibold text-primary">
            ₹{product.price.toLocaleString('en-IN')}
          </p>
          <button
            aria-label={`Add ${product.name} to bag`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              product.stock === 0 ||
              (Number.isFinite(product.stock) &&
                product.cartQuantity >= product.stock)
            }
            onClick={() => onAddToCart(product)}
            title={
              product.stock === 0
                ? 'This product is out of stock'
                : product.cartQuantity >= product.stock
                  ? 'You have added all available items to your bag'
                  : undefined
            }
            type="button"
          >
            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            {product.stock === 0
              ? 'Out of stock'
              : Number.isFinite(product.stock) &&
                  product.cartQuantity >= product.stock
                ? 'All in bag'
                : isCustomer
                  ? 'Add to bag'
                  : 'Log in to add'}
          </button>
        </div>
        <Link
          className="mt-2 inline-flex min-h-9 items-center justify-center rounded-lg text-sm font-semibold text-primary underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to={productUrl}
        >
          View product details
        </Link>
      </div>
    </article>
  )
}

export default ProductCard
