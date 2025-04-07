"use client"

import { useState, useEffect } from "react"
import { X, Star, ShoppingCart, Heart, ChevronRight, ChevronLeft, Check } from "lucide-react"
import LazyImage from "./LazyImage"
import { useStore } from "../store"
import type { Product } from "../types"

interface ProductPreviewModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductPreviewModal({ product, isOpen, onClose }: ProductPreviewModalProps) {
  const { user, addToCart, addToWishlist, isInWishlist } = useStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isInWishlistState, setIsInWishlistState] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)

  const placeholderSrc = "/placeholder.svg?height=300&width=400"

  // Check if product is in wishlist
  useEffect(() => {
    if (product && product.id) {
      setIsInWishlistState(isInWishlist(product.id))
    }
  }, [product, isInWishlist])

  // Reset state when modal opens with a new product
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1)
      setSelectedImage(0)
      setSelectedVariant(null)
      setSelectedColor(null)
      setSelectedSize(null)
      setIsAddedToCart(false)
      setShowFeedback(null)
      if (product.id) {
        setIsInWishlistState(isInWishlist(product.id))
      }
    }
  }, [isOpen, product, isInWishlist])

  // Clear feedback message after timeout
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showFeedback])

  if (!isOpen || !product) return null

  // Create an array of images (main image + any additional images)
  const images = [product.image_url, ...(product.additional_images || [])].filter(Boolean)

  // If no additional images, create some dummy ones for the demo
  const displayImages =
    images.length > 1
      ? images
      : [
          product.image_url || placeholderSrc,
          // Add placeholder images with different colors for the demo
          `${placeholderSrc}?color=blue`,
          `${placeholderSrc}?color=red`,
          `${placeholderSrc}?color=green`,
        ]

  // Generate color variants if none exist
  const colorVariants = product.variants?.filter((v) => v.color) || [
    { id: "color-1", title: "Black", color: "black", attributes: { color: "black" } },
    { id: "color-2", title: "Blue", color: "blue", attributes: { color: "blue" } },
    { id: "color-3", title: "Red", color: "red", attributes: { color: "red" } },
    { id: "color-4", title: "Green", color: "green", attributes: { color: "green" } },
  ]

  // Generate size variants if none exist
  const sizeVariants = product.variants?.filter((v) => v.size) || [
    { id: "size-1", title: "S", size: "S", attributes: { size: "S" } },
    { id: "size-2", title: "M", size: "M", attributes: { size: "M" } },
    { id: "size-3", title: "L", size: "L", attributes: { size: "L" } },
    { id: "size-4", title: "XL", size: "XL", attributes: { size: "XL" } },
  ]

  const incrementQuantity = () => {
    if (quantity < (product.stock || 10)) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % displayImages.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }

  const handleAddToCart = () => {
    if (!user) {
      alert("Please login to add items to cart")
      return
    }

    // Make sure product is defined before adding to cart
    if (!product || !product.id) {
      console.error("Product is undefined or missing ID")
      return
    }

    // Get selected variant if any
    const variant = selectedVariant !== null && product.variants ? product.variants[selectedVariant] : null

    // Add to cart
    addToCart(product, quantity, variant)

    // Show feedback
    setIsAddedToCart(true)
    setShowFeedback(`${product.title || "Product"} added to cart`)
    setTimeout(() => setIsAddedToCart(false), 2000)
  }

  const handleAddToWishlist = () => {
    if (!user) {
      alert("Please login to add items to wishlist")
      return
    }

    // Make sure product is defined before adding to wishlist
    if (!product || !product.id) {
      console.error("Product is undefined or missing ID")
      return
    }

    // Add to wishlist
    addToWishlist(product)

    // Update state
    setIsInWishlistState(true)
    setShowFeedback(`${product.title || "Product"} added to wishlist`)
  }

  // Handle color selection
  const handleColorSelect = (colorIndex: number) => {
    setSelectedColor(colorVariants[colorIndex].color || null)
    // Change the image to match the color if possible
    if (colorIndex < displayImages.length) {
      setSelectedImage(colorIndex)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
        >
          <X size={24} />
        </button>

        {/* Feedback message */}
        {showFeedback && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
            {showFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Images */}
          <div className="relative bg-gray-100 dark:bg-gray-900 p-6">
            <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
              <LazyImage
                src={displayImages[selectedImage]}
                alt={product.title || "Product"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = placeholderSrc
                  e.currentTarget.onerror = null
                }}
              />

              {/* Image navigation arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-800 hover:bg-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-800 hover:bg-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Discount badge */}
              {product.discount_percent > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {product.discount_percent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail images */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {displayImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                      selectedImage === index ? "border-indigo-600" : "border-transparent"
                    }`}
                  >
                    <LazyImage
                      src={img}
                      alt={`${product.title || "Product"} - view ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = placeholderSrc
                        e.currentTarget.onerror = null
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: "95vh" }}>
            <div className="flex flex-col h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium capitalize">
                    {product.category || "Category"}
                  </span>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">
                      {product.rating?.toFixed(1) || "4.5"}
                    </span>
                    <span className="mx-1 text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{product.reviews_count || 0} reviews</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.title || "Product"}</h2>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {product.description || "No description available"}
                </p>

                <div className="flex items-baseline mb-4">
                  {product.discount_percent > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${((product.price || 0) * (1 - (product.discount_percent || 0) / 100)).toFixed(2)}
                      </span>
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${(product.price || 0).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Color Variants */}
                {colorVariants.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {colorVariants.map((variant, index) => (
                        <button
                          key={variant.id || `color-${index}`}
                          onClick={() => handleColorSelect(index)}
                          className={`w-10 h-10 rounded-full border-2 ${
                            selectedColor === variant.color
                              ? "border-indigo-600 ring-2 ring-indigo-600 ring-offset-2"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: variant.color || "gray" }}
                          title={variant.title}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Variants */}
                {sizeVariants.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {sizeVariants.map((variant, index) => (
                        <button
                          key={variant.id || `size-${index}`}
                          onClick={() => setSelectedSize(variant.size || null)}
                          className={`w-12 h-12 flex items-center justify-center rounded-md border ${
                            selectedSize === variant.size
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {variant.size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quantity</h3>
                  <div className="flex items-center">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-xl font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock || 10}
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                      className="w-20 text-center border-y border-gray-300 dark:border-gray-600 py-3 text-gray-900 dark:text-white dark:bg-gray-700 text-lg"
                    />
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= (product.stock || 10)}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-xl font-bold"
                    >
                      +
                    </button>
                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.stock || 10} available
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Features */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Features</h3>
                <ul className="space-y-1">
                  {product.features ? (
                    product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start">
                        <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Premium quality materials</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Durable construction</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Ergonomic design</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={(product.stock || 0) <= 0}
                    className={`flex-1 py-4 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${
                      isAddedToCart
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : (product.stock || 0) > 0
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart size={20} />
                    {isAddedToCart ? "Added to Cart" : (product.stock || 0) > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className={`py-4 px-6 border rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${
                      isInWishlistState
                        ? "bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-800 text-pink-600 dark:text-pink-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Heart size={20} className={isInWishlistState ? "fill-pink-500" : ""} />
                    {isInWishlistState ? "In Wishlist" : "Add to Wishlist"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

