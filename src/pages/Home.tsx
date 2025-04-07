"use client"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useStore } from "../store"
import { TrendingUp, ArrowRight, ChevronRight, ShoppingBag, Award, Users } from "lucide-react"
import LazyImage from "../components/LazyImage"
import ProductPreviewModal from "../components/ProductPreviewModal"
import ProductCard from "../components/ProductCard"
import { getProducts } from "../api/productApi"

import "../styles/Home.css"



export default function Home() {
  const navigate = useNavigate()
  const { user } = useStore()

  const [featuredProducts, setFeaturedProducts] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewProduct, setPreviewProduct] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Fetch all products
      const products = await getProducts()

      // Sort by rating for featured products (highest rated)
      const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 6)

      // Sort by views for popular products
      const popular = [...products].sort((a, b) => b.views_count - a.views_count).slice(0, 4)

      setFeaturedProducts(featured)
      setPopularProducts(popular)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    {
      id: "soccer",
      title: "Soccer",
      image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800",
      products: 245,
    },
    {
      id: "basketball",
      title: "Basketball",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
      products: 189,
    },
    {
      id: "running",
      title: "Running",
      image: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=800",
      products: 312,
    },
    {
      id: "fitness",
      title: "Fitness",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
      products: 423,
    },
  ]

  const handleGetStarted = () => {
    if (user) {
      if (user.role === "seller") {
        navigate("/seller/dashboard")
      } else if (user.role === "superadmin" ) {
        navigate("/matrix")
      } else if (user.seller_application) {
        // If they've already applied
        alert("Your seller application is being reviewed")
      } else {
        navigate("/become-seller")
      }
    } else {
    alert("Please sign in to continue");
    }
  }

  const openProductPreview = (product) => {
    if (!product) {
      console.error("Cannot preview undefined product")
      return
    }
    setPreviewProduct(product)
    setIsPreviewOpen(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src="https://img.freepik.com/free-photo/view-gym-room-training-sports_23-2151699494.jpg?uid=R186796868&ga=GA1.1.1852284681.1743187124&w=740"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover hero-image"
        />
        <div className="hero-content h-full flex items-center justify-center text-center">
          <div className="max-w-3xl px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Discover Exceptional Sports Equipment</h1>
            <p className="text-xl text-gray-100 mb-8">Join our community of athletes and sports enthusiasts</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/shop")}
                className="cta-button bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Shop Now
              </button>
              <button
                onClick={handleGetStarted}
                className="cta-button bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Selling
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Popular Products</h2>
            <Link
              to="/shop"
              className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              View All
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} popular onQuickView={openProductPreview} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link
              to="/categories"
              className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              All Categories
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="category-card group relative overflow-hidden rounded-xl shadow-sm"
              >
                <LazyImage
                  src={category.image}
                  alt={category.title}
                  className="w-full h-64 object-cover category-image"
                />
                <div className="category-overlay absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
                  <div className="category-stats flex items-center text-white">
                    <span className="text-sm">{category.products} Products</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
            <Link
              to="/shop"
              className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              View All
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} featured onQuickView={openProductPreview} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Why Choose Matrix Commerce
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Premium Quality</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All our products are carefully selected to ensure the highest quality standards for professional
                athletes and enthusiasts.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI-Powered Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our advanced AI technology provides sellers with valuable market insights and sales predictions to
                optimize their business.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Community Focused</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join our growing community of sports enthusiasts, professional athletes, and successful sellers from
                around the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-indigo-600 dark:bg-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Start Selling Your Sports Equipment Today</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join our community of successful sellers and reach athletes worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/shop")}
              className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors"
            >
              Explore Products
            </button>
            <button
              onClick={handleGetStarted}
              className="bg-indigo-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-900 transition-colors"
            >
              {user?.role === "seller" ? "Seller Dashboard" : "Become a Seller"}
            </button>
          </div>
        </div>
      </section>

      {/* Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal product={previewProduct} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  )
}

