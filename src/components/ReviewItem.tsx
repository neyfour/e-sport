"use client"

import { Star, ThumbsUp, RefreshCw } from "lucide-react"
import { formatDate } from "../utils/formatDate"
import type { Review } from "../types"
import React from "react"
import { useStore } from "../store"
import { updateReview, deleteReview } from "../api"
import { toast } from "react-toastify"

interface ReviewItemProps {
  review: Review
  onReviewUpdated: () => void
  onReviewDeleted: () => void
}

export default function ReviewItem({ review, onReviewUpdated, onReviewDeleted }: ReviewItemProps) {
  const [isVerified, setIsVerified] = React.useState(review.verified || false)
  const { token } = useStore()
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleToggleVerified = async () => {
    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      setIsUpdating(true)
      // Toggle the verified status
      const newVerifiedStatus = !isVerified

      // Update the review using the updateReview API function
      await updateReview(review.id, { verified: newVerifiedStatus }, token)

      // Update the local state
      setIsVerified(newVerifiedStatus)

      // Notify the parent component that the review has been updated
      onReviewUpdated()

      toast.success(`Review ${newVerifiedStatus ? "activated" : "deactivated"}`)
    } catch (error) {
      console.error("Error updating review:", error)
      toast.error("Failed to update review")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteReview = async () => {
    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      setIsDeleting(true)
      // Delete the review using the deleteReview API function
      await deleteReview(review.id, token)

      // Notify the parent component that the review has been deleted
      onReviewDeleted()

      toast.success("Review deleted successfully")
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Failed to delete review")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          {review.user_avatar ? (
            <img
              src={review.user_avatar || "/placeholder.svg"}
              alt={review.user_name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `/placeholder.svg?height=40&width=40&text=${review.user_name.charAt(0)}`
              }}
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold`}
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
                    star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {isVerified ? "Verified Purchase • " : ""}
            {formatDate(review.created_at)}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <button className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400">
              <ThumbsUp className="w-4 h-4" />
              Helpful ({review.helpful_count || 0})
            </button>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleToggleVerified}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isUpdating ? "opacity-50 cursor-not-allowed" : ""
            } ${
              isVerified
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {isUpdating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : isVerified ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={handleDeleteReview}
            disabled={isDeleting}
            className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isDeleting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

