import Navbar from './Navbar'
import Footer from './Footer'
import { useCart } from '../../hooks/useCart'

const MarketplaceLayout = ({
  children,
  onSearchChange,
  searchValue,
  showSearch = false,
}) => {
  const { itemCount } = useCart()

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        cartCount={itemCount}
        onSearchChange={onSearchChange}
        searchValue={searchValue}
        showSearch={showSearch}
        variant="marketplace"
      />
      {children}
      <Footer />
    </div>
  )
}

export default MarketplaceLayout
