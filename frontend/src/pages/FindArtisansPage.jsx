import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, MapPin, Search, Store, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import content from '../data/local-storage.json'
import { getProductSlug } from '../utils/marketplace'
import {
  getPublishedArtisanListings,
  toMarketplaceProduct,
} from '../utils/artisan-storage'

const sampleProducts = content.marketplace.products

function readArtisanProducts() {
  try {
    return {
      products: getPublishedArtisanListings().map(toMarketplaceProduct),
      error: '',
    }
  } catch (error) {
    console.error('Unable to load artisan directory listings.', error)
    return {
      products: [],
      error: error.message || 'Artisan listings could not be loaded.',
    }
  }
}

function buildArtisans(products) {
  const artisans = new Map()

  for (const product of products) {
    const key = product.artisan.trim().toLowerCase()
    const artisan = artisans.get(key) ?? {
      name: product.artisan,
      location: product.location,
      crafts: new Set(),
      products: [],
    }
    artisan.crafts.add(product.category)
    artisan.products.push(product)
    artisans.set(key, artisan)
  }

  return [...artisans.values()]
    .map((artisan) => ({ ...artisan, crafts: [...artisan.crafts] }))
    .sort((first, second) => first.name.localeCompare(second.name))
}

const FindArtisansPage = () => {
  const [search, setSearch] = useState('')
  const [artisanProductState, setArtisanProductState] = useState(readArtisanProducts)
  const artisans = useMemo(
    () => buildArtisans([...sampleProducts, ...artisanProductState.products]),
    [artisanProductState.products],
  )
  const visibleArtisans = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return artisans

    return artisans.filter((artisan) =>
      [
        artisan.name,
        artisan.location,
        ...artisan.crafts,
        ...artisan.products.map((product) => product.name),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [artisans, search])

  useEffect(() => {
    const refreshListings = () => setArtisanProductState(readArtisanProducts())
    window.addEventListener('storage', refreshListings)
    return () => window.removeEventListener('storage', refreshListings)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="bg-primary px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              The people behind the craft
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Find an artisan. Discover a story.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              Explore makers and the handmade work they bring into the world.
              Search by name, place, craft, or product.
            </p>
            <label className="mt-8 flex max-w-xl items-center gap-3 rounded-xl bg-white px-4 py-2 text-text-main focus-within:ring-2 focus-within:ring-accent">
              <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-text-muted" />
              <span className="sr-only">Search artisans</span>
              <input
                className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-text-muted"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try embroidery, Jaipur, or a maker’s name"
                type="search"
                value={search}
              />
            </label>
          </div>
        </section>

        <section
          aria-labelledby="artisan-directory-heading"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-secondary">Meet the makers</p>
              <h2
                className="mt-2 font-serif text-3xl font-semibold text-text-main"
                id="artisan-directory-heading"
              >
                Artisans and their work
              </h2>
            </div>
            <p aria-live="polite" className="text-sm text-text-muted">
              {visibleArtisans.length} {visibleArtisans.length === 1 ? 'artisan' : 'artisans'}
            </p>
          </div>

          {artisanProductState.error && (
            <p
              className="mb-6 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
              role="alert"
            >
              {artisanProductState.error}
            </p>
          )}

          {visibleArtisans.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleArtisans.map((artisan) => {
                const featuredProduct = artisan.products[0]
                const productPath = `/marketplace/products/${getProductSlug(featuredProduct.name)}`

                return (
                  <article
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
                    key={artisan.name}
                  >
                    {featuredProduct.image ? (
                      <img
                        alt={featuredProduct.imageAlt || `${featuredProduct.name} by ${artisan.name}`}
                        className="h-52 w-full object-cover"
                        loading="lazy"
                        src={featuredProduct.image}
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-surface-muted text-secondary">
                        <Store aria-hidden="true" className="h-12 w-12" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-xl font-semibold text-text-main">
                        {artisan.name}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                        <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                        {artisan.location}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-text-secondary">
                        {artisan.crafts.join(' · ')}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-text-muted">
                        <UsersRound aria-hidden="true" className="h-4 w-4" />
                        {artisan.products.length}{' '}
                        {artisan.products.length === 1 ? 'featured work' : 'featured works'}
                      </p>
                      <Link
                        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                        to={productPath}
                      >
                        Explore their work
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
              <Search aria-hidden="true" className="mx-auto h-8 w-8 text-secondary" />
              <h3 className="mt-4 font-serif text-xl font-semibold text-text-main">
                No artisans found
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Try another name, place, or craft.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default FindArtisansPage
