import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Compass,
  Globe,
  GraduationCap,
  Layers,
  LogIn,
  LogOut,
  ShoppingBag,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react'
import { useAuthDialog } from '../../hooks/useAuthDialog'
import { getAccountHomePath } from '../../utils/account-routing'
import { Button } from '../ui/Button'

const Nav = ({ variant = 'home', cartCount = 0, onItemClick }) => {
  const { openAuth, currentUser, logout } = useAuthDialog()
  const location = useLocation()
  const profilePath = getAccountHomePath(currentUser)

  const navLinkClass = (path) => {
    const isActive = location.pathname === path
    return `relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all rounded-xl ${
      isActive
        ? 'bg-white/15 text-white shadow-xs font-semibold'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    }`
  }

  if (variant === 'marketplace') {
    return (
      <nav
        aria-label="Marketplace navigation"
        className="flex flex-col gap-3 font-sans md:flex-row md:items-center md:gap-2"
      >
        <a
          className={navLinkClass('/marketplace#products')}
          href="#products"
          onClick={onItemClick}
        >
          <Compass className="h-4 w-4 text-accent-light" />
          <span>Browse Crafts</span>
        </a>

        <Link
          className={navLinkClass('/artisans')}
          onClick={onItemClick}
          to="/artisans"
        >
          <Briefcase className="h-4 w-4 text-accent-light" />
          <span>Find Artisans</span>
        </Link>

        <Link
          aria-label={`View order summary, ${cartCount} items in bag`}
          className="relative inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/15 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-accent/25 hover:border-accent"
          onClick={onItemClick}
          to="/marketplace/order-summary"
        >
          <ShoppingBag className="h-4 w-4 text-accent-light" />
          <span>Bag</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-primary">
            {cartCount}
          </span>
        </Link>

        <Link
          className={navLinkClass('/marketplace/orders')}
          onClick={onItemClick}
          to="/marketplace/orders"
        >
          <span>Orders</span>
        </Link>

        {currentUser ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 md:border-l md:border-white/15 md:pl-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              onClick={onItemClick}
              to={profilePath}
            >
              <User className="h-4 w-4 text-accent-light" />
              <span>
                {currentUser.accountType === 'artisan'
                  ? 'Artisan Profile'
                  : currentUser.accountType === 'expert'
                  ? 'Expert Studio'
                  : currentUser.accountType === 'industry'
                  ? 'Industry Workspace'
                  : 'My Profile'}
              </span>
            </Link>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                onItemClick?.()
                logout()
              }}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 md:border-l md:border-white/15 md:pl-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => {
                onItemClick?.()
                openAuth('login')
              }}
              type="button"
            >
              <LogIn className="h-4 w-4" />
              <span>Log in</span>
            </button>
            <Button
              className="text-xs px-4 py-2 font-semibold shadow-sm"
              onClick={() => {
                onItemClick?.()
                openAuth('signup')
              }}
              variant="accent"
            >
              Sign up
            </Button>
          </div>
        )}
      </nav>
    )
  }

  // Home / General Navigation
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col gap-3 font-sans md:flex-row md:items-center md:gap-1.5"
    >
      <Link
        className={navLinkClass('/marketplace')}
        onClick={onItemClick}
        to="/marketplace"
      >
        <ShoppingBag className="h-4 w-4 text-accent-light" />
        <span>Marketplace</span>
      </Link>

      <Link
        className={navLinkClass('/artisans')}
        onClick={onItemClick}
        to="/artisans"
      >
        <Compass className="h-4 w-4 text-accent-light" />
        <span>Find Artisans</span>
      </Link>

      <Link
        className={navLinkClass('/story-of-art')}
        onClick={onItemClick}
        to="/story-of-art"
      >
        <BookOpen className="h-4 w-4 text-accent-light" />
        <span>Story of Art</span>
      </Link>

      <Link
        className={navLinkClass('/#how-it-works')}
        onClick={onItemClick}
        to="/#how-it-works"
      >
        <GraduationCap className="h-4 w-4 text-accent-light" />
        <span>Learn Skills</span>
      </Link>

      <Link
        className={navLinkClass('/about-us')}
        onClick={onItemClick}
        to="/about-us"
      >
        <span>About</span>
      </Link>

      {currentUser ? (
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 md:border-l md:border-white/15 md:pl-2">
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-white/20"
            onClick={onItemClick}
            to={profilePath}
          >
            <UserCheck className="h-4 w-4 text-accent-light" />
            <span>
              {currentUser.accountType === 'artisan'
                ? 'Artisan Studio'
                : currentUser.accountType === 'industry'
                ? 'Industry Workspace'
                : currentUser.accountType === 'expert'
                ? 'Expert Dashboard'
                : 'My Profile'}
            </span>
          </Link>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => {
              onItemClick?.()
              logout()
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            <span className="md:sr-only">Log out</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 md:border-l md:border-white/15 md:pl-2">
          <button
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            onClick={() => {
              onItemClick?.()
              openAuth('login')
            }}
            type="button"
          >
            Login
          </button>
          <Button
            className="text-xs px-4 py-2 font-semibold shadow-sm"
            onClick={() => {
              onItemClick?.()
              openAuth('signup')
            }}
            variant="accent"
          >
            Get Started
          </Button>
        </div>
      )}
    </nav>
  )
}

export default Nav
