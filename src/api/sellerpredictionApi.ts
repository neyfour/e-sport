import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export interface PredictionDataPoint {
  month: string
  revenue: number
  order_count: number
  units_sold: number
}

export interface PredictionResponse {
  prediction_type: string
  seller_id: number | string
  generated_at: string
  data: PredictionDataPoint[]
}

export interface PredictionSummaryItem {
  total_revenue: number
  total_orders: number
  total_units: number
  revenue_growth: number
}

export interface PredictionSummary {
  seller_id: number | string
  generated_at: string
  six_month: PredictionSummaryItem
  one_year: PredictionSummaryItem
  five_year: PredictionSummaryItem
}

export interface TopProductPrediction {
  product_id: string
  product_name: string
  product_image: string
  product_price: number
  product_category: string
  total_revenue: number
  total_units: number
  avg_monthly_revenue: number
  avg_monthly_units: number
  growth_rate: number
}

export interface TopProductsResponse {
  prediction_type: string
  seller_id: string | number
  generated_at: string
  data: TopProductPrediction[]
}

class SellerPredictionApi {
  /**
   * Get 6-month sales prediction for a seller
   * @param sellerId - The ID of the seller
   * @returns Promise with prediction data
   */
  async getSixMonthPrediction(sellerId = "1"): Promise<PredictionResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/6-month`, {
        params: {
          seller_id: sellerId,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching 6-month prediction:", error)
      throw error
    }
  }

  /**
   * Get 1-year sales prediction for a seller
   * @param sellerId - The ID of the seller
   * @returns Promise with prediction data
   */
  async getOneYearPrediction(sellerId = "1"): Promise<PredictionResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/1-year`, {
        params: {
          seller_id: sellerId,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching 1-year prediction:", error)
      throw error
    }
  }

  /**
   * Get 5-year sales prediction for a seller
   * @param sellerId - The ID of the seller
   * @returns Promise with prediction data
   */
  async getFiveYearPrediction(sellerId = "1"): Promise<PredictionResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/5-year`, {
        params: {
          seller_id: sellerId,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching 5-year prediction:", error)
      throw error
    }
  }

  /**
   * Get a summary of all predictions for a seller
   * @param sellerId - The ID of the seller
   * @returns Promise with prediction summary
   */
  async getPredictionSummary(sellerId = "1"): Promise<PredictionSummary> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/summary`, {
        params: {
          seller_id: sellerId,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching prediction summary:", error)
      throw error
    }
  }

  /**
   * Get top products prediction for 6 months
   * @param sellerId - The ID of the seller
   * @param limit - Number of top products to return
   * @returns Promise with top products prediction
   */
  async getTopProductsSixMonth(sellerId = "1", limit = 10): Promise<TopProductsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/top-products/6-month`, {
        params: {
          seller_id: sellerId,
          limit,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching 6-month top products prediction:", error)
      throw error
    }
  }

  /**
   * Get top products prediction for 1 year
   * @param sellerId - The ID of the seller
   * @param limit - Number of top products to return
   * @returns Promise with top products prediction
   */
  async getTopProductsOneYear(sellerId = "1", limit = 10): Promise<TopProductsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/top-products/1-year`, {
        params: {
          seller_id: sellerId,
          limit,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching 1-year top products prediction:", error)
      throw error
    }
  }

  /**
   * Get top products prediction for 5 years
   * @param sellerId - The ID of the seller
   * @param limit - Number of top products to return
   * @returns Promise with top products prediction
   */
  async getTopProductsFiveYear(sellerId = "1", limit = 10): Promise<TopProductsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/predictions/top-products/5-year`, {
        params: {
          seller_id: sellerId,
          limit,
          use_mock_data: false, // Force real data
          force_real_data: true, // New parameter to force real data even if predictions are low
          min_scale_factor: 100, // Scale factor to apply to low predictions instead of using synthetic data
          min_data_points: 5, // Allow forecasting with fewer data points
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching 5-year top products prediction:", error)
      throw error
    }
  }

  /**
   * Refresh seller data to force reload from database
   * @param sellerId - The ID of the seller
   * @returns Promise with refresh status
   */
  async refreshSellerData(sellerId = "1"): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/seller/predictions/refresh-data/${sellerId}`)
      return response.data
    } catch (error) {
      console.error("Error refreshing seller data:", error)
      throw error
    }
  }
}

export const sellerPredictionApi = new SellerPredictionApi()
export default sellerPredictionApi

// Add a new parameter to allow forecasting with fewer orders
export const getSixMonthPrediction = async (sellerId: string) => {
  try {
    const response = await axios.get(`${API_URL}/seller/predictions/6-month`, {
      params: {
        seller_id: sellerId,
        force_real_data: true,
        min_scale_factor: 100.0,
        min_data_points: 5,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error fetching 6-month prediction:", error)
    throw error
  }
}

export const getOneYearPrediction = async (sellerId: string) => {
  try {
    const response = await axios.get(`${API_URL}/seller/predictions/1-year`, {
      params: {
        seller_id: sellerId,
        force_real_data: true,
        min_scale_factor: 100.0,
        min_data_points: 5,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error fetching 1-year prediction:", error)
    throw error
  }
}

export const getFiveYearPrediction = async (sellerId: string) => {
  try {
    const response = await axios.get(`${API_URL}/seller/predictions/5-year`, {
      params: {
        seller_id: sellerId,
        force_real_data: true,
        min_scale_factor: 100.0,
        min_data_points: 5,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error fetching 5-year prediction:", error)
    throw error
  }
}

