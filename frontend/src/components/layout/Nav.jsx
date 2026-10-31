import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthDialog } from '../../hooks/useAuthDialog'
import { Button } from '../ui/Button'


const Nav = ({ variant = 'home', cartCount = 0 }) => {
  const { openAuth, currentUser, logout } = useAuthDialog()
  const profilePath =
    currentUser?.accountType === 'artisan'
      ? '/artisan/profile'
      : currentUser?.accountType === 'expert'
        ? '/expert/dashboard'
        : currentUser?.accountType === 'industry'
          ? '/industry/dashboard'
          : '/profile'

  if (variant === 'marketplace') {
    return (
      <nav
        aria-label="Marketplace navigation"
        className="flex flex-wrap items-center gap-x-4 gap-y-3 font-sans text-sm"
      >
        <a
          className="rounded-sm text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href="#products"
        >
          Browse products
        </a>
        <Link
          className="rounded-sm text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          to="/#roles"
        >
          For artisans
        </Link>
        <Link
          aria-label={`View order summary, ${cartCount} items in bag`}
          className="rounded-lg border border-white/40 px-3 py-2 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          to="/marketplace/order-summary"
        >
          Bag ({cartCount})
        </Link>
        <Link
          className="rounded-sm text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          to="/marketplace/orders"
        >
          Orders
        </Link>
        {currentUser ? (
          <>
            <Link
              className="rounded-lg border border-white/40 px-3 py-2 font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              to={profilePath}
            >
              {currentUser.accountType === 'artisan'
                ? 'Artisan profile'
                : currentUser.accountType === 'expert'
                  ? 'Expert studio'
                  : currentUser.accountType === 'industry'
                    ? 'Industry workspace'
                  : 'Profile'}
            </Link>
            <button
              className="rounded-sm text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={logout}
              type="button"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              className="rounded-sm text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => openAuth('login')}
              type="button"
            >
              Log in
            </button>
            <button
              className="rounded-lg bg-white px-3 py-2 font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              onClick={() => openAuth('signup')}
              type="button"
            >
              Sign up
            </button>
          </>
        )}
      
      </nav>
    )
  }

  return (
    <>
    <nav className="flex min-w-0 w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-primary px-2 py-2 font-sans text-white md:w-auto md:flex-1 md:justify-end">

        <a>Find Artisans</a>
        <a>Story of Art</a>
        <a>Learn Skills</a>
        <a>About Us</a>
        <label htmlFor="language">Language:</label>
        <select name="language" id="language" className='bg-primary text-white border-none outline-none'>
          <option defaultChecked value="en">English</option>
          <option value="pun">Punjabi</option>
          <option value="hin">Hindi</option>
        </select>
        {currentUser ? (
          <>
            <Link
              className="rounded-lg border border-white/60 px-4 py-2 font-semibold text-white transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              to={profilePath}
            >
              Profile
            </Link>
            <Button onClick={logout}>Log out</Button>
          </>
        ) : (
          <>
            <Button onClick={() => openAuth('signup')}>Signup</Button>
            <Button onClick={() => openAuth('login')}>Login</Button>
          </>
        )}
</nav>
    </>
  )
}

export default Nav