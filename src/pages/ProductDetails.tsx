"use client"
import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
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
  ArrowLeft,
} from "lucide-react"
import toast from "react-hot-toast"
import LazyImage from "../components/LazyImage"
import ReviewsList from "../components/ReviewsList"
import ReviewForm from "../components/ReviewForm"
import type { Review, Product } from "../types"
import { getProductReviews } from "@/api/reviewApi"
import { getProductById, getProducts } from "@/api/productApi"

export default function ProductDetails() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user, addToCart, addToWishlist, isInWishlist: checkIsInWishlist } = useStore()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [activeTab, setActiveTab] = useState("description")
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return

      setLoading(true)
      try {
        const productData = await getProductById(productId)
        setProduct(productData)

        // Check if product is in wishlist
        if (user && productData.id) {
          setIsInWishlist(checkIsInWishlist(productData.id))
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product details. Please try again later.")
        setLoading(false)
      }
    }

    fetchProductData()
    // Scroll to top when component mounts or productId changes
    window.scrollTo(0, 0)
  }, [productId, user])

  // Fetch related products separately
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product || !product.category) return

      setRelatedLoading(true)
      try {
        // Fetch products in the same category
        const params = {
          category: product.category,
          limit: 8, // Get more than we need to ensure we get enough after filtering
        }

        const allProducts = await getProducts(params)

        // Filter out the current product and limit to 4 items
        const filtered = allProducts.filter((p: Product) => p.id !== product.id).slice(0, 4)

        // Fetch reviews for related products
        const relatedProductsWithReviews = await Promise.all(
          filtered.map(async (relatedProduct) => {
            try {
              const reviews = await getProductReviews(relatedProduct.id)
              return { ...relatedProduct, rating: calculateAverageRating(reviews) }
            } catch (error) {
              console.warn(`Error fetching reviews for product ${relatedProduct.id}:`, error)
              return { ...relatedProduct, rating: 0 }
            }
          }),
        )

        setRelatedProducts(relatedProductsWithReviews)
      } catch (err) {
        console.error("Error fetching related products:", err)
        // Don't set an error state here as it's not critical
      } finally {
        setRelatedLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [product])

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart")
      return
    }

    if (!product) return

    // If product has variants, use the selected variant
    const productToAdd =
      product.variants && product.variants.length > 0
        ? { ...product, variant: product.variants[selectedVariant] }
        : product

    addToCart(productToAdd, quantity)
    toast.success(`${product.title} added to cart!`)
  }

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error("Please login to add items to wishlist")
      return
    }

    if (!product) return

    addToWishlist(product)
    setIsInWishlist(true)
    toast.success(`${product.title} added to wishlist!`)
  }

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err))
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleWriteReviewClick = () => {
    if (!user) {
      toast.error("Please login to write a review")
      return
    }

    setShowReviewForm(true)
    setActiveTab("reviews")
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    // Refresh product data to get updated reviews
    if (productId) {
      getProductById(productId)
        .then((productData) => {
          setProduct(productData)
        })
        .catch((err) => {
          console.error("Error refreshing product data:", err)
        })
    }
  }

  // For demo purposes, using placeholder images if product images are not available
  const getProductImages = () => {
    if (!product) return []

    const mainImage = product.image_url || "/placeholder.svg?height=600&width=600"

    // If product has no additional images, create some placeholders
    return [
      mainImage,
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800",
    ]
  }

  const calculateAverageRating = (reviews: Review[]): number => {
    if (!reviews || reviews.length === 0) {
      return 0
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    return totalRating / reviews.length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Product Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error || "This product doesn't exist or has been removed."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    )
  }

  const productImages = getProductImages()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
          <Link to="/" className="hover:text-gray-900 dark:hover:text-white">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link to="/shop" className="hover:text-gray-900 dark:hover:text-white">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link
                to={`/categories/${product.category.toLowerCase()}`}
                className="hover:text-gray-900 dark:hover:text-white capitalize"
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 dark:text-white truncate">{product.title}</span>
        </nav>

        {/* Product Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 p-6">
            {/* Product Images - Left Column */}
            <div className="lg:col-span-3">
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-gray-700">
                <LazyImage
                  src={productImages[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.discount_percent > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                    {product.discount_percent}% OFF
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    title={`View image ${index + 1}`}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-indigo-600 dark:border-indigo-400"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <LazyImage
                      src={image}
                      alt={`${product.title} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info - Right Column */}
            <div className="lg:col-span-2">
              <div className="flex flex-col h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium capitalize">
                      {product.category || "Product"}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="ml-1 text-gray-700 dark:text-gray-300 font-medium">
                        {product.rating?.toFixed(1) || "4.5"}
                      </span>
                      <span className="mx-1 text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-400">{product.reviews_count || 0} reviews</span>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.title}</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">{product.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline mb-6">
                    {product.discount_percent > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ${((product.price || 0) * (1 - (product.discount_percent || 0) / 100)).toFixed(2)}
                        </span>
                        <span className="ml-2 text-lg text-gray-500 dark:text-gray-400 line-through">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                    )}

                    {product.variants && product.variants.length > 0 && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Base price</span>
                    )}
                  </div>

                  {/* Variants */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3">Available Options</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant: any, index: number) => (
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
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3">Quantity</h3>
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
                        disabled={quantity >= (product.stock || 1)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                        {product.stock || 0} available
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                        product.stock <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                      title={product.stock <= 0 ? "Out of stock" : "Add to Cart"}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                    <button
                      onClick={handleAddToWishlist}
                      className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg transition-colors ${
                        isInWishlist
                          ? "bg-pink-50 border-pink-300 text-pink-600 dark:bg-pink-900/20 dark:border-pink-700 dark:text-pink-400"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      title={isInWishlist ? "In Wishlist" : "Add to Wishlist"}
                    >
                      <Heart className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`} />
                      {isInWishlist ? "In Wishlist" : "Wishlist"}
                    </button>
                    <button
                      onClick={handleShare}
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
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab("description")}
                className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${
                  activeTab === "description"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${
                  activeTab === "specifications"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Reviews ({product.reviews?.length || product.reviews_count || 0})
              </button>
            </nav>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "description" && (
              <div className="prose dark:prose-invert max-w-none">
                <h3>Product Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Product Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.specifications ? (
                    Object.entries(product.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3"
                      >
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
            )}

            {activeTab === "reviews" && (
              <div>
                {showReviewForm ? (
                  <ReviewForm
                    productId={product.id}
                    productImage={product.image_url}
                    onReviewSubmitted={handleReviewSubmitted}
                    onCancel={() => setShowReviewForm(false)}
                  />
                ) : (
                  <ReviewsList
                    productId={product.id}
                    initialReviews={product.reviews as Review[]}
                    onWriteReviewClick={handleWriteReviewClick}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>

          {relatedLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-64">
                    <LazyImage
                      src={relatedProduct.image_url || "/placeholder.svg?height=300&width=400"}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {relatedProduct.discount_percent > 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                        {relatedProduct.discount_percent}% OFF
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <Link
                          to={`/product-details/${relatedProduct.id}`}
                          className="block w-full bg-white text-gray-900 py-2 rounded-lg font-medium text-center hover:bg-gray-100 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {relatedProduct.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${(relatedProduct.price || 0).toFixed(2)}
                      </span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                          {relatedProduct.rating?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">No related products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

