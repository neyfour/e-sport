import axios from "axios"

// Define the base URL for API requests
const API_BASE_URL = "http://localhost:8000"

// Define types for the API responses
export interface SellerDashboardData {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  averageOrderValue: number
  revenueByMonth: { month: string; revenue: number }[]
  topProducts: { name: string; revenue: number }[]
  categoryDistribution: { category: string; percentage: number }[]
  revenueBreakdown: { source: string; percentage: number }[]
  customerDemographics: { age: string; percentage: number }[]
}

export interface SellerOverviewData {
  product_count: number
  orders: {
    total: number
    today: number
    this_month: number
    by_status: {
      pending: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
    }
  }
  revenue: {
    total: number
    today: number
    this_month: number
    growth: number
  }
  monthly_data: {
    month: string
    revenue: number
    orders: number
  }[]
  top_products: {
    product_id: string
    name: string
    category: string
    total_quantity: number
    total_revenue: number
    order_count: number
    image_url: string
  }[]
  daily_sales: {
    name: string
    sales: number
  }[]
  category_distribution: Record<string, number>
  performance_trend: {
    name: string
    value: number
  }[]
  profit_margin: number
}

export interface ProductStatistics {
  product_id: string
  name: string
  category: string
  price: number
  stock: number
  total_orders: number
  total_quantity: number
  total_revenue: number
  image_url: string
}

export interface OrderStatistics {
  total_orders: number
  total_revenue: number
  status_distribution: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  daily_data: {
    date: string
    orders: number
    revenue: number
  }[]
}

export interface CustomerStatistics {
  customer_id: string
  name: string
  email: string
  total_orders: number
  total_spent: number
  last_order_date: string
}

export interface GeographicStatistics {
  country: string
  order_count: number
  total_revenue: number
}

// Function to get seller statistics
export const getSellerStatistics = async (sellerId: string, period = "all"): Promise<SellerDashboardData> => {
  try {
    console.log(`Fetching seller statistics for seller ID: ${sellerId}, period: ${period}`)
    // Make API request with seller ID
    const response = await axios.get(
      `${API_BASE_URL}/sellerstatistic/statistics?seller_id=${sellerId}&period=${period}`,
    )
    console.log("Seller statistics response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching seller statistics:", error)
    throw error
  }
}

// Function to get seller overview statistics
export const getSellerOverview = async (sellerId: string, period = "month"): Promise<SellerOverviewData> => {
  try {
    console.log(`Fetching seller overview for seller ID: ${sellerId}, period: ${period}`)
    // Make API request with seller ID
    const response = await axios.get(`${API_BASE_URL}/sellerstatistic/overview?seller_id=${sellerId}&period=${period}`)
    console.log("Seller overview response:", response.data)

    // Check if we're getting mock data
    if (
      response.data.product_count === 25 &&
      response.data.orders.total === 120 &&
      response.data.revenue.total === 250000
    ) {
      console.warn("WARNING: Received mock data instead of real data from the database")
    }

    // Use the profit margin directly from the backend response
    // No need to recalculate it in the frontend
    console.log(`Using profit margin from backend: ${response.data.profit_margin}%`)

    return response.data
  } catch (error) {
    console.error("Error fetching seller overview:", error)
    throw error
  }
}

// Function to get product statistics
export const getProductStatistics = async (sellerId: string, period = "all"): Promise<ProductStatistics[]> => {
  try {
    console.log(`Fetching product statistics for seller ID: ${sellerId}, period: ${period}`)
    // Make API request with seller ID
    const response = await axios.get(`${API_BASE_URL}/sellerstatistic/products?seller_id=${sellerId}&period=${period}`)
    console.log("Product statistics response:", response.data)

    // Check if we're getting mock data
    if (
      response.data.length === 3 &&
      response.data[0].name === "Luxury Apartment Downtown" &&
      response.data[1].name === "Beachfront Villa"
    ) {
      console.warn("WARNING: Received mock product data instead of real data from the database")
    }

    return response.data
  } catch (error) {
    console.error("Error fetching product statistics:", error)
    throw error
  }
}

// Function to get order statistics
export const getOrderStatistics = async (sellerId: string, period = "all"): Promise<OrderStatistics> => {
  try {
    console.log(`Fetching order statistics for seller ID: ${sellerId}, period: ${period}`)
    // Make API request with seller ID
    const response = await axios.get(`${API_BASE_URL}/sellerstatistic/orders?seller_id=${sellerId}&period=${period}`)
    console.log("Order statistics response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching order statistics:", error)
    throw error
  }
}

// Function to get customer statistics
export const getCustomerStatistics = async (sellerId: string, period = "all"): Promise<CustomerStatistics[]> => {
  try {
    console.log(`Fetching customer statistics for seller ID: ${sellerId}, period: ${period}`)
    // Make API request with seller ID
    const response = await axios.get(`${API_BASE_URL}/sellerstatistic/customers?seller_id=${sellerId}&period=${period}`)
    console.log("Customer statistics response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching customer statistics:", error)
    throw error
  }
}

// Function to get geographic statistics

// Add a debug function to check database connection

export const debugDatabaseConnection = async (sellerId: string): Promise<any> => {
  try {
    console.log(`Checking database connection for seller ID: ${sellerId}`)
    const response = await axios.get(`${API_BASE_URL}/sellerstatistic/debug?seller_id=${sellerId}`)
    console.log("Database debug response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error checking database connection:", error)
    throw error
  }
}

