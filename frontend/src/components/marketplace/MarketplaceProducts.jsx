import { ArrowRight, Filter, Heart, Sparkles, ShieldCheck, ShoppingBag } from 'lucide-react'
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
      {/* Category Filter Bar */}
      <div className="sticky top-[4.5rem] z-30 border-b border-border/80 bg-surface/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <nav
            aria-label="Craft categories"
            className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-sm font-medium"
          >
            <div className="flex shrink-0 items-center gap-1.5 pr-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <Filter className="h-3.5 w-3.5 text-secondary" />
              <span>Crafts</span>
            </div>
            {categories.map((category) => {
              const isActive = activeCategory === category
              return (
                <button
                  aria-pressed={isActive}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                    isActive
                      ? 'bg-primary text-white shadow-sm ring-1 ring-primary/20 scale-[1.02]'
                      : 'bg-surface-muted/60 text-text-secondary hover:bg-surface-muted hover:text-text-main hover:scale-105'
                  }`}
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  type="button"
                >
                  {category}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <section
        aria-labelledby="products-heading"
        className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pb-24 sm:pt-10"
        id="products"
      >
        {/* Header Strip with Controls */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              <Sparkles className="h-3 w-3" />
              <span>Handcrafted Treasures</span>
            </div>
            <h2
              className="mt-2 font-serif text-3xl font-bold tracking-tight text-text-main sm:text-4xl"
              id="products-heading"
            >
              {activeCategory === 'All crafts'
                ? 'Made by Hand, Found by You'
                : activeCategory}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Discover <span className="font-semibold text-text-main">{products.length}</span> verified handmade {products.length === 1 ? 'item' : 'items'} crafted with cultural heritage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-text-secondary transition hover:border-secondary hover:text-secondary hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              to="/#roles"
            >
              Meet the Artisans <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>

            {/* Sort Select */}
            <div className="relative">
              <label className="sr-only" htmlFor="marketplace-sort">
                Sort products
              </label>
              <select
                className="min-h-10 appearance-none rounded-xl border border-border bg-surface py-2 pl-3.5 pr-9 text-xs font-semibold text-text-secondary outline-none transition hover:border-border-strong hover:text-text-main focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                id="marketplace-sort"
                onChange={(event) => onSortOrderChange(event.target.value)}
                value={sortOrder}
              >
                <option value="featured">Sort: Featured Collection</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ArrowRight
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 rotate-90 -translate-y-1/2 text-text-muted"
              />
            </div>

            {/* Bag Button */}
            <Link
              aria-live="polite"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              title={`${bagCount} items in your bag`}
              to="/marketplace/order-summary"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Bag ({bagCount})</span>
            </Link>
          </div>
        </div>

        {/* Fair Wage Guarantee Badge */}
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-main">
                100% Direct Fair-Wage Settlement
              </p>
              <p className="text-xs text-text-muted">
                Every purchase sends transparent, verified earnings directly to traditional artisans via instant Razorpay settlement.
              </p>
            </div>
          </div>
          <Link
            to="/story-of-art"
            className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-primary hover:underline sm:self-center"
          >
            <span>Learn our craft mission</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.name}
                onAddToCart={onAddToBag}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border-strong bg-surface/50 px-6 py-20 text-center backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <Heart aria-hidden="true" className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-2xl font-bold text-text-main">
              No matching handcrafted finds
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
              Try adjusting your search query or reset filters to browse the entire collection of authentic artisan craft.
            </p>
            <button
              className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-primary-hover hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              onClick={onResetFilters}
              type="button"
            >
              Reset Filters & Show All
            </button>
          </div>
        )}
      </section>
    </>
  )
}

export default MarketplaceProducts
