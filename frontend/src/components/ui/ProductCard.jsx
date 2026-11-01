import { useState } from 'react'
import { Award, Check, Heart, ImageOff, ShoppingBag, Sparkles, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProductSlug } from '../../utils/marketplace'
import { useAuthDialog } from '../../hooks/useAuthDialog'

const ProductCard = ({ product, onAddToCart }) => {
  const { currentUser } = useAuthDialog()
  const isCustomer = currentUser && (currentUser.accountType ?? 'customer') === 'customer'
  const isAnotherAccountType = currentUser && !isCustomer
  const [saved, setSaved] = useState(false)
  const [imageUnavailable, setImageUnavailable] = useState(false)
  const [isJustAdded, setIsJustAdded] = useState(false)
  const productUrl = `/marketplace/products/${getProductSlug(product.name)}`

  const handleAdd = () => {
    onAddToCart(product)
    setIsJustAdded(true)
    setTimeout(() => setIsJustAdded(false), 1400)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-secondary/40 hover:shadow-card-hover">
      {/* Product Image Stage */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {!product.image || imageUnavailable ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
            <ImageOff aria-hidden="true" className="h-8 w-8 text-secondary/40" />
            <span className="text-xs font-medium">Handcrafted piece photo pending</span>
          </div>
        ) : (
          <Link
            aria-label={`View details for ${product.name}`}
            className="block h-full overflow-hidden"
            to={productUrl}
          >
            <img
              alt={product.imageAlt}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              loading="lazy"
              onError={() => setImageUnavailable(true)}
              src={product.image}
            />
          </Link>
        )}

        {/* Heritage / Featured Badge */}
        {product.badge && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-card/95 px-3 py-1 text-xs font-bold text-primary shadow-xs backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-secondary" />
            {product.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          aria-label={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          aria-pressed={saved}
          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
            saved
              ? 'bg-primary text-white'
              : 'bg-card/90 text-text-secondary hover:text-primary hover:bg-white'
          }`}
          onClick={() => setSaved((current) => !current)}
          type="button"
        >
          <Heart aria-hidden="true" className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            {product.category}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-text-main">
            <Star aria-hidden="true" className="h-3 w-3 fill-accent text-accent" />
            {product.rating}
          </span>
        </div>

        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-text-main group-hover:text-primary transition-colors">
          <Link className="hover:text-secondary focus-visible:outline-none focus-visible:underline" to={productUrl}>
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-xs font-medium text-text-muted">
          Crafted by <span className="font-semibold text-text-secondary">{product.artisan}</span>
        </p>

        {Number.isFinite(product.stock) && (
          <p className="mt-1 text-xs font-medium">
            {product.stock > 0 ? (
              <span className="text-success font-medium">● {product.stock} in stock</span>
            ) : (
              <span className="text-error font-medium">○ Made to order</span>
            )}
          </p>
        )}

        <p className="mt-2.5 flex-1 text-xs leading-5 text-text-secondary line-clamp-2">
          {product.description}
        </p>

        <p className="mt-3 border-t border-border/70 pt-2.5 text-[11px] text-text-muted">
          📍 {product.location}
        </p>

        {/* Price & Add to Bag CTA */}
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Direct Price</p>
            <p className="font-serif text-xl font-bold text-primary">
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          </div>

          <button
            aria-label={`Add ${product.name} to bag`}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              isJustAdded
                ? 'bg-success text-white'
                : 'bg-primary text-white hover:bg-primary-hover hover:shadow-card'
            }`}
            disabled={
              isAnotherAccountType ||
              product.stock === 0 ||
              (Number.isFinite(product.stock) &&
                product.cartQuantity >= product.stock)
            }
            onClick={handleAdd}
            title={
              product.stock === 0
                ? 'This product is out of stock'
                : isAnotherAccountType
                  ? 'Log out before switching to a customer account'
                : product.cartQuantity >= product.stock
                  ? 'You have added all available items to your bag'
                  : undefined
            }
            type="button"
          >
            {isJustAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                <span>
                  {product.stock === 0
                    ? 'Out of stock'
                    : isAnotherAccountType
                      ? 'Customer only'
                    : Number.isFinite(product.stock) &&
                        product.cartQuantity >= product.stock
                      ? 'All in bag'
                      : isCustomer
                        ? 'Add to bag'
                        : 'Log in to add'}
                </span>
              </>
            )}
          </button>
        </div>

        <Link
          className="mt-2.5 text-center text-xs font-semibold text-secondary hover:text-primary transition-colors focus-visible:outline-none"
          to={productUrl}
        >
          View craft details →
        </Link>
      </div>
    </article>
  )
}

export default ProductCard
