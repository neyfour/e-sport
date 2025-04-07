"use client"

import { useState, useEffect } from "react"
import { useStore } from "../store"
import { getSalesPredictions, getProductPredictions } from "../api/dashboardApi"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { SalesPrediction } from "../types"

export default function AdminPredictionsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [salesPredictions, setSalesPredictions] = useState<SalesPrediction[]>([])
  const [productPredictions, setProductPredictions] = useState<any[]>([])
  const [timeframe, setTimeframe] = useState("5years")

  const token = useStore((state) => state.token)

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        const [salesData, productData] = await Promise.all([
          getSalesPredictions(token, timeframe),
          getProductPredictions(token),
        ])

        setSalesPredictions(salesData)
        setProductPredictions(productData)
      } catch (err) {
        console.error("Error fetching predictions:", err)
        setError("Failed to load predictions")
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [token, timeframe])

  // Transform sales predictions for revenue chart
  const revenueChartData = salesPredictions.map((prediction) => ({
    period: prediction.period,
    "Predicted Revenue": prediction.predicted_revenue,
    "Actual Revenue": prediction.actual_revenue || 0,
  }))

  // Transform sales predictions for growth chart
  const growthChartData = salesPredictions.map((prediction) => ({
    period: prediction.period,
    "Growth Rate": prediction.growth_rate * 100,
  }))

  // Transform product predictions for product performance chart
  const productPerformanceData = productPredictions
    .slice(0, 5) // Top 5 products
    .map((product) => ({
      name: product.title,
      "Predicted Growth": product.predicted_growth,
      "Demand Score": product.demand_score * 100,
    }))

  // Transform product predictions for success probability chart
  const successProbabilityData = productPredictions
    .slice(0, 5) // Top 5 products
    .map((product) => ({
      name: product.title,
      "Success Probability": product.success_probability * 100,
    }))

  // Create data for the pie chart
  const categoryData = productPredictions.reduce((acc: any[], product) => {
    const existingCategory = acc.find((item) => item.name === product.category)
    if (existingCategory) {
      existingCategory.value += 1
    } else {
      acc.push({ name: product.category, value: 1 })
    }
    return acc
  }, [])

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  if (loading) {
    return (
      <div className="flex">
        <SuperAdminSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex">
        <SuperAdminSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="text-red-600 text-xl">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <SuperAdminSidebar />

      <div className="flex-1 md:ml-64 p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Predictions</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  AI-powered sales forecasting and market insights
                </p>
              </div>
              <div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="5years">5 Years</option>
                  <option value="1year">1 Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Revenue Prediction Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Forecast</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Predicted vs actual revenue with confidence intervals
                </p>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="period" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Actual Revenue"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Predicted Revenue"
                    stroke="#6366F1"
                    fillOpacity={1}
                    fill="url(#colorPredicted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth Rate Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Growth Rate Forecast</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Projected growth rate over time</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="period" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => [`${value.toFixed(1)}%`, "Growth Rate"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Growth Rate"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Predictions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Product Performance</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Predicted growth and demand score</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productPerformanceData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value) => [`${value.toFixed(1)}%`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="Predicted Growth" fill="#6366F1" />
                    <Bar dataKey="Demand Score" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Success Probability Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Success Probability</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Likelihood of success for top products
                  </p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={successProbabilityData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value) => [`${value.toFixed(1)}%`, "Success Probability"]}
                    />
                    <Legend />
                    <Bar dataKey="Success Probability" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category Distribution</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Distribution of products across categories
                </p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value, name, props) => [`${value} products`, props.payload.name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

