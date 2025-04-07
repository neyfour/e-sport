

import { api } from "../config/db"
import type { Review } from "../types"

// Get reviews for a product
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    console.log("Fetching reviews for product ID:", productId)

    // Convert string ID to ObjectId if needed
    // Some MongoDB implementations require ObjectId format
    const formattedProductId = productId

    const response = await fetch(`${api.url}/reviews/product/${formattedProductId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    // Log the raw response for debugging
    console.log("API Response status:", response.status)
    console.log("API Response URL:", response.url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response text:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.detail || "Failed to get reviews")
      } catch (parseError) {
        throw new Error("Failed to get reviews: " + errorText)
      }
    }

    const responseText = await response.text()
    console.log("Raw response text:", responseText)

    let data
    try {
      data = responseText ? JSON.parse(responseText) : []
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError)
      return []
    }

    console.log("Reviews data received:", data)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching product reviews:", error)
    throw error
  }
}

// Submit a new review
export const submitReview = async (reviewData: Partial<Review>, token: string): Promise<Review> => {
  try {
    console.log("Submitting review data:", JSON.stringify(reviewData))

    // Use the api.getHeaders function directly since it's working for other API calls
    const headers = api.getHeaders(token)
    console.log(
      "Headers being used:",
      JSON.stringify({
        ...headers,
        Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 15)}...` : "undefined",
      }),
    )

    const response = await fetch(`${api.url}/reviews`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(reviewData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to submit review" }))
      console.error("API error response:", JSON.stringify(errorData)) // Log the error detail
      throw new Error(JSON.stringify(errorData)) // Pass the stringified error
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error submitting review:", error)
    throw error
  }
}

// Update a review
export const updateReview = async (reviewId: string, reviewData: Partial<Review>, token: string): Promise<Review> => {
  try {
    console.log("Updating review:", reviewId, "with data:", JSON.stringify(reviewData))

    // Get the headers with authentication token
    const headers = api.getHeaders(token)
    console.log("Authorization header:", headers.Authorization) // Log the Authorization header

    // Make the API request
    const response = await fetch(`${api.url}/reviews/${reviewId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({
        // Include all required fields from the ReviewModel
        verified: reviewData.verified,
        user_id: reviewData.user_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        product_id: reviewData.product_id,
        user_name: reviewData.user_name,
        user_avatar: reviewData.user_avatar,
      }),
    })

    // Log response status for debugging
    console.log("Update response status:", response.status)

    if (!response.ok) {
      // Try to get the error message as text first
      const errorText = await response.text()
      console.error("Error response text:", errorText)

      try {
        // Try to parse as JSON if possible
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.detail || "Failed to update review")
      } catch (parseError) {
        // If parsing fails, use the raw text
        throw new Error("Failed to update review: " + errorText)
      }
    }

    // Parse the successful response
    const responseText = await response.text()
    let data

    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError)
      return {} as Review
    }

    return data
  } catch (error) {
    console.error("Error updating review:", error)
    throw error
  }
}

// Delete a review
export const deleteReview = async (reviewId: string, token: string): Promise<boolean> => {
  try {
    console.log("Deleting review:", reviewId)

    const response = await fetch(`${api.url}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: api.getHeaders(token),
    })

    console.log("Delete response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to delete review" }))
      throw new Error(errorData.detail || "Failed to delete review")
    }

    return true
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}