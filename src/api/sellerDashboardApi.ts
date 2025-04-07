// src/api/sellerDashboardApi.ts
import { api } from "../config/db"

// Types for seller dashboard data
export interface SellerDashboardData {
  product_count: number
  orders: {
    today: number
    yesterday: number
    this_month: number
    last_month: number
    total: number
    change: {
      daily: number
      monthly: number
    }
  }
  revenue: {
    today: number
    yesterday: number
    this_month: number
    last_month: number
    total: number
    change: {
      daily: number
      monthly: number
    }
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
    image_url: string
  }[]
  platform_stats?: {
    customer_count: number
    seller_count: number
    pending_applications: number
  }
}

export interface SellerStatisticsHistory {
  _id: string
  date: string
  seller_id: string
  product_count: number
  today_orders: number
  today_revenue: number
  this_month_orders: number
  this_month_revenue: number
  total_revenue: number
  total_orders: number
  created_at: string
}

export interface SellerPredictionData {
  revenueForecasts: { period: string; amount: number }[]
  growthRate: number
  productPerformance: { product: string; score: number }[]
  successProbability: number
  categoryDistribution: { category: string; percentage: number }[]
  recommendations: string[]
}

// Helper function to check if a token is valid
const isValidToken = (token: string): boolean => {
  if (!token) return false

  // Check if token has a reasonable length
  if (token.length < 10) return false

  // Check if token is in JWT format (three parts separated by dots)
  if (token.startsWith("Bearer ")) {
    const actualToken = token.split(" ")[1]
    return actualToken.split(".").length === 3
  }

  return token.split(".").length === 3
}

// Update the getSellerDashboardOverview function to better handle token formatting
export const getSellerDashboardOverview = async (token: string, sellerId?: string): Promise<SellerDashboardData> => {
  if (!token) {
    throw new Error("Authentication token is required")
  }

  // Validate token format
  if (!isValidToken(token)) {
    console.error("Invalid token format:", token.substring(0, 10) + "...")
    throw new Error("Invalid token format")
  }

  // Ensure token is properly formatted
  let formattedToken = token
  if (!token.startsWith("Bearer ")) {
    formattedToken = `Bearer ${token}`
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: formattedToken,
  }

  try {
    // Use the sellerdashboard endpoint
    const url = new URL(`${api.url}/sellerdashboard/dashboard`)

    // Always pass the seller_id parameter if available to ensure we get data for the correct seller
    if (sellerId) {
      url.searchParams.append("seller_id", sellerId)
    }

    // Add a cache buster to prevent caching of dashboard data
    url.searchParams.append("_", Date.now().toString())

    console.log("Making API request to:", url.toString())
    console.log("With headers:", {
      "Content-Type": "application/json",
      Authorization: formattedToken.substring(0, 15) + "...", // Log partial token for security
    })

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      // Add credentials to include cookies if needed
      credentials: "include",
    })

    if (!response.ok) {
      // Get more detailed error information if available
      let errorMessage = `Error fetching dashboard data: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`
        }
      } catch (e) {
        // If we can't parse the error response, just use the status code
      }

      console.error("Dashboard API error:", errorMessage)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Dashboard API request failed:", error)
    throw error
  }
}

// Function to fetch seller sales predictions
export const getSellerSalesPredictions = async (
  token: string,
  timeframe = "1year",
  sellerId?: string,
): Promise<SellerPredictionData> => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
  }

  // Convert timeframe to days for the backend
  let days = 365 // default for 1year
  if (timeframe === "5years") days = 1825
  if (timeframe === "6months") days = 180

  // Use the correct endpoint from your backend
  // If sellerId is not provided, the backend will use the current user's ID
  const url = sellerId
    ? `${api.url}/predictions/sales/seller/${sellerId}?days=${days}`
    : `${api.url}/predictions/sales/seller/me?days=${days}`

  const response = await fetch(url, {
    method: "GET",
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Sales predictions API error:", errorData)
    throw new Error(`Error fetching sales predictions: ${response.status}`)
  }

  const data = await response.json()
  return transformPredictionData(data, timeframe)
}

