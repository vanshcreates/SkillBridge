import React from 'react'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import OrderSummary from './pages/OrderSummary'
import OrderConfirmation from './pages/OrderConfirmation'
import ProfilePage from './pages/ProfilePage'
import OrderHistory from './pages/OrderHistory'
import ArtisanAuthPage from './pages/ArtisanAuthPage'
import ArtisanProfilePage from './pages/ArtisanProfilePage'
import ExpertAuthPage from './pages/ExpertAuthPage'
import ExpertDashboardPage from './pages/ExpertDashboardPage'
import IndustryAuthPage from './pages/IndustryAuthPage'
import IndustryDashboardPage from './pages/IndustryDashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import { CartProvider } from './context/CartContext'
import AuthDialogProvider from './context/AuthDialogProvider'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>
      <AuthDialogProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artisan/auth" element={<ArtisanAuthPage />} />
            <Route path="/artisan/profile" element={<ArtisanProfilePage />} />
            <Route path="/expert/auth" element={<ExpertAuthPage />} />
            <Route path="/expert/dashboard" element={<ExpertDashboardPage />} />
            <Route path="/industry/auth" element={<IndustryAuthPage />} />
            <Route path="/industry/dashboard" element={<IndustryDashboardPage />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/products/:slug" element={<ProductDetail />} />
            <Route path="/marketplace/order-summary" element={<OrderSummary />} />
            <Route path="/marketplace/orders" element={<OrderHistory />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/marketplace/order-confirmation"
              element={<OrderConfirmation />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthDialogProvider>
    </BrowserRouter>
  )
}

export default App