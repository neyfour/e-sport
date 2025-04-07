export interface OrderItem {
  product_id: string
  seller_id: string
  quantity: number
  price: number
  product_name: string
  product_image: string
  product?: {
    _id: string
    name: string
    image_url: string
  }
  seller?: {
    _id: string
    username: string
    email: string
  }
}

export interface Order {
  _id: string
  user_id: string
  items: OrderItem[]
  total: number
  status: string
  payment_status: string
  created_at: string
  shipping_address?: any
  billing_address?: any
  tracking_number?: string
  carrier?: string
  user?: {
    _id: string
    username: string
    email: string
  }
}

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Create a new order
export const createOrder = async (orderData: any, token: string) => {
  try {
    console.log("Creating order with API URL:", API_URL)
    console.log("Order data:", JSON.stringify(orderData))

    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to create order: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating order:", error)

    // For development/testing, return a mock order if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock order response for development")
      return {
        _id: `mock_order_${Date.now()}`,
        user_id: orderData.user_id,
        items: orderData.items,
        total: orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
        status: "pending",
        payment_status: "pending",
        created_at: new Date().toISOString(),
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
      }
    }

    throw error
  }
}

// Get all orders for the current user
export const getUserOrders = async (token: string, status?: string, skip = 0, limit = 50) => {
  try {
    let url = `${API_URL}/orders?skip=${skip}&limit=${limit}`
    if (status) {
      url += `&status=${status}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to get user orders: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting user orders:", error)

    // For development/testing, return mock orders if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock orders response for development")
      return []
    }

    throw error
  }
}

// Get order details by ID
export const getOrderById = async (orderId: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to get order details: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting order details:", error)

    // For development/testing, return a mock order if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock order details for development")
      return {
        _id: orderId,
        user_id: "mock_user_id",
        items: [],
        total: 0,
        status: "pending",
        payment_status: "pending",
        created_at: new Date().toISOString(),
      }
    }

    throw error
  }
}

// Update order status
// Update the updateOrderStatus function to accept a token parameter instead of trying to get it internally
export const updateOrderStatus = async (orderId: string, status: string, token: string): Promise<Order> => {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to update order status: ${response.status} ${response.statusText}`)
    }

    const updatedOrder = await response.json()
    return updatedOrder
  } catch (error) {
    console.error("Error updating order status:", error)

    // For development/testing, return a mock updated order if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock order status update for development")
      return {
        _id: orderId,
        user_id: "mock_user_id",
        items: [],
        total: 0,
        status: status,
        payment_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Order
    }

    throw error
  }
}

// Add tracking information to an order
export const addOrderTracking = async (
  orderId: string,
  trackingData: { tracking_number: string; carrier?: string },
  token: string,
) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(trackingData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail || `Failed to add tracking information: ${response.status} ${response.statusText}`,
      )
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding tracking information:", error)

    // For development/testing, return a mock updated order if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock tracking update for development")
      return {
        _id: orderId,
        user_id: "mock_user_id",
        items: [],
        total: 0,
        status: "shipped",
        payment_status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tracking_number: trackingData.tracking_number,
        carrier: trackingData.carrier,
      }
    }

    throw error
  }
}

// Add tracking update to an order
export const addTrackingUpdate = async (
  orderId: string,
  updateData: { status: string; location: string; description?: string },
  token: string,
) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/tracking-updates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to add tracking update: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding tracking update:", error)

    // For development/testing, return a mock updated order if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock tracking update for development")
      return {
        _id: orderId,
        user_id: "mock_user_id",
        items: [],
        total: 0,
        status: updateData.status,
        payment_status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tracking_updates: [
          {
            status: updateData.status,
            location: updateData.location,
            description: updateData.description || "",
            timestamp: new Date().toISOString(),
          },
        ],
      }
    }

    throw error
  }
}

// Get order count
export const getOrderCount = async (token: string, status?: string): Promise<{ count: number }> => {
  try {
    const queryParams = new URLSearchParams()
    if (status) queryParams.append("status", status)

    // Add cache-busting parameter
    queryParams.append("_t", Date.now().toString())

    const response = await fetch(`${API_URL}/orders/count?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to fetch order count: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching order count:", error)

    // For development/testing, return a mock count if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock order count for development")
      return { count: 0 }
    }

    throw error
  }
}

// Track order by order number
export const trackOrder = async (orderNumber: string) => {
  try {
    const response = await fetch(`${API_URL}/orders/track/${orderNumber}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to track order: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error tracking order:", error)

    // For development/testing, return a mock tracking result if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock tracking result for development")
      return {
        _id: `mock_order_${orderNumber}`,
        status: "shipped",
        tracking_number: "MOCK123456789",
        carrier: "Mock Carrier",
        tracking_history: [
          {
            status: "shipped",
            location: "Warehouse",
            description: "Package has left the warehouse",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            status: "in_transit",
            location: "Distribution Center",
            description: "Package is in transit",
            timestamp: new Date().toISOString(),
          },
        ],
      }
    }

    throw error
  }
}

// Modify the getSellerOrders function to accept a token parameter
export const getSellerOrders = async (token: string, status?: string, limit = 50, skip = 0): Promise<Order[]> => {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const queryParams = new URLSearchParams()
    if (status) queryParams.append("status", status)
    queryParams.append("limit", limit.toString())
    queryParams.append("skip", skip.toString())

    // Add cache-busting parameter
    queryParams.append("_t", Date.now().toString())

    const response = await fetch(`${API_URL}/orders?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to fetch seller orders: ${response.status} ${response.statusText}`)
    }

    const orders = await response.json()
    return orders
  } catch (error) {
    console.error("Error fetching seller orders:", error)

    // For development/testing, return mock orders if API fails
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock seller orders for development")
      return []
    }

    throw error
  }
}

