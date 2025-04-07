"use client"

import { useState, useEffect } from "react"
import { Star, ThumbsUp, ChevronDown } from "lucide-react"
import { getProductReviews } from "../api/reviewApi"
import { useStore } from "../store"
import type { Review } from "../types"

interface ReviewsListProps {
  productId: string
  initialReviews?: Review[]
  onWriteReviewClick: () => void
}

export default function ReviewsList({ productId, initialReviews = [], onWriteReviewClick }: ReviewsListProps) {
  const { user } = useStore()
  const [reviews, setReviews] = useState<Review[]>(initialReviews || [])
  const [loading, setLoading] = useState(initialReviews?.length === 0)
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest")

  useEffect(() => {
    if (initialReviews?.length > 0) {
      setReviews(initialReviews)
      return
    }

    const fetchReviews = async () => {
      setLoading(true)
      try {
        const data = await getProductReviews(productId)
        setReviews(data || [])
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [productId, initialReviews])

  // Calculate rating distribution
  const ratingCounts = reviews.reduce(
    (acc, review) => {
      const rating = Math.floor(review.rating)
      if (rating >= 1 && rating <= 5) {
        acc[rating - 1]++
      }
      return acc
    },
    [0, 0, 0, 0, 0],
  )

  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0

  // Sort reviews based on selected criteria
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === "highest") {
      return b.rating - a.rating
    } else {
      return a.rating - b.rating
    }
  })

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
        {user && (
          <button
            onClick={onWriteReviewClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div>
          {/* Rating Summary */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Average Rating */}
              <div className="flex flex-col items-center justify-center md:border-r md:dark:border-gray-700 md:pr-6">
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{averageRating.toFixed(1)}</div>
                <div className="flex mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{totalReviews} reviews</div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingCounts[rating - 1]
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <div className="flex items-center w-12">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{rating}</span>
                          <Star className="w-4 h-4 ml-1 text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="w-12 text-right text-sm text-gray-600 dark:text-gray-400">
                          {count} ({percentage.toFixed(0)}%)
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-4 pr-10 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {sortedReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {review.user_avatar ? (
                      <img
                        src={review.user_avatar || "/placeholder.svg"}
                        alt={review.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          backgroundColor: `hsl(${review.user_name.charCodeAt(0) * 10}, 70%, 50%)`,
                        }}
                      >
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mr-2">{review.user_name}</h4>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {review.verified ? "Verified Purchase • " : ""}
                      {formatDate(review.created_at)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                    <button className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful ({review.helpful_count || 0})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No reviews yet. Be the first to review this product!</p>
          {user && (
            <button
              onClick={onWriteReviewClick}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      )}
    </div>
  )
}

