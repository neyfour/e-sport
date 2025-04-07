import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

// Get user's cart from backend
export const getUserCart = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error fetching user cart:", error)
    throw error
  }
}

// Sync cart with backend
export const syncCart = async (cartItems: any[], token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/cart/sync`,
      { items: cartItems },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error("Error syncing cart:", error)
    throw error
  }
}

// Add item to cart
export const addToCart = async (productId: string, quantity: number, variantId: string | null, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/cart/add`,
      {
        product_id: productId,
        quantity,
        variant_id: variantId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error("Error adding item to cart:", error)
    throw error
  }
}

// Remove item from cart
export const removeFromCart = async (itemId: string, token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/cart/item/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error removing item from cart:", error)
    throw error
  }
}

// Update cart item quantity
export const updateCartItemQuantity = async (itemId: string, quantity: number, token: string) => {
  try {
    const response = await axios.put(
      `${API_URL}/cart/item/${itemId}`,
      { quantity },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error("Error updating cart item quantity:", error)
    throw error
  }
}

// Clear cart
export const clearCart = async (token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/cart/clear`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error clearing cart:", error)
    throw error
  }
}

