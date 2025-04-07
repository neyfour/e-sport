"use client"

import { useState } from "react"
import { useParams } from "react-router-dom"
import { useStore } from "../store"
import { TrendingUp, Eye, MousePointerClick, ShoppingBag, Download } from "lucide-react"
import { format, subDays } from "date-fns"
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
  Legend,
} from "recharts"

export default function ProductAnalytics() {
  const { productId } = useParams()
  const [timeRange, setTimeRange] = useState("7days")
  const products = useStore((state) => state.products)
  const product = products.find((p) => p.id === productId)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Product not found</p>
      </div>
    )
  }

  // Sample analytics data
  const analyticsData = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), i), "MMM dd"),
    views: Math.floor(Math.random() * 100) + 50,
    clicks: Math.floor(Math.random() * 50) + 20,
    sales: Math.floor(Math.random() * 10) + 1,
  })).reverse()

  const conversionRate = ((product.sales_count / product.views_count) * 100).toFixed(1)
  const clickThroughRate = ((product.clicks_count / product.views_count) * 100).toFixed(1)

  const metrics = [
    {
      title: "Total Views",
      value: product.views_count.toLocaleString(),
      icon: Eye,
      color: "blue",
    },
    {
      title: "Total Clicks",
      value: product.clicks_count.toLocaleString(),
      icon: MousePointerClick,
      color: "green",
    },
    {
      title: "Total Sales",
      value: product.sales_count.toLocaleString(),
      icon: ShoppingBag,
      color: "indigo",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "purple",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Performance metrics for {product.title}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/20`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily views, clicks, and sales</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={analyticsData}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#6B7280" />
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
              dataKey="views"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorViews)"
              name="Views"
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorClicks)"
              name="Clicks"
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#6366F1"
              fillOpacity={1}
              fill="url(#colorSales)"
              name="Sales"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Funnel</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View to sale conversion analysis</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              {
                stage: "Views",
                value: product.views_count,
                color: "#3B82F6",
              },
              {
                stage: "Clicks",
                value: product.clicks_count,
                color: "#10B981",
              },
              {
                stage: "Sales",
                value: product.sales_count,
                color: "#6366F1",
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="stage" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6">
              {analyticsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