// Function to fetch seller product predictions
export const getSellerProductPredictions = async (
  token: string,
  productId: string,
  timeframe = "1year",
): Promise<any> => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
  }

  // Convert timeframe to days for the backend
  let days = 365 // default for 1year
  if (timeframe === "5years") days = 1825
  if (timeframe === "6months") days = 180

  // Use the correct endpoint from your backend
  const response = await fetch(`${api.url}/predictions/sales/${productId}?days=${days}`, {
    method: "GET",
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Product predictions API error:", errorData)
    throw new Error(`Error fetching product predictions: ${response.status}`)
  }

  return await response.json()
}

// Function to fetch seller statistics
export const getSellerStatistics = async (
  token: string,
  period = "all",
  sellerId?: string,
): Promise<SellerDashboardData> => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
  }

  // For history endpoint, we need to convert period to days
  let days = 365 // default for "all"
  if (period === "year") days = 365
  if (period === "month") days = 30
  if (period === "week") days = 7

  // Use the new sellerdashboard endpoint instead of statistics
  const url = new URL(`${api.url}/sellerdashboard/history`)
  url.searchParams.append("days", days.toString())

  // Always pass the seller_id parameter if available
  if (sellerId) {
    url.searchParams.append("seller_id", sellerId)
  }

  // Add a cache buster to prevent caching
  url.searchParams.append("_", Date.now().toString())

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Statistics API error:", errorData)
    throw new Error(`Error fetching statistics: ${response.status}`)
  }

  const data = await response.json()
  return transformHistoryData(data, period)
}

// Also update the other API functions to use the same token formatting
export const getSellerStatisticsHistory = async (
  token: string,
  days = 30,
  sellerId?: string,
): Promise<SellerStatisticsHistory[]> => {
  if (!token) {
    throw new Error("Authentication token is required")
  }

  // Ensure token is properly formatted
  let formattedToken = token
  if (!token.startsWith("Bearer ")) {
    formattedToken = `Bearer ${token}`
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: formattedToken,
  }

  try {
    // Use the sellerdashboard endpoint
    const url = new URL(`${api.url}/sellerdashboard/history`)
    url.searchParams.append("days", days.toString())

    // Always pass the seller_id parameter if available
    if (sellerId) {
      url.searchParams.append("seller_id", sellerId)
    }

    // Add a cache buster to prevent caching
    url.searchParams.append("_", Date.now().toString())

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      // Get more detailed error information if available
      let errorMessage = `Error fetching statistics history: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`
        }
      } catch (e) {
        // If we can't parse the error response, just use the status code
      }

      console.error("Statistics history API error:", errorMessage)
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error("Statistics history API request failed:", error)
    throw error
  }
}

