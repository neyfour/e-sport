"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  PieChartIcon,
  BarChart2,
  CalendarIcon as CalendarMonth,
  Star,
  StarIcon as StarBorder,
  ArrowUpIcon as ArrowUpward,
  ArrowDownIcon as ArrowDownward,
  Info,
  ListIcon as Category,
} from "lucide-react"
import sellerPredictionApi, {
  type PredictionResponse,
  type PredictionSummary,
  type PredictionDataPoint,
  type TopProductsResponse,
  type TopProductPrediction,
} from "../api/sellerpredictionApi"
import { formatCurrency } from "../utils/formatCurrency"

// Colors for charts
const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]

const SellerPredictionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const user = useStore((state) => state.user)
  const [predictionType, setPredictionType] = useState<"6-month" | "1-year" | "5-year">("1-year")
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "products">("overview")
  const [predictionData, setPredictionData] = useState<PredictionDataPoint[]>([])
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null)
  const [topProducts, setTopProducts] = useState<TopProductPrediction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [topProductsLoading, setTopProductsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [topProductsError, setTopProductsError] = useState<string | null>(null)

  // Get seller ID from user or params
  const sellerId = id || (user?._id ? user._id.toString() : "1")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log(`Fetching prediction data for seller ID: ${sellerId}, type: ${predictionType}`)

        // Fetch prediction data based on selected type
        let response: PredictionResponse
        switch (predictionType) {
          case "6-month":
            response = await sellerPredictionApi.getSixMonthPrediction(sellerId)
            break
          case "1-year":
            response = await sellerPredictionApi.getOneYearPrediction(sellerId)
            break
          case "5-year":
            response = await sellerPredictionApi.getFiveYearPrediction(sellerId)
            break
          default:
            response = await sellerPredictionApi.getOneYearPrediction(sellerId)
        }

        // Format dates for display
        const formattedData = response.data.map((item) => ({
          ...item,
          month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        }))

        setPredictionData(formattedData)

        // Fetch summary data
        const summary = await sellerPredictionApi.getPredictionSummary(sellerId)
        setPredictionSummary(summary)
      } catch (err) {
        console.error("Error fetching prediction data:", err)
        setError("Failed to load prediction data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sellerId, predictionType])

  // Fetch top products data when prediction type changes
  useEffect(() => {
    const fetchTopProducts = async () => {
      setTopProductsLoading(true)
      setTopProductsError(null)
      try {
        // Fetch top products based on selected type
        let response: TopProductsResponse
        switch (predictionType) {
          case "6-month":
            response = await sellerPredictionApi.getTopProductsSixMonth(sellerId)
            break
          case "1-year":
            response = await sellerPredictionApi.getTopProductsOneYear(sellerId)
            break
          case "5-year":
            response = await sellerPredictionApi.getTopProductsFiveYear(sellerId)
            break
          default:
            response = await sellerPredictionApi.getTopProductsOneYear(sellerId)
        }

        setTopProducts(response.data)
      } catch (err) {
        console.error("Error fetching top products data:", err)
        setTopProductsError("Failed to load top products data. Please try again later.")
      } finally {
        setTopProductsLoading(false)
      }
    }

    fetchTopProducts()
  }, [sellerId, predictionType])

  // Calculate growth indicators for summary cards
  const getGrowthIndicator = (value: number) => {
    if (value === undefined || isNaN(value)) {
      value = 0
    }
    if (value > 0) return { color: "text-green-500", icon: <ArrowUpward className="w-3 h-3 text-green-500 mr-1" /> }
    return { color: "text-red-500", icon: <ArrowDownward className="w-3 h-3 text-red-500 mr-1" /> }
  }

  // Prepare data for distribution pie chart
  const preparePieChartData = () => {
    if (!predictionData.length) return []

    // Group by quarter or month depending on prediction type
    let groupedData: { name: string; value: number }[] = []

    if (predictionType === "5-year") {
      // Group by year for 5-year prediction
      const yearlyData: Record<string, number> = {}

      predictionData.forEach((item) => {
        const year = item.month.split(" ")[1] // Extract year from "Jan 2025"
        if (!yearlyData[year]) yearlyData[year] = 0
        yearlyData[year] += item.revenue
      })

      groupedData = Object.entries(yearlyData).map(([year, revenue]) => ({
        name: `Year ${year}`,
        value: revenue,
      }))
    } else {
      // Use monthly data for shorter predictions
      groupedData = predictionData.map((item) => ({
        name: item.month,
        value: item.revenue,
      }))
    }

    return groupedData
  }

  // Get current summary based on prediction type
  const getCurrentSummary = () => {
    if (!predictionSummary) return null

    switch (predictionType) {
      case "6-month":
        return predictionSummary.six_month
      case "1-year":
        return predictionSummary.one_year
      case "5-year":
        return predictionSummary.five_year
      default:
        return predictionSummary.one_year
    }
  }

  const currentSummary = getCurrentSummary()
  const pieChartData = preparePieChartData()

  if (loading && !predictionData.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error && !predictionData.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex">
      <SellerSidebar />
      <div className="flex-1 md:ml-64 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Predictions</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  AI-powered forecasts to help you plan your business strategy
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select
                    value={predictionType}
                    onChange={(e) => setPredictionType(e.target.value as "6-month" | "1-year" | "5-year")}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="6-month">6 Months</option>
                    <option value="1-year">1 Year</option>
                    <option value="5-year">5 Years</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("revenue")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "revenue"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Revenue Forecast
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "products"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Top Products
                </button>
              </nav>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              {currentSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projected Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(currentSummary.total_revenue)}
                        </p>
                        <div className="flex items-center mt-1">
                          {getGrowthIndicator(currentSummary.revenue_growth).icon}
                          <p className={`text-xs ${getGrowthIndicator(currentSummary.revenue_growth).color}`}>
                            {currentSummary.revenue_growth > 0 ? "+" : ""}
                            {currentSummary.revenue_growth !== undefined && !isNaN(currentSummary.revenue_growth)
                              ? currentSummary.revenue_growth.toFixed(1)
                              : "0.0"}
                            % growth
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projected Orders</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {Math.round(currentSummary.total_orders).toLocaleString()}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Estimated total orders</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projected Units</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {Math.round(currentSummary.total_units).toLocaleString()}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Estimated total units sold</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Order Value</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(
                            currentSummary.total_orders > 0
                              ? currentSummary.total_revenue / currentSummary.total_orders
                              : 0,
                          )}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Projected average</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Forecast</h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {predictionType === "6-month"
                      ? "Next 6 months"
                      : predictionType === "1-year"
                        ? "Next 12 months"
                        : "Next 5 years"}
                  </p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        tickFormatter={(value) => {
                          // For 5-year prediction, show fewer ticks
                          if (predictionType === "5-year") {
                            // Only show January of each year
                            if (value.includes("Jan")) return value
                            return ""
                          }
                          return value
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        width={60}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{ fontWeight: "bold", marginBottom: "0.25rem" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#6366F1"
                        strokeWidth={3}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders & Units Chart */}

              {/* Revenue Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Distribution</h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {predictionType === "5-year" ? "By year" : "By month"}
                  </p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products Preview</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View all
                  </button>
                </div>
                {topProductsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
                  </div>
                ) : topProductsError ? (
                  <div className="text-red-500 text-center py-4">{topProductsError}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topProducts.slice(0, 3).map((product) => (
                      <div
                        key={product.product_id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            <img
                              src={product.product_image || "/placeholder.svg?height=48&width=48"}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {product.product_name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.product_category}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Projected Revenue</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(product.total_revenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Growth Rate</p>
                            <div className="flex items-center">
                              {product.growth_rate > 0 ? (
                                <ArrowUpward className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <ArrowDownward className="w-3 h-3 text-red-500 mr-1" />
                              )}
                              <p
                                className={`font-medium ${product.growth_rate > 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {product.growth_rate > 0 ? "+" : ""}
                                {product.growth_rate !== undefined && !isNaN(product.growth_rate)
                                  ? product.growth_rate.toFixed(1)
                                  : "0.0"}
                                %
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === "revenue" && (
            <div className="space-y-6">
              {/* Revenue Overview */}
              {currentSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(currentSummary.total_revenue)}
                        </p>
                        <div className="flex items-center mt-1">
                          {getGrowthIndicator(currentSummary.revenue_growth).icon}
                          <p className={`text-xs ${getGrowthIndicator(currentSummary.revenue_growth).color}`}>
                            {currentSummary.revenue_growth > 0 ? "+" : ""}
                            {currentSummary.revenue_growth !== undefined && !isNaN(currentSummary.revenue_growth)
                              ? currentSummary.revenue_growth.toFixed(1)
                              : "0.0"}
                            % growth
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Average</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(
                            predictionData.length > 0 ? currentSummary.total_revenue / predictionData.length : 0,
                          )}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Projected monthly average</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <CalendarMonth className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue per Order</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(
                            currentSummary.total_orders > 0
                              ? (currentSummary.total_revenue / currentSummary.total_orders).toFixed(2)
                              : "0.00",
                          )}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Average order value</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <ShoppingBag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Revenue Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Revenue Forecast</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {predictionType === "6-month"
                        ? "Next 6 months"
                        : predictionType === "1-year"
                          ? "Next 12 months"
                          : "Next 5 years"}
                    </p>
                  </div>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
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
                        tickFormatter={(value) => {
                          // For 5-year prediction, show fewer ticks
                          if (predictionType === "5-year") {
                            // Only show January of each year
                            if (value.includes("Jan")) return value
                            return ""
                          }
                          return value
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        width={60}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{ fontWeight: "bold", marginBottom: "0.25rem" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#6366F1"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, stroke: "#6366F1", fill: "white" }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff", fill: "#6366F1" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Distribution</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {predictionType === "5-year" ? "By year" : "By month"}
                    </p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Revenue by month</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={predictionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorRevenue3" x1="0" y1="0" x2="0" y2="1">
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
                          tickFormatter={(value) => {
                            // For 5-year prediction, show fewer ticks
                            if (predictionType === "5-year") {
                              // Only show January of each year
                              if (value.includes("Jan")) return value
                              return ""
                            }
                            return value
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill="url(#colorRevenue3)"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Top Products Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products Forecast</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {predictionType === "6-month"
                        ? "Next 6 months"
                        : predictionType === "1-year"
                          ? "Next 12 months"
                          : "Next 5 years"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Products predicted to generate the highest revenue in the selected time period
                </p>

                {topProductsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
                  </div>
                ) : topProductsError ? (
                  <div className="text-red-500 text-center py-4">{topProductsError}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Category
                          </th>
                         
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Projected Revenue
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Projected Units
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Growth
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {topProducts.map((product) => (
                          <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-md object-cover"
                                    src={product.product_image || "/placeholder.svg?height=40&width=40"}
                                    alt={product.product_name}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {product.product_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                <Category className="w-3 h-3 mr-1" />
                                {product.product_category}
                              </div>
                            </td>
                           
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white font-medium">
                              {formatCurrency(product.total_revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                              {Math.round(product.total_units).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end">
                                {product.growth_rate > 0 ? (
                                  <ArrowUpward className="w-4 h-4 text-green-500 mr-1" />
                                ) : (
                                  <ArrowDownward className="w-4 h-4 text-red-500 mr-1" />
                                )}
                                <span
                                  className={`text-sm font-medium ${
                                    product.growth_rate > 0 ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {product.growth_rate > 0 ? "+" : ""}
                                  {product.growth_rate !== undefined ? product.growth_rate.toFixed(1) : "0.0"}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Top 5 Products Cards */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <StarBorder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Top 5 Products at a Glance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topProductsLoading ? (
                    <div className="col-span-full flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
                    </div>
                  ) : topProductsError ? (
                    <div className="col-span-full text-red-500 text-center py-4">{topProductsError}</div>
                  ) : (
                    topProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.product_id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                              <img
                                src={product.product_image || "/placeholder.svg?height=48&width=48"}
                                alt={product.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.product_name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{product.product_category}</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                             
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Growth Rate</p>
                                <div className="flex items-center">
                                  {product.growth_rate > 0 ? (
                                    <ArrowUpward className="w-3 h-3 text-green-500 mr-1" />
                                  ) : (
                                    <ArrowDownward className="w-3 h-3 text-red-500 mr-1" />
                                  )}
                                  <p
                                    className={`font-medium ${
                                      product.growth_rate > 0 ? "text-green-500" : "text-red-500"
                                    }`}
                                  >
                                    {product.growth_rate > 0 ? "+" : ""}
                                    {product.growth_rate > 0 ? "+" : ""}
                                    {product.growth_rate !== undefined ? product.growth_rate.toFixed(1) : "0.0"}%
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Projected Revenue</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(product.total_revenue)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Projected Units</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {Math.round(product.total_units).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Monthly Revenue by Product */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Monthly Revenue by Top Products
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average monthly revenue</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts.slice(0, 5).map((product) => ({
                        name: product.product_name,
                        revenue: product.avg_monthly_revenue,
                        units: product.avg_monthly_units,
                        category: product.product_category,
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                        tickLine={false}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Monthly Revenue"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="revenue" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerPredictionsPage

