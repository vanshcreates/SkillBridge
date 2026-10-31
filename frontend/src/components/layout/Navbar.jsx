import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import Nav from './nav'

const Navbar = ({
  variant = 'home',
  searchValue = '',
  onSearchChange,
  cartCount = 0,
  showSearch = false,
}) => {
  const isMarketplace = variant === 'marketplace'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-primary/95 shadow-md backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
            to="/"
          >
         
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-accent-light">
                SkillBridge
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-white/60 sm:inline">
                Ethical Craft Platform
              </span>
            </div>
          </Link>

          {isMarketplace && showSearch && (
            <span className="hidden rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 md:inline-flex">
              Marketplace
            </span>
          )}
        </div>

        {/* Marketplace Embedded Search Bar */}
        {isMarketplace && (
          <form
            className="hidden flex-1 max-w-md mx-4 lg:flex items-center rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm transition-all focus-within:border-accent focus-within:bg-white focus-within:text-text-main focus-within:shadow-md"
            onSubmit={(event) => {
              event.preventDefault()
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
            role="search"
          >
            <Search className="h-4 w-4 shrink-0 text-white/70 transition-colors group-focus-within:text-secondary" />
            <input
              aria-label="Search products, crafts, or artisans"
              className="w-full bg-transparent px-3 py-1 text-sm text-white placeholder:text-white/60 outline-none focus:text-text-main focus:placeholder:text-text-muted"
              id="marketplace-search"
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search handcrafted items, crafts, or makers…"
              type="search"
              value={searchValue}
            />
            {searchValue && (
              <button
                aria-label="Clear search"
                className="rounded-full p-1 text-white/60 hover:text-white focus:text-text-main"
                onClick={() => onSearchChange?.('')}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <Nav cartCount={cartCount} variant={variant} />
        </div>

        {/* Mobile Menu Toggle & Cart Icon Button */}
        <div className="flex items-center gap-2 md:hidden">
          {variant === 'marketplace' && (
            <Link
              aria-label={`View bag with ${cartCount} items`}
              className="relative rounded-lg p-2 text-white hover:bg-white/10"
              to="/marketplace/order-summary"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <button
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Input when in Marketplace */}
      {isMarketplace && (
        <div className="border-t border-white/10 bg-primary/95 px-4 py-2.5 lg:hidden">
          <form
            className="flex items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-white focus-within:bg-white focus-within:text-text-main"
            onSubmit={(event) => {
              event.preventDefault()
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Search className="h-4 w-4 shrink-0 text-white/70" />
            <input
              className="w-full bg-transparent px-2.5 py-1 text-xs text-white placeholder:text-white/60 outline-none focus:text-text-main focus:placeholder:text-text-muted"
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search crafts or artisans…"
              type="search"
              value={searchValue}
            />
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-primary/98 px-5 py-6 backdrop-blur-2xl md:hidden">
          <Nav
            cartCount={cartCount}
            onItemClick={() => setMobileMenuOpen(false)}
            variant={variant}
          />
        </div>
      )}
    </header>
  )
}

export default Navbar