// Transform dashboard data from the backend format to the frontend format
function transformDashboardData(data: any): SellerDashboardData {
  // Extract revenue by month from monthly_data
  const revenueByMonth =
    data.monthly_data?.map((item: any) => ({
      month: item.month,
      revenue: item.revenue,
    })) || []

  // Extract top products
  const topProducts =
    data.top_products?.map((product: any) => ({
      id: product.product_id,
      title: product.name,
      sales: product.total_quantity,
      revenue: product.total_revenue,
    })) || []

  // Calculate average order value
  const averageOrderValue = data.orders.total > 0 ? data.revenue.total / data.orders.total : 0

  // Create category distribution from top products
  const categoryDistribution = []
  const categoryMap = new Map()

  // Calculate total revenue
  const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0)

  // Group by categories and calculate percentages
  topProducts.forEach((product) => {
    const category = product.category || "Uncategorized"
    const currentValue = categoryMap.get(category) || 0
    categoryMap.set(category, currentValue + product.revenue)
  })

  // Convert to array of objects with percentages
  categoryMap.forEach((revenue, category) => {
    categoryDistribution.push({
      category,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    })
  })

  // If no categories, provide default
  if (categoryDistribution.length === 0) {
    categoryDistribution.push({ category: "No Data", percentage: 100 })
  }

  // Create customer demographics from data or default
  const customerDemographics = data.customer_demographics || [{ age: "No Data", percentage: 100 }]

  // Create revenue breakdown from data or default
  const revenueBreakdown = data.revenue_breakdown || [{ source: "Direct Sales", percentage: 100 }]

  return {
    product_count: data.product_count || 0,
    orders: data.orders || {
      today: 0,
      yesterday: 0,
      this_month: 0,
      last_month: 0,
      total: 0,
      change: {
        daily: 0,
        monthly: 0,
      },
    },
    revenue: data.revenue || {
      today: 0,
      yesterday: 0,
      this_month: 0,
      last_month: 0,
      total: 0,
      change: {
        daily: 0,
        monthly: 0,
      },
    },
    monthly_data: data.monthly_data || [],
    top_products: data.top_products || [],
    platform_stats: data.platform_stats,
  }
}

// Transform history data from the backend format to the frontend format
function transformHistoryData(data: any[], period: string): SellerDashboardData {
  // If no data, return empty structure
  if (!data || data.length === 0) {
    return {
      product_count: 0,
      orders: {
        today: 0,
        yesterday: 0,
        this_month: 0,
        last_month: 0,
        total: 0,
        change: {
          daily: 0,
          monthly: 0,
        },
      },
      revenue: {
        today: 0,
        yesterday: 0,
        this_month: 0,
        last_month: 0,
        total: 0,
        change: {
          daily: 0,
          monthly: 0,
        },
      },
      monthly_data: [],
      top_products: [],
      platform_stats: {
        customer_count: 0,
        seller_count: 0,
        pending_applications: 0,
      },
    }
  }

  // Get the most recent statistics
  const latestStats = data[data.length - 1]

  // Create monthly revenue data from the history
  const revenueByMonth = data.map((stat: any) => ({
    month: new Date(stat.date).toLocaleString("default", { month: "short" }),
    revenue: stat.today_revenue || 0,
  }))

  return {
    product_count: latestStats.product_count || 0,
    orders: {
      today: latestStats.today_orders || 0,
      yesterday: 0,
      this_month: latestStats.this_month_orders || 0,
      last_month: 0,
      total: latestStats.total_orders || 0,
      change: {
        daily: 0,
        monthly: 0,
      },
    },
    revenue: {
      today: latestStats.today_revenue || 0,
      yesterday: 0,
      this_month: latestStats.this_month_revenue || 0,
      last_month: 0,
      total: latestStats.total_revenue || 0,
      change: {
        daily: 0,
        monthly: 0,
      },
    },
    monthly_data: revenueByMonth,
    top_products: [], // Will be populated from separate API call if needed
    platform_stats: {
      customer_count: 0,
      seller_count: 0,
      pending_applications: 0,
    },
  }
}

// Transform prediction data from the backend format to the frontend format
function transformPredictionData(data: any, timeframe: string): SellerPredictionData {
  // Group the daily predictions into periods based on the timeframe
  const revenueForecasts = groupPredictionsByTimeframe(data.predicted_revenue || [], timeframe)

  // Calculate growth rate from the prediction data
  const growthRate = calculateGrowthRate(data.predicted_revenue || [])

  // Extract product performance from the products list
  const productPerformance =
    data.products?.map((product: any, index: number) => ({
      product: product.name,
      score: data.confidence ? Math.round(data.confidence * 100) - index * 5 : 50 - index * 5,
    })) || []

  // Use confidence from the backend, scaled to percentage
  const successProbability = Math.round((data.confidence || 0) * 100)

  // Create category distribution from products
  const categoryDistribution = []
  const categoryMap = new Map()

  // If we have products with categories
  if (data.products && data.products.length > 0) {
    // Group by categories
    data.products.forEach((product: any) => {
      const category = product.category || "Uncategorized"
      const currentCount = categoryMap.get(category) || 0
      categoryMap.set(category, currentCount + 1)
    })

    // Calculate total count
    const totalCount = data.products.length

    // Convert to array of objects with percentages
    categoryMap.forEach((count, category) => {
      categoryDistribution.push({
        category,
        percentage: (count / totalCount) * 100,
      })
    })
  }

  // If no categories, provide default
  if (categoryDistribution.length === 0) {
    categoryDistribution.push({ category: "No Data", percentage: 100 })
  }

  // Generate recommendations based on the data
  const recommendations = generateRecommendations(data, productPerformance)

  return {
    revenueForecasts,
    growthRate,
    productPerformance,
    successProbability,
    categoryDistribution,
    recommendations,
  }
}

