import { api } from "../config/db"

// Define types for seller commission data
export interface SellerCommission {
  id: string
  username: string
  email: string
  total_orders: number
  total_revenue: number
  commission_status: "pending" | "paid"
  commission_amount: number
  commission_percentage: number
  is_top_seller: boolean
}

// Get all seller commissions
export const getSellerCommissions = async (
  token: string,
  month?: number,
  year?: number,
): Promise<SellerCommission[]> => {
  let url = `${api.url}/sellercommissions`
  if (month && year) {
    url += `?month=${month}&year=${year}`
  }

  try {
    console.log("Making request to:", url)
    console.log("With token:", token ? "Token exists" : "No token")

    const response = await fetch(url, {
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Server response:", response.status, errorText)
      throw new Error(`Failed to fetch seller commissions: ${response.status} ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching seller commissions:", error)
    throw error
  }
}

// Update commission status
export const updateCommissionStatus = async (
  commissionId: string,
  status: "pending" | "paid",
  token: string,
): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/sellercommissions/${commissionId}/status`, {
      method: "PUT",
      headers: api.getHeaders(token),
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error("Failed to update commission status")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating commission status:", error)
    throw error
  }
}

// Get default commission values
export const getDefaultCommissionValues = async (
  token: string,
): Promise<{
  defaultCommission: number
  topSellerCommissionBonus: number
}> => {
  try {
    const response = await fetch(`${api.url}/sellercommissions/default-values`, {
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch default commission values")
    }

    const data = await response.json()
    return {
      defaultCommission: data.default_commission,
      topSellerCommissionBonus: data.top_seller_commission_bonus,
    }
  } catch (error) {
    console.error("Error fetching default commission values:", error)
    throw error
  }
}

// Update default commission values
export const updateDefaultCommissionValues = async (
  defaultCommission: number,
  topSellerCommissionBonus: number,
  token: string,
): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/sellercommissions/default-values`, {
      method: "PUT",
      headers: api.getHeaders(token),
      body: JSON.stringify({
        default_commission: defaultCommission,
        top_seller_commission_bonus: topSellerCommissionBonus,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update default commission values")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating default commission values:", error)
    throw error
  }
}

// Add this new function to update commission percentage
export const updateCommissionPercentage = async (commissionId: string, percentage: number, token: string) => {
  try {
    const response = await fetch(`${api.url}/sellercommissions/${commissionId}/percentage`, {
      method: "PUT",
      headers: api.getHeaders(token),
      body: JSON.stringify({ commission_percentage: percentage / 100 }), // Convert from percentage to decimal
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to update commission percentage")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating commission percentage:", error)
    throw error
  }
}

