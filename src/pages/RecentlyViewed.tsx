"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Clock, ShoppingBag, Star, Trash2 } from "lucide-react"
import { useStore } from "../store"
import type { Product } from "../types"
import LazyImage from "../components/LazyImage"

export default function RecentlyViewed() {
  // In a real app, this would be stored in localStorage or a database
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const products = useStore((state) => state.products)

  useEffect(() => {
    // Simulate fetching recently viewed products
    // In a real app, this would come from localStorage or an API
    const mockRecentlyViewed = products.sort(() => 0.5 - Math.random()).slice(0, 8)

    setRecentlyViewed(mockRecentlyViewed)
  }, [products])

  const clearHistory = () => {
    setRecentlyViewed([])
    // In a real app, you would also clear localStorage or make an API call
  }

  const removeItem = (productId: string) => {
    setRecentlyViewed((prev) => prev.filter((product) => product.id !== productId))
    // In a real app, you would also update localStorage or make an API call
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recently Viewed Products</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Products you've viewed recently</p>
          </div>
          {recentlyViewed.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>

        {recentlyViewed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewed.map((product) => (
              <div
                key={product.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-64">
                  <LazyImage
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <Link
                        to={`/products/${product.id}`}
                        className="flex-1 bg-white text-gray-900 py-2 rounded-lg font-medium text-center hover:bg-gray-100 transition-colors"
                      >
                        View Details
                      </Link>
                      <button className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.title}</h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Viewed recently</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No recently viewed products</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Products you view will appear here for easy access</p>
            <Link
              to="/shop"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

