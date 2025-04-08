"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Star, Search, CheckCircle, Package } from "lucide-react"
import { useStore } from "../store"
import type { Review, Product } from "../types"
import { getProductReviews, updateReview } from "../api/reviewApi"
import { getProductById, getProducts } from "../api/productApi"
import toast from "react-hot-toast"
import SellerSidebar from "../components/SellerSidebar"
import { format } from "date-fns"

const SellerProductReviewsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [reviews, setReviews] = useState<Review[]>([])
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token, user } = useStore()

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [reviewToVerify, setReviewToVerify] = useState<Review | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Extract productId from URL if present
  const productId = useMemo(() => {
    const match = location.pathname.match(/\/seller\/products\/reviews\/([^/]+)/)
    return match && match[1] !== "search" ? match[1] : null
  }, [location.pathname])

  // Get the seller ID from the user object (handle both id and _id formats)
  const getSellerId = () => {
    if (!user) return null
    return user.id || user._id
  }

  // Fetch all reviews for the seller's products
  const fetchReviews = async () => {
    console.log("Fetching reviews with token:", token ? "Token exists" : "No token")
    console.log("Current user:", user)

    const sellerId = getSellerId()
    if (!token || !user || !sellerId) {
      console.error("Authentication required - missing token or user data")
      setError("Authentication required")
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let reviewsData: Review[] = []
      const productsData: Record<string, Product> = {}

      // If productId is provided, fetch reviews for that specific product
      if (productId) {
        try {
          const productData = await getProductById(productId)

          // Check if the product belongs to the current seller
          if (productData.seller_id !== sellerId) {
            toast.error("You don't have permission to view reviews for this product")
            setError("You don't have permission to view reviews for this product")
            setLoading(false)
            return
          }

          productsData[productId] = productData
          reviewsData = await getProductReviews(productId)
        } catch (err) {
          console.error(`Error fetching product ${productId}:`, err)
          setError(`Could not find product with ID: ${productId}`)
        }
      } else {
        // Otherwise, fetch all seller products first
        try {
          // Use getProducts with explicit seller_id filter
          console.log("Fetching products with seller_id filter:", sellerId)
          const sellerProductsData = await getProducts({
            seller_id: sellerId.toString(), // Ensure it's a string
          })

          console.log("Seller products response:", sellerProductsData)

          if (!sellerProductsData || sellerProductsData.length === 0) {
            console.log("No products found for this seller")
            setProducts({})
            setAllReviews([])
            setReviews([])
            setLoading(false)
            return
          }

          // Store products data
          sellerProductsData.forEach((product) => {
            productsData[product.id] = product
          })

          // Fetch reviews for each product
          const reviewsPromises = sellerProductsData.map((product) =>
            getProductReviews(product.id).catch((err) => {
              console.error(`Error fetching reviews for product ${product.id}:`, err)
              return []
            }),
          )

          const reviewsResults = await Promise.all(reviewsPromises)
          reviewsData = reviewsResults.flat()
        } catch (err) {
          console.error("Error fetching seller products:", err)
          setError("Failed to load seller products. Please try again later.")
        }
      }

      setProducts(productsData)
      setAllReviews(reviewsData || [])
      setReviews(reviewsData || [])
    } catch (err) {
      console.error("Error fetching reviews:", err)
      setError("Failed to load reviews. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("useEffect triggered - checking auth state")
    console.log("Token:", token ? "exists" : "missing")
    console.log("User:", user)
    console.log("Product ID:", productId)

    const sellerId = getSellerId()
    if (token && user && sellerId) {
      console.log("Auth check passed, fetching reviews for seller ID:", sellerId)
      fetchReviews()
    } else {
      console.error("Auth check failed - not fetching reviews")
      setError("Authentication required. Please log in.")
      setLoading(false)
    }
  }, [productId, token, user])

  // Handle search with product ID check
  const handleSearch = async (query: string) => {
    // If it looks like a product ID (assuming product IDs are at least 5 characters)
    if (query.length >= 5 && !query.includes(" ")) {
      const sellerId = getSellerId()
      if (!token || !user || !sellerId) return

      setSearchLoading(true)
      try {
        // Try to fetch the product to check ownership
        const productData = await getProductById(query).catch(() => null)

        // If product exists but doesn't belong to this seller
        if (productData && productData.seller_id !== sellerId) {
          toast.error("You don't have permission to view reviews for this product")
        }
      } catch (err) {
        // Product not found or other error - continue with normal filtering
        console.log("Product not found or error:", err)
      } finally {
        setSearchLoading(false)
      }
    }
  }

  // Check for product ID when search query changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }, [searchQuery])

  // Apply filters and sorting to reviews
  useEffect(() => {
    let result = [...allReviews]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((review) => {
        const productName = products[review.product_id]?.title?.toLowerCase() || ""
        return (
          review.product_id.toLowerCase().includes(query) ||
          productName.includes(query) ||
          review.rating.toString() === query
        )
      })
    }

    // Apply rating filter
    if (ratingFilter !== null) {
      result = result.filter((review) => review.rating === ratingFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA = a[sortBy]
      let valueB = b[sortBy]

      // Handle numeric values
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA
      }

      // Handle date values
      if (sortBy === "created_at") {
        valueA = new Date(valueA).getTime()
        valueB = new Date(valueB).getTime()
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA
      }

      // Handle string values
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }

      return 0
    })

    setReviews(result)
  }, [allReviews, searchQuery, sortBy, sortOrder, ratingFilter, products])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new sort field and default to descending order
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  // Handle review verification toggle
  const handleToggleVerified = (review: Review) => {
    setReviewToVerify(review)
    setShowVerifyModal(true)
  }

  const confirmVerify = async () => {
    if (!reviewToVerify || !token || !user) {
      toast.error("Authentication required")
      setShowVerifyModal(false)
      return
    }

    setIsProcessing(true)
    try {
      const newVerifiedStatus = !reviewToVerify.verified

      // Log the token being used
      console.log("Using token for verification:", token ? "Token exists" : "No token")

      // Make sure we're sending all required fields to the API
      const updatedReview = await updateReview(
        reviewToVerify.id,
        {
          ...reviewToVerify,
          verified: newVerifiedStatus,
          // Ensure all required fields are included
          user_id: reviewToVerify.user_id,
          product_id: reviewToVerify.product_id,
          rating: reviewToVerify.rating,
          comment: reviewToVerify.comment,
          user_name: reviewToVerify.user_name,
          user_avatar: reviewToVerify.user_avatar || "",
        },
        token,
      )

      // Update reviews state
      const updatedReviews = allReviews.map((r) =>
        r.id === reviewToVerify.id ? { ...r, verified: newVerifiedStatus } : r,
      )
      setAllReviews(updatedReviews)

      toast.success(`Review ${newVerifiedStatus ? "verified" : "unverified"} successfully`)
    } catch (error: any) {
      console.error("Error updating review:", error)
      let errorMessage = "Failed to update review status"

      if (error.message) {
        try {
          const parsedError = JSON.parse(error.message)
          errorMessage = parsedError.detail || errorMessage

          // If it's an authentication error, suggest refreshing the page
          if (parsedError.detail === "Could not validate credentials") {
            errorMessage = "Authentication error. Please refresh the page and try again."
            // Attempt to refresh the token if needed
            // This depends on how your auth system works
          }
        } catch {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setShowVerifyModal(false)
      setReviewToVerify(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
      </div>
    )
  }

  if (!token || !user) {
    return (
      <div className="flex">
        <SellerSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="text-red-600 text-xl">Authentication required. Please log in.</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex">
        <SellerSidebar />
        <div className="flex-1 md:ml-64 p-6 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product reviews...</p>
          {user && <p className="text-sm text-gray-500"></p>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex">
        <SellerSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="text-red-600 text-xl">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <SellerSidebar />

      <div className="flex-1 md:ml-64 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Reviews</h1>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by product ID, title or rating..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value)
                      // Auto-search as user types
                      setSearchQuery(e.target.value)

                      // If search is cleared, reset to original data
                      if (e.target.value === "") {
                        setSearchQuery("")
                      }
                    }}
                    className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter by Rating</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRatingFilter(null)}
                className={`px-4 py-2 rounded-md ${
                  ratingFilter === null
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    ratingFilter === rating
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {rating} <Star className="w-4 h-4 ml-1 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Reviews Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("product_id")}
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("user_name")}
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("rating")}
                    >
                      Rating
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Comment
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {productId ? "No reviews found for this product." : "No reviews found for your products."}
                      </td>
                    </tr>
                  ) : (
                    reviews.map((review) => {
                      const product = products[review.product_id]

                      return (
                        <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="w-5 h-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product?.title || "Unknown Product"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {review.product_id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {review.user_avatar ? (
                                <img
                                  src={review.user_avatar || "/placeholder.svg"}
                                  alt={review.user_name}
                                  className="w-8 h-8 rounded-full mr-2 object-cover"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-2"
                                  style={{
                                    backgroundColor: `hsl(${review.user_name.charCodeAt(0) * 10}, 70%, 50%)`,
                                  }}
                                >
                                  {review.user_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-sm text-gray-900 dark:text-white">{review.user_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{renderStarRating(review.rating)}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {review.comment}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(review.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {review.verified ? (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">Verified</span>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400">Unverified</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleToggleVerified(review)}
                                className={`${
                                  review.verified
                                    ? "text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                                    : "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                }`}
                                title={review.verified ? "Unverify Review" : "Verify Review"}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Verify Confirmation Modal */}
      {showVerifyModal && reviewToVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {reviewToVerify.verified ? "Unverify Review" : "Verify Review"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {reviewToVerify.verified
                ? "Are you sure you want to mark this review as unverified?"
                : "Are you sure you want to mark this review as verified? Verified reviews may appear more prominently."}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmVerify}
                disabled={isProcessing}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${
                  reviewToVerify.verified ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span>
                    {reviewToVerify.verified ? "Unverifying..." : "Verifying..."}
                  </>
                ) : reviewToVerify.verified ? (
                  "Unverify"
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerProductReviewsPage
