import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, MapPin, Search, Sparkles, Store, UserCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import content from '../data/local-storage.json'
import { getProductSlug } from '../utils/marketplace'
import { getMarketplaceProductsApi } from '../services/marketplace-api'
import { getArtisansApi } from '../services/auth-api'

const sampleProducts = content.marketplace.products

function buildArtisans(products, registeredArtisans = []) {
  const artisans = new Map()

  // First seed from registered artisans
  for (const art of registeredArtisans) {
    const key = art.name.trim().toLowerCase()
    artisans.set(key, {
      name: art.name,
      location: [art.city, art.state].filter(Boolean).join(', ') || 'India',
      crafts: new Set(art.artCategory ? [art.artCategory] : []),
      products: [],
      avatar: art.avatar || '',
      experience: art.experience || '',
    })
  }

  // Then add product items
  for (const product of products) {
    const artisanName = product.artisan || product.artisanName || 'SkillBridge Artisan'
    const key = artisanName.trim().toLowerCase()
    const artisan = artisans.get(key) ?? {
      name: artisanName,
      location: product.location || 'India',
      crafts: new Set(),
      products: [],
    }
    if (product.category) artisan.crafts.add(product.category)
    artisan.products.push(product)
    artisans.set(key, artisan)
  }

  return [...artisans.values()]
    .map((artisan) => ({ ...artisan, crafts: [...artisan.crafts] }))
    .sort((first, second) => first.name.localeCompare(second.name))
}

const FindArtisansPage = () => {
  const [search, setSearch] = useState('')
  const [backendProducts, setBackendProducts] = useState([])
  const [backendArtisans, setBackendArtisans] = useState([])

  useEffect(() => {
    getMarketplaceProductsApi()
      .then((res) => {
        if (res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setBackendProducts(res.products)
        }
      })
      .catch((err) => console.warn('Marketplace products fetch error:', err.message))

    getArtisansApi()
      .then((artisans) => {
        if (Array.isArray(artisans) && artisans.length > 0) {
          setBackendArtisans(artisans)
        }
      })
      .catch((err) => console.warn('Artisans fetch error:', err.message))
  }, [])

  const allProducts = useMemo(
    () => (backendProducts.length > 0 ? backendProducts : sampleProducts),
    [backendProducts],
  )
  const artisans = useMemo(
    () => buildArtisans(allProducts, backendArtisans),
    [allProducts, backendArtisans],
  )
  const visibleArtisans = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return artisans

    return artisans.filter((artisan) =>
      [
        artisan.name,
        artisan.location,
        ...artisan.crafts,
        ...artisan.products.map((product) => product.name || product.title),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [artisans, search])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#432310] px-5 py-16 text-white sm:px-8 sm:py-24">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10 blur-2xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/10 blur-3xl" />
          
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>The People Behind the Craft</span>
            </div>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Find an Artisan. Discover Their Story.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Explore traditional makers and the cultural craft they sustain.
              Search by artisan name, village, state, or craft discipline.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-xl">
              <label className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 text-text-main shadow-xl backdrop-blur-md transition-all focus-within:ring-3 focus-within:ring-accent">
                <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-text-muted" />
                <span className="sr-only">Search artisans</span>
                <input
                  className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-text-muted text-text-main"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Try Phulkari, Jaipur, wood carving, or maker’s name…"
                  type="search"
                  value={search}
                />
                {search && (
                  <button
                    className="text-xs font-semibold text-text-muted hover:text-text-main"
                    onClick={() => setSearch('')}
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </label>
            </div>
          </div>
        </section>

        {/* Directory Section */}
        <section
          aria-labelledby="artisan-directory-heading"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">Directory</p>
              <h2
                className="mt-1 font-serif text-3xl font-bold tracking-tight text-text-main"
                id="artisan-directory-heading"
              >
                Artisan Makers & Workshops
              </h2>
            </div>
            <p aria-live="polite" className="text-xs font-semibold text-text-muted">
              Showing <span className="font-bold text-text-main">{visibleArtisans.length}</span> {visibleArtisans.length === 1 ? 'artisan' : 'artisans'}
            </p>
          </div>

          {visibleArtisans.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleArtisans.map((artisan) => {
                const featuredProduct = artisan.products[0]
                const productPath = featuredProduct?.name
                  ? `/marketplace/products/${getProductSlug(featuredProduct.name)}`
                  : null

                return (
                  <article
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-card-hover"
                    key={artisan.name}
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative h-56 w-full overflow-hidden bg-surface-muted">
                        {featuredProduct?.image ? (
                          <img
                            alt={featuredProduct.imageAlt || `${featuredProduct.name} by ${artisan.name}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            src={featuredProduct.image}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-surface-muted text-secondary">
                            <Store aria-hidden="true" className="h-12 w-12 stroke-1" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[0.68rem] font-bold text-primary shadow-xs backdrop-blur-md">
                          <UserCheck className="h-3 w-3 text-secondary" />
                          <span>Verified Artisan</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="font-serif text-xl font-bold text-text-main group-hover:text-primary transition-colors">
                          {artisan.name}
                        </h3>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                          <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>{artisan.location}</span>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {artisan.crafts.map((craft) => (
                            <span
                              className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-secondary"
                              key={craft}
                            >
                              {craft}
                            </span>
                          ))}
                        </div>

                        <p className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
                          <UsersRound aria-hidden="true" className="h-3.5 w-3.5" />
                          <span>
                            {artisan.products.length}{' '}
                            {artisan.products.length === 1 ? 'featured creation' : 'featured creations'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      {productPath ? (
                        <Link
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:bg-primary-hover hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                          to={productPath}
                        >
                          <span>Explore Creations</span>
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-text-secondary transition hover:bg-surface-muted hover:text-text-main"
                          to="/marketplace"
                        >
                          <span>Browse Marketplace</span>
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border-strong bg-surface/50 px-6 py-20 text-center backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Search aria-hidden="true" className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-2xl font-bold text-text-main">
                No Artisans Found
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
                Try searching with another craft term, city name, or clear your query to view the directory.
              </p>
              <button
                className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-primary-hover"
                onClick={() => setSearch('')}
                type="button"
              >
                Clear Search
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default FindArtisansPage
