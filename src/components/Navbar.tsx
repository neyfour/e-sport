"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Search, ShoppingBag, Phone, Heart, Menu, X } from "lucide-react"
import { useStore } from "../store"
import ThemeToggle from "./ThemeToggle"
import AuthModal from "./AuthModal"
import UserDropdown from "./UserDropdown"
import NotificationCenter from "./NotificationCenter"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const user = useStore((state) => state.user)
  const getUserCart = useStore((state) => state.getUserCart)
  const getUserWishlist = useStore((state) => state.getUserWishlist)
  const location = useLocation()
  const navigate = useNavigate()

  // Replace these lines:
  // const cartItems = useStore((state) => state.cart)
  // const wishlistItems = useStore((state) => state.wishlist)
  // const userCartItems = useStore((state) => state.getUserCart())
  // const userWishlistItems = useStore((state) => state.getUserWishlist())

  // With direct store subscriptions:
  const cart = useStore((state) => state.cart)
  const wishlist = useStore((state) => state.wishlist)

  // Calculate counts directly from the store data
  const cartCount = useMemo(() => {
    if (!user) return 0
    const userId = user.id || user._id
    return cart.filter((item) => item.user_id === userId).length
  }, [cart, user])

  const wishlistCount = useMemo(() => {
    if (!user) return 0
    const userId = user.id || user._id
    return wishlist.filter((item) => item.user_id === userId).length
  }, [wishlist, user])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Navigate to shop page with search query
    navigate(`/shop?search=${encodeURIComponent(searchQuery)}`)
  }

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    { path: "/categories", label: "Categories" },
    { path: "/contact", label: "Contact" },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const isDashboardPage = location.pathname.startsWith("/matrix")

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-200 ${
          isScrolled || isDashboardPage
            ? "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3">
              <img 
              src={useStore((state) => state.theme) === 'dark' ? "/logo2.png" : "/logo.png"} 
              alt="Matrix Commerce Logo" 
              className="w-auto h-16 opacity-100 dark:opacity-90" 
              />
          <span className="text-2xl font-bold dark:text-gray-200 text-purple-800">
          E-SPORTS
          </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                />
              </form>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium ${
                    isActive(link.path) ? "text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <UserDropdown />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <span>Sign In</span>
                </button>
              )}

              <div className="flex items-center space-x-4">
                <ThemeToggle />

                {user && <NotificationCenter />}

                <Link
                  to={user ? "/wishlist" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault()
                      setIsAuthModalOpen(true)
                    }
                  }}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Heart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                    {wishlistCount}
                  </span>
                </Link>

                <Link
                  to={user ? "/cart" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault()
                      setIsAuthModalOpen(true)
                    }
                  }}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ShoppingBag className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-4 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-80px)] overflow-y-auto">
              <div className="flex flex-col space-y-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                  />
                </form>

                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${
                      isActive(link.path) ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    {user.role === "admin" && (
                      <Link
                        to="/matrix"
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        useStore.getState().logoutUser()
                        setIsMenuOpen(false)
                      }}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Sign In
                  </button>
                )}

                <div className="flex justify-between items-center px-4 py-2">
                  <Link
                    to={user ? "/wishlist" : "#"}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault()
                        setIsAuthModalOpen(true)
                        setIsMenuOpen(false)
                      }
                    }}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-200"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Wishlist ({wishlistCount})</span>
                  </Link>
                  <Link
                    to={user ? "/cart" : "#"}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault()
                        setIsAuthModalOpen(true)
                        setIsMenuOpen(false)
                      }
                    }}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-200"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Cart ({cartCount})</span>
                  </Link>
                </div>

                <Link
                  to="/contact"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Phone className="w-5 h-5" />
                  <span>Contact Us</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}

