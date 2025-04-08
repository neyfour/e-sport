"use client"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import SuperAdminDashboard from "./pages/SuperAdminDashboard"
import SellerDashboard from "./pages/SellerDashboard"
import SellerPredictionsPage from "./pages/SellerPredictionsPage"
import SellerStatisticsPage from "./pages/SellerStatisticsPage"
import ProductsPage from "./pages/ProductsPage"
import OrdersPage from "./pages/OrdersPage"


import ProductAnalytics from "./pages/ProductAnalytics"
import Categories from "./pages/Categories"
import CategoryProducts from "./pages/CategoryProducts"
import AddProduct from "./pages/AddProduct"
import Shop from "./pages/Shop"
import Contact from "./pages/Contact"
import ProductView from "./pages/ProductView"
import FAQ from "./pages/FAQ"
import BecomeSeller from "./pages/BecomeSeller"
import Promotions from "./pages/Promotions"
import Chatbot from "./components/Chatbot"
import Affiliate from "./pages/Affiliate"
import Forum from "./pages/Forum"
import B2BPortal from "./pages/B2BPortal"
import RecentlyViewed from "./pages/RecentlyViewed"
import { useStore } from "./store"
import Returns from "./pages/Returns"
import ShippingPolicy from "./pages/ShippingPolicy"
import Cart from "./pages/cart"
import PrivacyPolicy from "./pages/PrivacyPolicy"
import TermsConditions from "./pages/TermsConditions"
import TrackOrder from "./pages/TrackOrder"
import Wishlist from "./pages/Wishlist"
import ViewDetails from "./pages/ViewDetails"
import Payment from "./pages/Payment"
import SellerChat from "./pages/SellerChat"
import type { JSX } from "react/jsx-runtime"
import SellerApplicationsList from "./pages/SellerApplicationsList"
import AuthModal from "./components/AuthModal"
import SellersList from "./pages/SellersList"
import AdminChat from "./pages/AdminChat"
import Settings from "./pages/Settings"
import SellerProductsPage from "./pages/SellerProductsPage"
import SellerOrdersPage from "./pages/SellerOrdersPage"
import EditProduct from "./pages/EditProduct"
import SuperAdminProducts from "./pages/SuperAdminProducts"
import SellerCommissionPage from "./pages/sellercommissionpage"
import SuperAdminSetting from "./pages/superadminsetting"
import ProductDetails from "./pages/ProductDetails"
import SellerProductReviewsPage from "./pages/SellerProductReviewsPage"

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element; requiredRole?: string | string[] }) => {
  const user = useStore((state) => state.user)
  const checkAuth = useStore((state) => state.checkAuth)
  const navigate = useNavigate()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const checkAuthentication = async () => {
      const isAuthenticated = await checkAuth()
      if (!isAuthenticated) {
        setShowAuthModal(true)
      }
    }

    checkAuthentication()
  }, [checkAuth])

  if (!user) {
    return (
      <>
        {showAuthModal && <AuthModal isOpen={true} onClose={() => navigate("/")} />}
        <Navigate to="/" replace />
      </>
    )
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(user.role) && user.role !== "superadmin") {
      return <Navigate to="/" replace />
    }
  }

  return children
}

// Dashboard layout component
const DashboardLayout = ({ children }: { children: JSX.Element }) => {
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">{children}</div>
}

function App() {
  const user = useStore((state) => state.user)
  const theme = useStore((state) => state.theme)
  const checkAuth = useStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  return (
    <Router>
      <Routes>
        {/* SuperAdmin Dashboard Routes */}
        <Route
          path="/matrix/admin/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sellers"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SellersList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/superadmin-setting"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SuperAdminSetting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller-commissions"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SellerCommissionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/add"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <AddProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/:productId/analytics"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <ProductAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:orderId"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <ViewDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <AdminChat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller-applications"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SellerApplicationsList />
                    </ProtectedRoute>
                  }
                />
                {/* New route for admin to view a specific seller's dashboard */}
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute requiredRole="superadmin">
                      <SuperAdminProducts />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </DashboardLayout>
          }
        />

        {/* Seller Dashboard Routes */}
        <Route
          path="/seller/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/predictions"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerPredictionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerStatisticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-product"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <AddProduct />
                    </ProtectedRoute>
                  }
                />
                 <Route
                  path="/edit-product/:productId"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <EditProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/:productId/analytics"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <ProductAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:orderId"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <ViewDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerChat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile-settings"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/reviews"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerProductReviewsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </DashboardLayout>
          }
        />

        {/* Main Site Routes */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 pt-24 flex-grow">
                <Routes>
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/products/:productId" element={<ProductView />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:category" element={<CategoryProducts />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/become-seller" element={<BecomeSeller />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/affiliate" element={<Affiliate />} />
                  <Route path="/forum" element={<Forum />} />
                  <Route path="/b2b" element={<B2BPortal />} />
                  <Route path="/recently-viewed" element={<RecentlyViewed />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/profile" element={<Settings />} />
                  <Route path="/product-details/:productId" element={<   ProductDetails    />}     />
                </Routes>
              </main>
              <Chatbot />
              <Footer />
            </div>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App
