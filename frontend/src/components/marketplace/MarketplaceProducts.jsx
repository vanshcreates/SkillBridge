import { ArrowRight, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../ui/ProductCard'

const MarketplaceProducts = ({
  categories,
  activeCategory,
  onCategoryChange,
  sortOrder,
  onSortOrderChange,
  products,
  bagCount,
  onAddToBag,
  onResetFilters,
}) => {
  return (
    <>
      <div className="border-b border-border bg-surface">
        <nav
          aria-label="Craft categories"
          className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 py-3 text-sm font-medium text-text-secondary sm:px-8"
        >
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className={`shrink-0 border-b-2 pb-1 transition ${
                activeCategory === category
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:border-border-strong hover:text-primary'
              }`}
              key={category}
              onClick={() => onCategoryChange(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </nav>
      </div>

      <section
        aria-labelledby="products-heading"
        className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-12"
        id="products"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-secondary">
              A little something special
            </p>
            <h2
              className="font-serif text-3xl font-semibold text-text-main"
              id="products-heading"
            >
              {activeCategory === 'All crafts'
                ? 'Made by hand, found by you'
                : activeCategory}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {products.length} {products.length === 1 ? 'find' : 'finds'} to explore
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-secondary transition hover:border-border-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              to="/#roles"
            >
              Meet the artisans <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <div className="relative">
              <label className="sr-only" htmlFor="marketplace-sort">
                Sort products
              </label>
              <select
                className="min-h-10 appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-secondary outline-none transition hover:border-border-strong focus-visible:ring-2 focus-visible:ring-secondary"
                id="marketplace-sort"
                onChange={(event) => onSortOrderChange(event.target.value)}
                value={sortOrder}
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
              </select>
              <ArrowRight
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 rotate-90 -translate-y-1/2 text-text-muted"
              />
            </div>
            <Link
              aria-live="polite"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              title={`${bagCount} items in your bag`}
              to="/marketplace/order-summary"
            >
              Bag ({bagCount})
            </Link>
          </div>
        </div>

        <p className="mb-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-muted">
          Some products are sample listings. Artisan-published products and
          order requests are saved in this browser only; no payment is collected.
        </p>

        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.name}
                onAddToCart={onAddToBag}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
            <Heart aria-hidden="true" className="mx-auto h-8 w-8 text-secondary" />
            <h3 className="mt-4 font-serif text-xl font-semibold text-text-main">
              No finds just yet
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Try another search or explore a different craft category.
            </p>
            <button
              className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={onResetFilters}
              type="button"
            >
              Show all crafts
            </button>
          </div>
        )}
      </section>
    </>
  )
}

export default MarketplaceProducts
