import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import FeaturedCraftCarousel from '../components/marketplace/FeaturedCraftCarousel'
import MarketplaceProducts from '../components/marketplace/MarketplaceProducts'
import { useCart } from '../hooks/useCart'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getMarketplaceProductsApi } from '../services/marketplace-api'
import content from '../data/local-storage.json'

const { products: sampleProducts, categories: sampleCategories } = content.marketplace
const featuredProducts = sampleProducts.slice(0, 3).map((product, index) => ({
  ...product,
  image: [
    '/images/marketplace-embroidered-textile.jpg',
    '/images/marketplace-crochet-flower.jpg',
    '/images/marketplace-handwoven-sweater.jpg',
  ][index],
  imageAlt: [
    'Colorful embroidered fabric with detailed floral patterns',
    'Hand-crocheted flower square in cream, green, and yellow yarn',
    'Artisan wearing a colorful handwoven sweater',
  ][index],
}))

const Marketplace = () => {
  const { currentUser, openAuth } = useAuthDialog()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All crafts')
  const [sortOrder, setSortOrder] = useState('featured')
  const [backendProducts, setBackendProducts] = useState([])
  const { addToCart, itemCount, items } = useCart()

  // Fetch backend marketplace products on mount
  useEffect(() => {
    getMarketplaceProductsApi()
      .then((res) => {
        if (res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setBackendProducts(res.products)
        }
      })
      .catch((err) => {
        console.warn('Backend marketplace fetch error:', err.message)
      })
  }, [])

  const products = useMemo(
    () => (backendProducts.length > 0 ? backendProducts : sampleProducts),
    [backendProducts],
  )
  const categories = useMemo(
    () => [
      ...sampleCategories,
      ...new Set(
        backendProducts
          .map((product) => product.category)
          .filter(Boolean)
          .filter((category) => !sampleCategories.includes(category)),
      ),
    ],
    [backendProducts],
  )

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const matchesCategory =
        activeCategory === 'All crafts' || product.category === activeCategory
      const matchesSearch =
        !query ||
        [product.name, product.category, product.artisan, product.location]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesCategory && matchesSearch
    })

    if (sortOrder === 'price-low') {
      return filtered.sort((first, second) => first.price - second.price)
    }
    if (sortOrder === 'price-high') {
      return filtered.sort((first, second) => second.price - first.price)
    }
    return filtered
  }, [activeCategory, products, search, sortOrder])

  // STRICT ACCESS CONTROL: Only customers can access the marketplace
  if (currentUser && currentUser.accountType !== 'customer') {
    if (currentUser.accountType === 'artisan') {
      return <Navigate replace to="/artisan/profile" />
    }
    if (currentUser.accountType === 'expert') {
      return <Navigate replace to="/expert/dashboard" />
    }
    if (currentUser.accountType === 'industry') {
      return <Navigate replace to="/industry/dashboard" />
    }
    return <Navigate replace to="/" />
  }

  if (!currentUser) {
    return (
      <MarketplaceLayout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <div className="rounded-3xl border border-border/80 bg-surface/95 p-8 shadow-card backdrop-blur-md sm:p-12">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <ShoppingBag className="h-8 w-8" />
            </span>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary">
              <Sparkles className="h-3 w-3" />
              <span>Patron Exclusive</span>
            </div>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
              Customer Access Only
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
              The SkillBridge marketplace connects conscious patrons directly with verified master artisans. Please sign in with your customer account or create one to explore authentic crafts.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className="rounded-xl bg-gradient-to-r from-primary to-primary-hover px-6 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98"
                onClick={() => openAuth('login')}
                type="button"
              >
                Sign In as Customer
              </button>
              <button
                className="rounded-xl border border-border-strong bg-surface px-6 py-3 text-xs font-bold text-text-main transition hover:bg-surface-muted hover:border-secondary"
                onClick={() => openAuth('signup')}
                type="button"
              >
                Create Patron Account
              </button>
            </div>
            <div className="mt-6 border-t border-border/60 pt-5">
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition"
                to="/"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to SkillBridge Home</span>
              </Link>
            </div>
          </div>
        </div>
      </MarketplaceLayout>
    )
  }

  const resetFilters = () => {
    setSearch('')
    setActiveCategory('All crafts')
  }

  return (
    <MarketplaceLayout
      onSearchChange={setSearch}
      searchValue={search}
      showSearch
    >
      <main>
        {!search.trim() && (
          <FeaturedCraftCarousel
            onSelectCategory={setActiveCategory}
            products={featuredProducts}
          />
        )}
        
        <MarketplaceProducts
          activeCategory={activeCategory}
          bagCount={itemCount}
          categories={categories}
          onAddToBag={addToCart}
          onCategoryChange={setActiveCategory}
          onResetFilters={resetFilters}
          onSortOrderChange={setSortOrder}
          products={visibleProducts.map((product) => ({
            ...product,
            cartQuantity:
              items.find((item) => item.name === product.name)?.quantity ?? 0,
          }))}
          sortOrder={sortOrder}
        />
      </main>
    </MarketplaceLayout>
  )
}

export default Marketplace
