"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Star, ShoppingCart, Heart, Eye } from "lucide-react"
import LazyImage from "./LazyImage"
import { useStore } from "../store"
import type { Product } from "../types"

interface ProductCardProps {
  product: Product
  featured?: boolean
  popular?: boolean
  onQuickView: (product: Product) => void
}

export default function ProductCard({ product, featured, popular, onQuickView }: ProductCardProps) {
  const { user, addToCart, addToWishlist, isInWishlist: checkIsInWishlist } = useStore()
  const [isInWishlistState, setIsInWishlistState] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)

  const placeholderSrc = "/placeholder.svg?height=300&width=400"

  const checkWishlist = (id: string) => {
    if (typeof checkIsInWishlist === "function") {
      return checkIsInWishlist(id)
    }
    return false
  }

  // Check if product is in wishlist
  useEffect(() => {
    if (product && product.id) {
      setIsInWishlistState(checkWishlist(product.id))
    }
  }, [product])

  // Clear feedback message after timeout
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showFeedback])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      alert("Please login to add items to cart")
      return
    }

    // Make sure product is defined before adding to cart
    if (!product || !product.id) {
      console.error("Product is undefined or missing ID")
      return
    }

    addToCart(product, 1)

    // Show feedback
    setIsAddedToCart(true)
    setShowFeedback("Added to cart")
    setTimeout(() => setIsAddedToCart(false), 2000)
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      alert("Please login to add items to wishlist")
      return
    }

    // Make sure product is defined before adding to wishlist
    if (!product || !product.id) {
      console.error("Product is undefined or missing ID")
      return
    }

    addToWishlist(product)

    // Update state
    setIsInWishlistState(true)
    setShowFeedback("Added to wishlist")
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView(product)
  }

  if (!product) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group relative">
      {showFeedback && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-green-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
          {showFeedback}
        </div>
      )}

      <Link to={`/product-details/${product.id}`} className="block">
        <div className="relative h-56 overflow-hidden">
          <LazyImage
            src={product.image_url || placeholderSrc}
            alt={product.title || "Product"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = placeholderSrc
              e.currentTarget.onerror = null
            }}
          />

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {product.discount_percent > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {product.discount_percent}% OFF
              </div>
            )}
            {featured && <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">Featured</div>}
            {popular && <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">Popular</div>}
          </div>

          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
              Only {product.stock} left
            </div>
          )}

          {/* Product action buttons */}
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <button
              onClick={handleAddToCart}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
                isAddedToCart
                  ? "bg-green-500 text-white"
                  : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white"
              }`}
              title="Add to Cart"
              disabled={product.stock <= 0}
            >
              <ShoppingCart size={18} />
            </button>
            <button
              onClick={handleAddToWishlist}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
                isInWishlistState
                  ? "bg-pink-500 text-white"
                  : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white"
              }`}
              title={isInWishlistState ? "In Wishlist" : "Add to Wishlist"}
            >
              <Heart size={18} className={isInWishlistState ? "fill-white" : ""} />
            </button>
            <button
              onClick={handleQuickView}
              className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors shadow-md"
              title="Quick View"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
              {product.title || "Product"}
            </h3>
            <div className="flex items-center">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">{product.rating || "4.5"}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.brand || "Brand"}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.description || "No description available"}
          </p>
          <div className="mt-3 flex justify-between items-center">
            <div>
              {product.discount_percent > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${((product.price || 0) * (1 - (product.discount_percent || 0) / 100)).toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                    ${(product.price || 0).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${(product.price || 0).toFixed(2)}
                </span>
              )}
            </div>
            <span
              className={`text-sm ${
                (product.stock || 0) > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {(product.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

