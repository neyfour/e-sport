"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, Package, BarChart3, TrendingUp, DollarSign, ArrowUp, ArrowDown, ChevronDown } from "lucide-react"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"
import { getSellerDashboardOverview, type SellerDashboardData } from "../api/sellerDashboardApi"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

// Mock data for fallback
const mockDashboardData: SellerDashboardData = {
  product_count: 24,
  orders: {
    today: 8,
    yesterday: 6,
    this_month: 156,
    last_month: 132,
    total: 1248,
    change: {
      daily: 33.3,
      monthly: 18.2,
    },
  },
  revenue: {
    today: 450.75,
    yesterday: 320.5,
    this_month: 8945.75,
    last_month: 7560.25,
    total: 124500.5,
    change: {
      daily: 40.6,
      monthly: 18.3,
    },
  },
  monthly_data: [
    { month: "Jan", revenue: 6500, orders: 120 },
    { month: "Feb", revenue: 7200, orders: 132 },
    { month: "Mar", revenue: 8100, orders: 145 },
    { month: "Apr", revenue: 7800, orders: 138 },
    { month: "May", revenue: 8300, orders: 152 },
    { month: "Jun", revenue: 8945.75, orders: 156 },
    { month: "Jul", revenue: 7800, orders: 140 },
    { month: "Aug", revenue: 8500, orders: 158 },
    { month: "Sep", revenue: 9200, orders: 165 },
    { month: "Oct", revenue: 9800, orders: 172 },
    { month: "Nov", revenue: 10500, orders: 185 },
    { month: "Dec", revenue: 12000, orders: 210 },
  ],
  top_products: [
    {
      product_id: "1",
      name: "Premium Apartment",
      category: "Residential",
      total_quantity: 12,
      total_revenue: 2400.0,
      image_url: "/placeholder.svg",
    },
    {
      product_id: "2",
      name: "Luxury Villa",
      category: "Residential",
      total_quantity: 8,
      total_revenue: 1600.0,
      image_url: "/placeholder.svg",
    },
    {
      product_id: "3",
      name: "Office Space",
      category: "Commercial",
      total_quantity: 15,
      total_revenue: 1200.0,
      image_url: "/placeholder.svg",
    },
    {
      product_id: "4",
      name: "Retail Store",
      category: "Commercial",
      total_quantity: 10,
      total_revenue: 950.0,
      image_url: "/placeholder.svg",
    },
    {
      product_id: "5",
      name: "Warehouse",
      category: "Industrial",
      total_quantity: 5,
      total_revenue: 750.0,
      image_url: "/placeholder.svg",
    },
  ],
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400">Revenue: ${payload[0].value.toFixed(2)}</p>
      </div>
    )
  }

  return null
}

