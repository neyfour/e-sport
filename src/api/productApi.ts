import { api } from "../config/db"
import type { Product } from "../types"
import { useStore } from "../store"
import { getProductReviews } from "./reviewApi"

// Get all products with optional filters
export const getProducts = async (filters = {}, fetchAll = false) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams()

    // Process seller_id specifically to ensure it's in the correct format
    if (filters.seller_id) {
      // Make sure we're using the string version of the ID
      queryParams.append("seller_id", filters.seller_id.toString())

      // Remove from filters object to avoid duplication
      const { seller_id, ...restFilters } = filters
      filters = restFilters
    }

    // Add each remaining filter to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString())
      }
    })

    // Always set a high limit to ensure we get all products
    queryParams.append("limit", "10000") // Set an extremely high limit
    queryParams.append("skip", "0") // Start from the beginning

    const queryString = queryParams.toString()
    const endpoint = queryString ? `${api.url}/products?${queryString}` : `${api.url}/products`

    console.log("Fetching products from endpoint:", endpoint)

    // Add a cache-busting parameter to prevent caching
    const cacheBuster = `&_=${Date.now()}`
    const finalEndpoint = endpoint + (endpoint.includes("?") ? cacheBuster : `?${cacheBuster.substring(1)}`)

    console.log("Final endpoint with cache buster:", finalEndpoint)

    const response = await fetch(finalEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
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

    const data = await response.json()
    console.log(`API returned ${data.length} products`)
    return data
  } catch (error) {
    console.error("Error in getProducts:", error)
    throw error
  }
}

// Get a single product by ID
export const getProductById = async (productId: string) => {
  try {
    const token = useStore.getState().token

    const response = await fetch(`${api.url}/products/${productId}`, {
      method: "GET",
      headers: token ? api.getHeaders(token) : {},
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to get product" }))
      throw new Error(errorData.detail || "Failed to get product")
    }

    const product = await response.json()

    // Fetch reviews for the product
    try {
      const reviews = await getProductReviews(productId)

      // Calculate average rating and reviews count
      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = totalRating / reviews.length

        // Attach reviews and updated rating to the product object
        return {
          ...product,
          reviews,
          reviews_count: reviews.length,
          rating: averageRating || product.rating || 0,
        }
      }

      return { ...product, reviews: reviews || [] }
    } catch (reviewsError) {
      console.warn("Error fetching reviews for product:", productId, reviewsError)
      return { ...product, reviews: [] }
    }
  } catch (error) {
    console.error("Error getting product:", error)
    throw error
  }
}

