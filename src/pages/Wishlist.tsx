"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, ShoppingCart, Trash2, AlertCircle } from "lucide-react"
import { useStore } from "../store"
import toast from "react-hot-toast"
import AuthModal from "../components/AuthModal"

export default function Wishlist() {
  const [isLoading, setIsLoading] = useState(true)

  const user = useStore((state) => state.user)
  const getUserWishlist = useStore((state) => state.getUserWishlist)
  const removeFromWishlist = useStore((state) => state.removeFromWishlist)
  const addToCart = useStore((state) => state.addToCart)

  const navigate = useNavigate()
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    // Load wishlist items if user is logged in
    if (user) {
      const loadWishlist = async () => {
        try {
          setIsLoading(true)
          const items = getUserWishlist()
          console.log("Wishlist items loaded:", items)
          setWishlistItems(items)
        } catch (error) {
          console.error("Error loading wishlist:", error)
          toast.error("Failed to load wishlist items")
        } finally {
          setIsLoading(false)
        }
      }

      loadWishlist()
    } else {
      setIsLoading(false)
    }
  }, [user, getUserWishlist])

  // Add a listener for wishlist changes
  useEffect(() => {
    if (user) {
      // Create a function to update wishlist items
      const updateWishlistItems = () => {
        const items = getUserWishlist()
        setWishlistItems(items)
      }

      // Set up an interval to check for wishlist changes
      const intervalId = setInterval(updateWishlistItems, 2000)

      // Clean up the interval on component unmount
      return () => clearInterval(intervalId)
    }
  }, [user, getUserWishlist])

  const handleRemoveFromWishlist = (itemId: string) => {
    removeFromWishlist(itemId)
    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId))
    toast.success("Item removed from wishlist")
  }

  const handleAddToCart = (product: any) => {
    addToCart(product)
    toast.success("Item added to cart")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Please log in to view your wishlist
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to be logged in to view and manage your wishlist.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Heart className="h-8 w-8 text-pink-500 mr-3" />
            My Wishlist
          </h1>

          {wishlistItems.length > 0 && (
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Items you add to your wishlist will appear here.</p>
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 truncate">{item.title}</h3>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {item.stock <= 5 && (
                    <div className="mt-3 flex items-center text-sm text-amber-600 dark:text-amber-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {item.stock === 0 ? "Out of stock" : `Only ${item.stock} left`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

