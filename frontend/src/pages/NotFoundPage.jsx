import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="border-b border-border bg-surface px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          className="rounded-sm font-serif text-2xl font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/"
        >
          SkillBridge
        </Link>
        <Link
          className="rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to="/marketplace"
        >
          Browse marketplace
        </Link>
      </div>
    </header>

    <main
      aria-labelledby="not-found-heading"
      className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8"
    >
      <section className="w-full max-w-xl text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted text-secondary">
          <Compass aria-hidden="true" className="h-8 w-8" />
        </span>
        <p className="mt-7 font-serif text-7xl font-semibold leading-none text-primary sm:text-8xl">
          404
        </p>
        <h1
          className="mt-5 font-serif text-3xl font-semibold text-text-main sm:text-4xl"
          id="not-found-heading"
        >
          We can’t find that page
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-text-secondary">
          The page may have moved, or the link may be incorrect. Let’s get you
          back to discovering handmade work and new opportunities.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            to="/"
          >
            Go to homepage
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-5 py-3 font-semibold text-text-main transition hover:border-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            to="/marketplace"
          >
            Explore the marketplace
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>

    <Footer />
  </div>
)

export default NotFoundPage
