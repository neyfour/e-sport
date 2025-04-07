"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useStore } from "../store"
import {
  ShoppingBag,
  Heart,
  Share2,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react"
import toast from "react-hot-toast"

export default function ProductView() {
  const { productId } = useParams()
  const products = useStore((state) => state.products)
  const product = products.find((p) => p.id === productId)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(0)

  // For demo purposes, using placeholder images
  const productImages = [
    product?.image_url || "",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800",
  ]

  const relatedProducts = products.filter((p) => p.category === product?.category && p.id !== product?.id).slice(0, 4)

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [productId])

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Product not found</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    toast.success(`${product.title} added to cart!`)
  }

  const handleAddToWishlist = () => {
    toast.success(`${product.title} added to wishlist!`)
  }

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
          <Link to="/" className="hover:text-gray-900 dark:hover:text-white">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link to="/categories" className="hover:text-gray-900 dark:hover:text-white">
            Categories
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link
            to={`/categories/${product.category.toLowerCase()}`}
            className="hover:text-gray-900 dark:hover:text-white capitalize"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 dark:text-white truncate">{product.title}</span>
        </nav>

        {/* Product Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Product Images */}
            <div className="p-6 md:p-8">
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                <img src={productImages[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    title={`View image ${index + 1}`}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-indigo-600 dark:border-indigo-400" : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
              <div className="flex flex-col h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium capitalize">
                      {product.category}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="mx-1 text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-400">{product.reviews_count} reviews</span>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.title}</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{product.description}</p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.variants && product.variants.length > 0 && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Base price</span>
                    )}
                  </div>

                  {/* Variants */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Available Options</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedVariant(index)}
                            title={`Select variant ${variant.title}`}
                            className={`px-4 py-2 rounded-lg border ${
                              selectedVariant === index
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {variant.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quantity</h3>
                    <div className="flex items-center">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        className="w-16 text-center border-y border-gray-300 dark:border-gray-600 py-2 text-gray-900 dark:text-white dark:bg-gray-700"
                        title="Quantity"
                      />
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">{product.stock} available</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleAddToWishlist}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Add to Wishlist"
                    >
                      <Heart className="w-5 h-5" />
                      Wishlist
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Shipping & Returns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Free shipping over $100</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">2 year warranty</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">30 day returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button className="px-6 py-4 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium">
                Description
              </button>
              <button className="px-6 py-4 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                Specifications
              </button>
              <button className="px-6 py-4 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                Reviews ({product.reviews_count})
              </button>
            </nav>
          </div>
          <div className="p-6 md:p-8">
            <div className="prose dark:prose-invert max-w-none">
              <h3>Product Description</h3>
              <p>{product.description}</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl
                nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed euismod, nisl vel ultricies lacinia, nisl
                nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.
              </p>
              <h3>Features</h3>
              <ul>
                <li>High-quality materials for durability</li>
                <li>Ergonomic design for comfort</li>
                <li>Versatile for various activities</li>
                <li>Easy to clean and maintain</li>
                <li>Lightweight and portable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Product Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.specifications ? (
                Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">{key}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{value}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Brand</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {product.brand || "Matrix Sports"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Sport Type</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {product.sport_type || product.category}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Material</span>
                    <span className="text-gray-900 dark:text-white font-medium">Premium Synthetic</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Weight</span>
                    <span className="text-gray-900 dark:text-white font-medium">0.5 kg</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Dimensions</span>
                    <span className="text-gray-900 dark:text-white font-medium">30 x 20 x 10 cm</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Color</span>
                    <span className="text-gray-900 dark:text-white font-medium">Multiple Options</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-64">
                  <img
                    src={relatedProduct.image_url}
                    alt={relatedProduct.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <Link
                        to={`/products/${relatedProduct.id}`}
                        className="block w-full bg-white text-gray-900 py-2 rounded-lg font-medium text-center hover:bg-gray-100 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{relatedProduct.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${relatedProduct.price.toFixed(2)}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                        {relatedProduct.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

