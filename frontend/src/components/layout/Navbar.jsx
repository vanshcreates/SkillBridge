import { Search } from 'lucide-react'
import Nav from './nav'

const Navbar = ({
  variant = 'home',
  searchValue = '',
  onSearchChange,
  cartCount = 0,
  showSearch = false,
}) => {
  const isMarketplace = variant === 'marketplace'

  return (
    <div
      className={
        isMarketplace
          ? 'bg-primary px-5 py-4 text-white sm:px-8'
          : 'mx-auto flex flex-col gap-3 px-5 py-4 font-serif bg-primary text-white sm:px-8 md:flex-row md:items-center md:justify-between'
      }
    >
      <div
        className={
          isMarketplace
            ? 'mx-auto flex max-w-7xl flex-wrap items-center gap-4 lg:flex-nowrap'
            : 'contents'
        }
      >
        <a
          className="w-fit rounded-sm font-serif text-2xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href={isMarketplace ? '/' : '#top'}
        >
          SkillBridge
          {isMarketplace && showSearch && (
            <span className="ml-2 font-sans text-sm font-normal text-white/70">
              / Marketplace
            </span>
          )}
        </a>
        {isMarketplace && (
          <form
            className="order-3 flex min-w-0 basis-full rounded-lg bg-white p-1 focus-within:ring-2 focus-within:ring-accent lg:order-none lg:mx-auto lg:basis-auto lg:flex-1 lg:max-w-lg"
            onSubmit={(event) => {
              event.preventDefault()
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
            role="search"
          >
            <label className="sr-only" htmlFor="marketplace-search">
              Search products, crafts, or artisans
            </label>
            <Search
              aria-hidden="true"
              className="ml-3 h-5 w- shrink-0 self-center text-text-muted"
            />
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-text-main outline-none placeholder:text-text-muted"
              id="marketplace-search"
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search products, crafts, or artisans"
              type="search"
              value={searchValue}
            />
            <button
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              type="submit"
            >
              Search
            </button>
          </form>
        )}
        <Nav cartCount={cartCount} variant={variant} />
      </div>
    </div>
  )
}

export default Navbar