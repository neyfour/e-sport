"use client"

import { useState } from "react"
import { TrendingUp, Calendar, BarChart3, Target, ArrowUp, ArrowDown, Download } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { SalesPrediction, MarketInsight } from "../types"

export default function SalesPredictions() {
  const [timeRange, setTimeRange] = useState("year")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Sample data for demonstration
  const predictions: SalesPrediction[] = [
    {
      period: "2024 Q1",
      actual_revenue: 150000,
      predicted_revenue: 160000,
      confidence_score: 0.92,
      growth_rate: 0.15,
      factors: {
        seasonal_impact: 0.8,
        market_trend: 0.9,
        competition_index: 0.7,
      },
    },
    {
      period: "2024 Q2",
      actual_revenue: 180000,
      predicted_revenue: 185000,
      confidence_score: 0.89,
      growth_rate: 0.12,
      factors: {
        seasonal_impact: 0.85,
        market_trend: 0.88,
        competition_index: 0.75,
      },
    },
    {
      period: "2024 Q3",
      predicted_revenue: 210000,
      confidence_score: 0.85,
      growth_rate: 0.18,
      factors: {
        seasonal_impact: 0.9,
        market_trend: 0.85,
        competition_index: 0.8,
      },
    },
    {
      period: "2024 Q4",
      predicted_revenue: 250000,
      confidence_score: 0.82,
      growth_rate: 0.22,
      factors: {
        seasonal_impact: 0.95,
        market_trend: 0.82,
        competition_index: 0.85,
      },
    },
  ]

  const marketInsights: MarketInsight[] = [
    {
      category: "Electronics",
      market_size: 5000000,
      growth_rate: 0.15,
      competition_level: "high",
      opportunity_score: 0.75,
      trending_keywords: ["wireless", "smart home", "5G"],
      price_range: {
        min: 99,
        max: 999,
        optimal: 299,
      },
    },
    {
      category: "Fashion",
      market_size: 3000000,
      growth_rate: 0.12,
      competition_level: "medium",
      opportunity_score: 0.82,
      trending_keywords: ["sustainable", "vintage", "minimalist"],
      price_range: {
        min: 29,
        max: 299,
        optimal: 89,
      },
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Predictions</h1>
            <p className="text-gray-600 mt-1">AI-powered sales forecasting and market insights</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prediction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Predicted Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">$250,000</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-100">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 text-sm font-medium">+22%</span>
            <span className="text-gray-600 text-sm ml-1">vs previous quarter</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">18.5%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 text-sm font-medium">+3.2%</span>
            <span className="text-gray-600 text-sm ml-1">vs target</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confidence Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">85%</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowDown className="w-4 h-4 text-amber-500 mr-1" />
            <span className="text-amber-500 text-sm font-medium">-2.1%</span>
            <span className="text-gray-600 text-sm ml-1">vs last prediction</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Market Opportunity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">High</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 text-sm font-medium">+5.8%</span>
            <span className="text-gray-600 text-sm ml-1">market growth</span>
          </div>
        </div>
      </div>

      {/* Revenue Prediction Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue Forecast</h2>
            <p className="text-sm text-gray-600 mt-1">Predicted vs actual revenue with confidence intervals</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={predictions}>
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
            <Tooltip />
            <Area
              type="monotone"
              dataKey="actual_revenue"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorActual)"
              name="Actual Revenue"
            />
            <Area
              type="monotone"
              dataKey="predicted_revenue"
              stroke="#6366F1"
              fillOpacity={1}
              fill="url(#colorPredicted)"
              name="Predicted Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Market Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketInsights.map((insight) => (
          <div key={insight.category} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{insight.category} Market Insights</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium
                ${
                  insight.competition_level === "high"
                    ? "bg-red-100 text-red-800"
                    : insight.competition_level === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }
              `}
              >
                {insight.competition_level.charAt(0).toUpperCase() + insight.competition_level.slice(1)} Competition
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Market Size</p>
                <p className="text-xl font-bold text-gray-900">${(insight.market_size / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className="text-xl font-bold text-green-600">+{(insight.growth_rate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opportunity Score</p>
                <p className="text-xl font-bold text-indigo-600">{(insight.opportunity_score * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Optimal Price</p>
                <p className="text-xl font-bold text-gray-900">${insight.price_range.optimal}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Trending Keywords</p>
              <div className="flex flex-wrap gap-2">
                {insight.trending_keywords.map((keyword) => (
                  <span key={keyword} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

