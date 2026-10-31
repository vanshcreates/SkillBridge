import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import FeaturedCraftCarousel from '../components/marketplace/FeaturedCraftCarousel'
import MarketplaceProducts from '../components/marketplace/MarketplaceProducts'
import { useCart } from '../hooks/useCart'
import { useAuthDialog } from '../hooks/useAuthDialog'
import { getMarketplaceProductsApi } from '../services/marketplace-api'
import content from '../data/local-storage.json'

const { products: sampleProducts, categories: sampleCategories } = content.marketplace
const featuredProducts = sampleProducts.slice(0, 3)

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
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-card sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-serif text-2xl font-bold text-text-main sm:text-3xl">
              Customer Access Only
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">
              The SkillBridge marketplace is exclusively reserved for customers.
              Please sign in with your customer account or create one to explore handmade artisan crafts.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
                onClick={() => openAuth('login')}
                type="button"
              >
                Sign in as customer
              </button>
              <button
                className="rounded-lg border border-border-strong px-6 py-2.5 font-semibold text-text-main transition hover:bg-surface-muted"
                onClick={() => openAuth('signup')}
                type="button"
              >
                Create an account
              </button>
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