// Get product categories
export const getProductCategories = async (token?: string): Promise<string[]> => {
  try {
    const response = await fetch(`${api.url}/products/categories`, {
      headers: token ? api.getHeaders(token) : {},
    })

    if (!response.ok) {
      throw new Error(`Error fetching categories: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching categories:", error)
    // Return default categories if API fails
    return ["Soccer", "Basketball", "Running", "Tennis", "Fitness", "Swimming", "Cycling", "Yoga"]
  }
}

// Create a new product - Fixed to properly handle errors and format data
export const createProduct = async (productData: any, token: string) => {
  try {
    console.log("Creating product with data:", productData)

    // Make sure we're sending the right data structure
    const formattedData = {
      title: productData.title,
      description: productData.description,
      category: productData.category,
      price: Number(productData.price),
      stock: Number(productData.stock),
      image_url: productData.image_url || "/placeholder.svg?height=300&width=400",
      brand: productData.brand || "",
      variants: Array.isArray(productData.variants) ? productData.variants : [],
      specifications: productData.specifications || {},
      shipping_info: productData.shipping_info || "Free shipping on orders over $100",
      warranty: productData.warranty || "2 year warranty",
      return_policy: productData.return_policy || "30 day returns",
    }

    // Send request to the correct endpoint without /api
    const response = await fetch(`${api.url}/products`, {
      method: "POST",
      headers: api.getHeaders(token),
      body: JSON.stringify(formattedData),
    })

    // Log the response status for debugging
    console.log("Response status:", response.status)

    // Always try to parse the response as JSON
    const data = await response.json().catch((e) => {
      console.error("Failed to parse response as JSON:", e)
      return { detail: "Unknown error occurred" }
    })

    console.log("Response data:", data)

    if (!response.ok) {
      // Extract error message from response
      const errorMessage = data.detail || JSON.stringify(data)
      throw new Error(errorMessage)
    }

    return data
  } catch (error) {
    console.error("Error in createProduct:", error)
    throw error
  }
}

// Update an existing product
export const updateProduct = async (productId: string, productData: any, token: string) => {
  try {
    // Format the data properly
    const formattedData = {
      title: productData.title,
      description: productData.description,
      category: productData.category,
      price: Number(productData.price),
      stock: Number(productData.stock),
      image_url: productData.image_url || "/placeholder.svg?height=300&width=400",
      brand: productData.brand || "",
      variants: Array.isArray(productData.variants) ? productData.variants : [],
      specifications: productData.specifications || {},
      shipping_info: productData.shipping_info || "Free shipping on orders over $100",
      warranty: productData.warranty || "2 year warranty",
      return_policy: productData.return_policy || "30 day returns",
    }

    // Use api.url and api.getHeaders for consistency
    const response = await fetch(`${api.url}/products/${productId}`, {
      method: "PUT",
      headers: api.getHeaders(token),
      body: JSON.stringify(formattedData),
    })

    // Log the response status for debugging
    console.log("Update response status:", response.status)

    const data = await response.json().catch((e) => {
      console.error("Failed to parse update response as JSON:", e)
      return { detail: "Unknown error occurred" }
    })

    if (!response.ok) {
      const errorMessage = data.detail || JSON.stringify(data)
      throw new Error(errorMessage)
    }

    return data
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

// Delete a product
export const deleteProduct = async (productId: string, token: string) => {
  try {
    const response = await fetch(`${api.url}/products/${productId}`, {
      method: "DELETE",
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to delete product" }))
      throw new Error(errorData.detail || "Failed to delete product")
    }

    return await response.json()
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Upload product image
export const uploadProductImage = async (file: File, token: string) => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${api.url}/products/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to upload image" }))
      throw new Error(errorData.detail || "Failed to upload image")
    }

    return await response.json()
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Mock products data for fallback (keeping the existing implementation)
export const getMockProducts = (category?: string): Product[] => {
  // Make sure all products have valid image URLs
  const ensureValidImageUrl = (url: string) => {
    // If URL is empty or invalid, return a placeholder
    if (!url || url.trim() === "" || !url.startsWith("http")) {
      return `/placeholder.svg?height=300&width=400&text=${encodeURIComponent("Product Image")}`
    }
    return url
  }

  const allProducts = [
    // Soccer Products
    {
      id: "soccer-1",
      user_id: "seller1",
      title: "Professional Soccer Ball - World Cup Edition",
      description:
        "Official match ball used in international tournaments with premium materials for optimal performance and durability.",
      price: 59.99,
      image_url: ensureValidImageUrl(
        "https://images.unsplash.com/photo-1614632537423-5e1c478e56c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      ),
      category: "Soccer",
      stock: 35,
      rating: 4.8,
      reviews_count: 152,
      views_count: 1850,
      clicks_count: 1200,
      sales_count: 95,
      sku: "SC-BL-001",
      brand: "GoalMaster",
      created_at: "2023-04-12T00:00:00Z",
      shipping_info: "Free shipping on orders over $50",
      warranty: "1 year warranty",
      return_policy: "30 day returns",
    },
    // Additional mock products would be here
  ]

  // Process all products to ensure valid image URLs
  const processedProducts = allProducts.map((product) => ({
    ...product,
    image_url: ensureValidImageUrl(product.image_url),
  }))

  // If a category is specified, filter products by that category
  if (category && category !== "all") {
    return processedProducts.filter((product) => product.category.toLowerCase() === category.toLowerCase())
  }

  // Otherwise return all products
  return processedProducts
}

// Search products
export const searchProducts = async (searchQuery: string, token: string): Promise<Product[]> => {
  try {
    const response = await fetch(`${api.url}/products/search?q=${searchQuery}`, {
      method: "GET",
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`Failed to search products: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error searching products:", error)
    throw error
  }
}

