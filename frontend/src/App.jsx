import { lazy, Suspense } from 'react'
import { CartProvider } from './context/CartContext'
import AuthDialogProvider from './context/AuthDialogProvider'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthDialog } from './hooks/useAuthDialog'
import { getAccountHomePath } from './utils/account-routing'

const Home = lazy(() => import('./pages/Home'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const OrderSummary = lazy(() => import('./pages/OrderSummary'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const OrderHistory = lazy(() => import('./pages/OrderHistory'))
const ArtisanAuthPage = lazy(() => import('./pages/ArtisanAuthPage'))
const ArtisanProfilePage = lazy(() => import('./pages/ArtisanProfilePage'))
const ArtisanCoursePage = lazy(() => import('./pages/ArtisanCoursePage'))
const ExpertAuthPage = lazy(() => import('./pages/ExpertAuthPage'))
const ExpertDashboardPage = lazy(() => import('./pages/ExpertDashboardPage'))
const IndustryAuthPage = lazy(() => import('./pages/IndustryAuthPage'))
const IndustryDashboardPage = lazy(() => import('./pages/IndustryDashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const FindArtisansPage = lazy(() => import('./pages/FindArtisansPage'))
const StoryOfArtPage = lazy(() => import('./pages/StoryOfArtPage'))
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'))

/**
 * Route guard that redirects logged-in users directly to their active role's dashboard.
 * Prevents authenticated users from returning to public marketing or authentication pages.
 */
const GuestOnlyRoute = ({ children }) => {
  const { currentUser } = useAuthDialog()
  if (currentUser) {
    return <Navigate replace to={getAccountHomePath(currentUser)} />
  }
  return children
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthDialogProvider>
        <CartProvider>
          <Suspense
            fallback={<p className="p-8 text-center" role="status">Loading page…</p>}
          >
            <Routes>
              {/* Public & marketing routes */}
              <Route path="/" element={<Home />} />
              <Route path="/artisans" element={<FindArtisansPage />} />
              <Route path="/story-of-art" element={<StoryOfArtPage />} />
              <Route path="/about-us" element={<AboutUsPage />} />

              {/* Role Auth Pages - guarded from already logged-in users */}
              <Route
                path="/artisan/auth"
                element={
                  <GuestOnlyRoute>
                    <ArtisanAuthPage />
                  </GuestOnlyRoute>
                }
              />
              <Route
                path="/expert/auth"
                element={
                  <GuestOnlyRoute>
                    <ExpertAuthPage />
                  </GuestOnlyRoute>
                }
              />
              <Route
                path="/industry/auth"
                element={
                  <GuestOnlyRoute>
                    <IndustryAuthPage />
                  </GuestOnlyRoute>
                }
              />

              {/* Artisan Workspace */}
              <Route path="/artisan/profile" element={<ArtisanProfilePage />} />
              <Route
                path="/artisan/courses/:courseId"
                element={<ArtisanCoursePage />}
              />

              {/* Expert Workspace */}
              <Route path="/expert/dashboard" element={<ExpertDashboardPage />} />

              {/* Industry Workspace */}
              <Route path="/industry/dashboard" element={<IndustryDashboardPage />} />

              {/* Customer Marketplace & Orders */}
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/products/:slug" element={<ProductDetail />} />
              <Route path="/marketplace/order-summary" element={<OrderSummary />} />
              <Route path="/marketplace/orders" element={<OrderHistory />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/marketplace/order-confirmation"
                element={<OrderConfirmation />}
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthDialogProvider>
    </BrowserRouter>
  )
}

export default App
