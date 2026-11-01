import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Compass,
  GraduationCap,
  LogIn,
  LogOut,
  ShoppingBag,
  User,
  UserCheck,
} from 'lucide-react'
import { useAuthDialog } from '../../hooks/useAuthDialog'
import { getAccountHomePath } from '../../utils/account-routing'
import { Button } from '../ui/Button'
import ArtisanSkillLoginModal from '../common/ArtisanSkillLoginModal'

const Nav = ({ variant = 'home', cartCount = 0, onItemClick }) => {
  const { openAuth, currentUser, logout } = useAuthDialog()
  const location = useLocation()
  const navigate = useNavigate()
  const profilePath = getAccountHomePath(currentUser)

  const [showSkillModal, setShowSkillModal] = useState(false)

  // Listen for global custom events to open artisan skill login from anywhere on the page
  useEffect(() => {
    const handleOpen = () => {
      if (currentUser?.accountType === 'artisan') {
        navigate('/artisan/profile?tab=training')
      } else {
        setShowSkillModal(true)
      }
    }
    window.addEventListener('open-artisan-skill-login', handleOpen)
    return () => window.removeEventListener('open-artisan-skill-login', handleOpen)
  }, [currentUser, navigate])

  const handleLearnSkillsClick = () => {
    onItemClick?.()
    if (currentUser?.accountType === 'artisan') {
      navigate('/artisan/profile?tab=training')
    } else {
      setShowSkillModal(true)
    }
  }

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
      <>
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
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
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
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white cursor-pointer"
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

        <ArtisanSkillLoginModal
          currentUser={currentUser}
          isOpen={showSkillModal}
          onClose={() => setShowSkillModal(false)}
        />
      </>
    )
  }

  // Home / General Navigation
  return (
    <>
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

        {/* Learn Skills Button: opens option to log in as artisan */}
        <button
          className={`${navLinkClass('/artisan/profile?tab=training')} cursor-pointer`}
          onClick={handleLearnSkillsClick}
          type="button"
        >
          <GraduationCap className="h-4 w-4 text-accent-light" />
          <span>Learn Skills</span>
        </button>

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
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
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
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white cursor-pointer"
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

      <ArtisanSkillLoginModal
        currentUser={currentUser}
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
      />
    </>
  )
}

export default Nav
