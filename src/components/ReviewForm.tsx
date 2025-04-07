"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { submitReview } from "../api/reviewApi"
import { useStore } from "../store"
import toast from "react-hot-toast"

interface ReviewFormProps {
  productId: string
  productImage?: string
  onReviewSubmitted: () => void
  onCancel: () => void
}

export default function ReviewForm({ productId, productImage, onReviewSubmitted, onCancel }: ReviewFormProps) {
  const { user, token } = useStore()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  // Check token on component mount
  useEffect(() => {
    if (user && !token) {
      console.warn("User is logged in but token is missing")
    }
  }, [user, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !token) {
      toast.error("You must be logged in to submit a review")
      return
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars")
      return
    }

    if (!comment.trim()) {
      toast.error("Please enter a review comment")
      return
    }

    try {
      setIsSubmitting(true)

      // Check if user has an ID before submitting
      const userId = user.id || user._id
      if (!userId) {
        toast.error("User ID is missing. Please log in again.")
        return
      }

      // Create review data object
      const reviewData = {
        product_id: productId,
        user_id: userId,
        rating: rating,
        comment: comment,
        user_name: user.username || user.full_name || "Anonymous",
        user_avatar: user.avatar_url,
        created_at: new Date().toISOString(),
      }

      // Try to submit the review with the token from the store
      await submitReview(reviewData, token)
      toast.success("Your review has been submitted!")
      onReviewSubmitted()
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast.error(error.message || "Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
                title={`${star} star${star !== 1 ? "s" : ""}`}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {rating === 1
                ? "Poor"
                : rating === 2
                  ? "Fair"
                  : rating === 3
                    ? "Good"
                    : rating === 4
                      ? "Very Good"
                      : "Excellent"}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Review
          </label>
          <textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  )
}

