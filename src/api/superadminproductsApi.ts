import { api } from "../config/db"

// Get all products with pagination, search, and filtering
export const getAllProducts = async (
  token: string,
  page = 1,
  limit = 50,
  search?: string,
  category?: string,
  sortBy = "created_at",
  sortOrder = "desc",
) => {
  const skip = (page - 1) * limit
  let url = `${api.url}/sa_products/all?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`

  if (search) {
    url += `&search=${encodeURIComponent(search)}`
  }

  if (category) {
    url += `&category=${encodeURIComponent(category)}`
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching products:", error)
    // Return empty array instead of throwing to prevent UI crashes
    return []
  }
}

// Get product count for pagination
export const getProductsCount = async (token: string, search?: string, category?: string) => {
  let url = `${api.url}/sa_products/count`

  if (search || category) {
    url += "?"
    if (search) {
      url += `search=${encodeURIComponent(search)}&`
    }
    if (category) {
      url += `category=${encodeURIComponent(category)}`
    }
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.count
  } catch (error) {
    console.error("Error fetching product count:", error)
    return 0
  }
}

// Get detailed product information
export const getProductDetails = async (token: string, productId: string) => {
  try {
    const response = await fetch(`${api.url}/sa_products/${productId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching product details:", error)
    throw error
  }
}

// Delete a product
export const deleteProduct = async (token: string, productId: string) => {
  try {
    const response = await fetch(`${api.url}/sa_products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

