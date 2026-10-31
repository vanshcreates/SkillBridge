import { useEffect, useMemo, useState } from 'react'
import MarketplaceLayout from '../components/layout/MarketplaceLayout'
import FeaturedCraftCarousel from '../components/marketplace/FeaturedCraftCarousel'
import MarketplaceProducts from '../components/marketplace/MarketplaceProducts'
import { useCart } from '../hooks/useCart'
import {
  getPublishedArtisanListings,
  toMarketplaceProduct,
} from '../utils/artisan-storage'
import content from '../data/local-storage.json'

const { products: sampleProducts, categories: sampleCategories } = content.marketplace
const featuredProducts = sampleProducts.slice(0, 3)

function readArtisanProducts() {
  try {
    return {
      products: getPublishedArtisanListings().map(toMarketplaceProduct),
      error: '',
    }
  } catch (error) {
    console.error('Unable to load artisan marketplace listings.', error)
    return {
      products: [],
      error: error.message || 'Artisan listings could not be loaded.',
    }
  }
}

const Marketplace = () => {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All crafts')
  const [sortOrder, setSortOrder] = useState('featured')
  const [artisanProductState, setArtisanProductState] = useState(readArtisanProducts)
  const { addToCart, itemCount, items } = useCart()
  const products = useMemo(
    () => [...sampleProducts, ...artisanProductState.products],
    [artisanProductState.products],
  )
  const categories = useMemo(
    () => [
      ...sampleCategories,
      ...new Set(
        artisanProductState.products
          .map((product) => product.category)
          .filter((category) => !sampleCategories.includes(category)),
      ),
    ],
    [artisanProductState.products],
  )

  useEffect(() => {
    const refreshListings = () => setArtisanProductState(readArtisanProducts())
    window.addEventListener('storage', refreshListings)
    return () => window.removeEventListener('storage', refreshListings)
  }, [])

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
        {artisanProductState.error && (
          <p
            className="mx-auto mt-6 max-w-7xl rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {artisanProductState.error}
          </p>
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