// Format data for the chart
const formatChartData = (data: any[]) => {
  // Ensure we have data for all months
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Create a map of existing data
  const dataMap = new Map(
    data.map((item) => {
      // Extract just the month name from "Month Year" format if needed
      const month = item.month.split(" ")[0]
      return [month, item]
    }),
  )

  // Create a complete dataset with all months
  return allMonths.map((month) => {
    const existingData = dataMap.get(month)
    return existingData ? existingData : { month, revenue: 0, orders: 0 }
  })
}

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null)
  const [timeframe, setTimeframe] = useState("7days")

  const user = useStore((state) => state.user)
  const token = useStore((state) => state.token)

  // Update the fetchDashboardData function to better handle token and errors
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      // Use token from the store instead of localStorage
      if (token) {
        console.log("Token available from store, attempting to fetch dashboard data")
        console.log("Current user ID:", user?._id) // Log the current user ID

        try {
          // Pass the current seller's ID explicitly to ensure we get the right data
          const data = await getSellerDashboardOverview(token, user?._id)
          console.log("Dashboard data fetched successfully for seller ID:", user?._id)

          // Log product data to debug
          if (data.top_products && data.top_products.length > 0) {
            console.log("Top products data received:", data.top_products)
          } else {
            console.log("No top products data received")
          }

          setDashboardData(data)
        } catch (error) {
          console.error("Error fetching dashboard data:", error)
          setError("Failed to load dashboard data. Please try again later.")

          // Use mock data as fallback only in development
          if (process.env.NODE_ENV === "development") {
            console.log("Using mock data as fallback")
            setDashboardData(mockDashboardData)
          }
        }
      } else {
        console.log("No token available in store")
        setError("Authentication required. Please log in again.")

        // Use mock data as fallback only in development
        if (process.env.NODE_ENV === "development") {
          console.log("Using mock data as fallback")
          setDashboardData(mockDashboardData)
        }
      }
    } catch (error) {
      console.error("Error in fetchDashboardData:", error)
      setError("An unexpected error occurred. Please try again later.")

      // Use mock data as fallback only in development
      if (process.env.NODE_ENV === "development") {
        setDashboardData(mockDashboardData)
      }
    } finally {
      setLoading(false)
    }
  }, [token, user?._id]) // Add user._id as a dependency

  // Update the useEffect hook to handle authentication errors and refetch when user changes
  useEffect(() => {
    fetchDashboardData()

    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [fetchDashboardData, token, user?._id]) // Add user._id as a dependency

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    )
  }

  // Ensure we have data
  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 text-xl">No dashboard data available</div>
      </div>
    )
  }

  // Format chart data
  const chartData = formatChartData(dashboardData.monthly_data || [])

  return (
    <div className="flex">
      {/* Sidebar */}
      <SellerSidebar />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.username}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Here's what's happening with your store today.</p>
              </div>
              <div className="flex gap-4">
               
                <Link
                  to="/seller/chat"
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Seller Chat
                </Link>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{dashboardData.product_count}</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{dashboardData.orders.total}</p>
                  <div className="flex items-center mt-1">
                    {dashboardData.orders.change.monthly > 0 ? (
                      <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <p
                      className={`text-xs ${dashboardData.orders.change.monthly > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {Math.abs(dashboardData.orders.change.monthly).toFixed(1)}% from last month
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    ${dashboardData.revenue.total.toFixed(2)}
                  </p>
                  <div className="flex items-center mt-1">
                    {dashboardData.revenue.change.monthly > 0 ? (
                      <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <p
                      className={`text-xs ${dashboardData.revenue.change.monthly > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {Math.abs(dashboardData.revenue.change.monthly).toFixed(1)}% from last month
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    ${dashboardData.revenue.today.toFixed(2)}
                  </p>
                  <div className="flex items-center mt-1">
                    {dashboardData.revenue.change.daily > 0 ? (
                      <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                    )}
                    <p
                      className={`text-xs ${dashboardData.revenue.change.daily > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {Math.abs(dashboardData.revenue.change.daily).toFixed(1)}% from yesterday
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trend Chart - Professional implementation with Recharts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
              </div>

              {/* Time Period Dropdown */}
             
            </div>

            {/* Chart Area */}
            <div className="h-80 mt-4">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickLine={false}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366F1"
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">No revenue data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products - Fixed to display proper product names */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h2>
                </div>
                <Link
                  to="/seller/products"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.top_products && dashboardData.top_products.length > 0 ? (
                  dashboardData.top_products.map((product) => (
                    <div
                      key={product.product_id}
                      className="flex items-center p-4 bg-gray-50 dark:bg-gray-750 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name || "Product"}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {/* Check for both title and name fields, with fallback */}
                          {product.title || product.name || "Product " + product.product_id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs mr-2">
                            {product.category || "Uncategorized"}
                          </span>
                          Sold: {product.total_quantity} | ${product.total_revenue.toFixed(2)}
                        </p>
                      </div>
                      <Link
                        to={`/seller/products/${product.product_id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-3 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                       
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No products found</p>
                    <Link
                      to="/seller/products/add"
                      className="mt-2 inline-flex items-center text-indigo-600 dark:text-indigo-400"
                    >
                      Add your first product
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Orders Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Orders Overview</h2>
                </div>
                <Link
                  to="/seller/orders"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.orders.today}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ${dashboardData.revenue.today.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {dashboardData.orders.this_month}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ${dashboardData.revenue.this_month.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Monthly Performance</h3>
                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
                      <div className="flex items-center">
                        {dashboardData.orders.change.monthly > 0 ? (
                          <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <p
                          className={`text-xs ${dashboardData.orders.change.monthly > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {Math.abs(dashboardData.orders.change.monthly).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${dashboardData.orders.change.monthly > 0 ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, Math.abs(dashboardData.orders.change.monthly))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                      <div className="flex items-center">
                        {dashboardData.revenue.change.monthly > 0 ? (
                          <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <p
                          className={`text-xs ${dashboardData.revenue.change.monthly > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {Math.abs(dashboardData.revenue.change.monthly).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${dashboardData.revenue.change.monthly > 0 ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, Math.abs(dashboardData.revenue.change.monthly))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

