import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

// Get user's wishlist from backend
export const getUserWishlist = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/wishlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error fetching user wishlist:", error)
    throw error
  }
}

// Sync wishlist with backend
export const syncWishlist = async (wishlistItems: any[], token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/wishlist/sync`,
      { items: wishlistItems },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error("Error syncing wishlist:", error)
    throw error
  }
}

// Add item to wishlist
export const addToWishlist = async (productId: string, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/wishlist/add`,
      { product_id: productId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error("Error adding item to wishlist:", error)
    throw error
  }
}

// Remove item from wishlist
export const removeFromWishlist = async (itemId: string, token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/wishlist/item/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error removing item from wishlist:", error)
    throw error
  }
}

// Clear wishlist
export const clearWishlist = async (token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/wishlist/clear`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error clearing wishlist:", error)
    throw error
  }
}