// Group daily predictions into periods based on the timeframe
function groupPredictionsByTimeframe(
  dailyPredictions: number[],
  timeframe: string,
): { period: string; amount: number }[] {
  if (!dailyPredictions || dailyPredictions.length === 0) {
    return [{ period: "No Data", amount: 0 }]
  }

  const result = []

  if (timeframe === "5years") {
    // Group by years (assuming daily predictions)
    for (let i = 0; i < 5; i++) {
      const yearStart = i * 365
      const yearEnd = Math.min((i + 1) * 365, dailyPredictions.length)
      if (yearStart >= dailyPredictions.length) break

      const yearRevenue = dailyPredictions.slice(yearStart, yearEnd).reduce((sum, val) => sum + val, 0)
      result.push({ period: `Year ${i + 1}`, amount: yearRevenue })
    }
  } else if (timeframe === "1year") {
    // Group by quarters
    for (let i = 0; i < 4; i++) {
      const quarterStart = i * 90
      const quarterEnd = Math.min((i + 1) * 90, dailyPredictions.length)
      if (quarterStart >= dailyPredictions.length) break

      const quarterRevenue = dailyPredictions.slice(quarterStart, quarterEnd).reduce((sum, val) => sum + val, 0)
      result.push({ period: `Q${i + 1}`, amount: quarterRevenue })
    }
  } else if (timeframe === "6months") {
    // Group by months
    for (let i = 0; i < 6; i++) {
      const monthStart = i * 30
      const monthEnd = Math.min((i + 1) * 30, dailyPredictions.length)
      if (monthStart >= dailyPredictions.length) break

      const monthRevenue = dailyPredictions.slice(monthStart, monthEnd).reduce((sum, val) => sum + val, 0)
      result.push({ period: `Month ${i + 1}`, amount: monthRevenue })
    }
  }

  return result.length > 0 ? result : [{ period: "No Data", amount: 0 }]
}

// Calculate growth rate from prediction data
function calculateGrowthRate(dailyPredictions: number[]): number {
  if (!dailyPredictions || dailyPredictions.length < 2) {
    return 0
  }

  const firstHalf = dailyPredictions.slice(0, Math.floor(dailyPredictions.length / 2))
  const secondHalf = dailyPredictions.slice(Math.floor(dailyPredictions.length / 2))

  const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

  if (firstHalfAvg === 0) return 0

  const growthRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
  return Math.round(growthRate)
}

// Generate recommendations based on prediction data
function generateRecommendations(data: any, productPerformance: any[]): string[] {
  // Real estate specific recommendations
  const recommendations = [
    "Focus on properties with the highest projected ROI",
    "Consider expanding your portfolio in emerging neighborhoods",
    "Optimize pricing strategy based on market trends",
    "Implement virtual tours for higher engagement",
    "Target marketing efforts on high-demand property types",
  ]

  // If we have product performance data, customize recommendations
  if (productPerformance && productPerformance.length > 0) {
    const topProduct = productPerformance[0].product
    recommendations[0] = `Focus on properties like "${topProduct}" with the highest projected ROI`
  }

  return recommendations
}

