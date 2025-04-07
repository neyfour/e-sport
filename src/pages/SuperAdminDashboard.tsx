"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, Users, Package, Bell, DollarSign, ArrowUp, ArrowDown } from "lucide-react"
import { useStore } from "../store"
import { getSellerApplications, updateSellerStatus } from "../api/authApi"
import { getDashboardOverview } from "../api/dashboardApi"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import NotificationCenter from "../components/NotificationCenter"
import toast from "react-hot-toast"

interface SellerDomination {
  month: string
  sellers: Array<{
    seller_id: string
    seller_name: string
    order_count?: number
  }>
}

interface TopProduct {
  id: string
  name: string
  image_url: string
  category: string
  total_quantity: number
  total_revenue: number
  seller: {
    id: string
    name: string
    avatar_url: string
    rating: number
  }
}

interface TopSeller {
  seller_id: string
  seller_name: string
  seller_email: string
  order_count: number
  total_revenue: number
}

interface Stats {
  total_users: number
  total_sellers: number
  total_products: number
  all_time_orders: number
  current_month_orders: number
  pending_applications: number
  all_time_revenue: number
  current_month_revenue: number
  monthly_data: Array<{month: string, revenue: number}>
  revenue_change: {
    daily: number
    monthly: number
  }
  orders_change: {
    daily: number
    monthly: number
  }
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sellerApplications, setSellerApplications] = useState<any[]>([])
  const [topSellers, setTopSellers] = useState<TopSeller[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_sellers: 0,
    total_products: 0,
    all_time_orders: 0,
    current_month_orders: 0,
    pending_applications: 0,
    all_time_revenue: 0,
    current_month_revenue: 0,
    monthly_data: [],
    revenue_change: {
      daily: 0,
      monthly: 0,
    },
    orders_change: {
      daily: 0,
      monthly: 0,
    },
  })

  const user = useStore((state) => state.user)
  const token = useStore((state) => state.token)
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        // Fetch seller applications
        const applications = await getSellerApplications(token, "pending")
        setSellerApplications(applications)

        // Fetch dashboard statistics
        const dashboardData = await getDashboardOverview(token)

        // Update the stats setting code to:
setStats({
  total_users: dashboardData.platform_stats?.customer_count || 0,
  total_sellers: dashboardData.platform_stats?.seller_count || 0,
  total_products: dashboardData.product_count || 0,
  all_time_orders: dashboardData.orders?.total || 0,
  current_month_orders: dashboardData.orders?.this_month || 0,
  pending_applications: applications.length,
  all_time_revenue: dashboardData.revenue?.total || 0,
  current_month_revenue: dashboardData.revenue?.this_month || 0,  // This is the correct mapping
  monthly_data: dashboardData.monthly_data || [],
  revenue_change: {
      daily: dashboardData.revenue?.change?.daily || 0,
      monthly: dashboardData.revenue?.change?.monthly || 0,
  },
  orders_change: {
      daily: dashboardData.orders?.change?.daily || 0,
      monthly: dashboardData.orders?.change?.monthly || 0,
  },
})

        // Fetch top sellers for this month
        const fetchTopSellers = async () => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/superadmin/top-sellers-current-month`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              throw new Error(`Failed to fetch top sellers: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            setTopSellers(data)
          } catch (err) {
            console.error("Error fetching top sellers:", err)
            setTopSellers(getMockTopSellers())
          }
        }

        // Fetch top products for the current month
        const fetchTopProducts = async () => {
          try {
            const response = await fetch(`${apiBaseUrl}/api/superadmin/top-products-current-month`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              throw new Error(`Failed to fetch top products: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            setTopProducts(data)
          } catch (err) {
            console.error("Error fetching top products:", err)
            setTopProducts(getMockTopProducts())
          }
        }

        await fetchTopSellers()
        await fetchTopProducts()
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [token, apiBaseUrl])
  const getMockTopSellers = (): TopSeller[] => {
    return [
      {
        seller_id: "1",
        seller_name: "Tech Gadgets",
        seller_email: "tech@example.com",
        order_count: 120,
        total_revenue: 15000.0,
      },
      {
        seller_id: "2",
        seller_name: "Fashion Trends",
        seller_email: "fashion@example.com",
        order_count: 95,
        total_revenue: 12000.0,
      },
      {
        seller_id: "3",
        seller_name: "Home Decor",
        seller_email: "home@example.com",
        order_count: 80,
        total_revenue: 9500.0,
      },
      {
        seller_id: "4",
        seller_name: "Sports Equipment",
        seller_email: "sports@example.com",
        order_count: 65,
        total_revenue: 8200.0,
      },
      {
        seller_id: "5",
        seller_name: "Beauty Products",
        seller_email: "beauty@example.com",
        order_count: 50,
        total_revenue: 6800.0,
      },
    ]
  }

  const getMockTopProducts = (): TopProduct[] => {
    return [
      {
        id: "1",
        name: "Wireless Headphones",
        image_url: "/placeholder.svg?height=60&width=60",
        category: "Electronics",
        total_quantity: 24,
        total_revenue: 2399.96,
        seller: {
          id: "101",
          name: "Tech Store",
          avatar_url: "",
          rating: 4.8,
        },
      },
      {
        id: "2",
        name: "Smart Watch",
        image_url: "/placeholder.svg?height=60&width=60",
        category: "Electronics",
        total_quantity: 18,
        total_revenue: 1799.82,
        seller: {
          id: "102",
          name: "Gadget World",
          avatar_url: "",
          rating: 4.5,
        },
      },
      {
        id: "3",
        name: "Laptop Backpack",
        image_url: "/placeholder.svg?height=60&width=60",
        category: "Accessories",
        total_quantity: 32,
        total_revenue: 1599.68,
        seller: {
          id: "103",
          name: "Travel Essentials",
          avatar_url: "",
          rating: 4.7,
        },
      },
      {
        id: "4",
        name: "Bluetooth Speaker",
        image_url: "/placeholder.svg?height=60&width=60",
        category: "Electronics",
        total_quantity: 15,
        total_revenue: 1349.85,
        seller: {
          id: "101",
          name: "Tech Store",
          avatar_url: "",
          rating: 4.8,
        },
      },
      {
        id: "5",
        name: "Fitness Tracker",
        image_url: "/placeholder.svg?height=60&width=60",
        category: "Health",
        total_quantity: 22,
        total_revenue: 1099.78,
        seller: {
          id: "104",
          name: "Fitness Hub",
          avatar_url: "",
          rating: 4.6,
        },
      },
    ]
  }

  // ... (keep the getMockTopSellers and getMockTopProducts functions the same)

  // ... (keep the handleApplicationAction function the same)

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SuperAdminSidebar />
      
      <div className="flex-1 md:ml-64 p-4 md:p-6 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.username || "superadmin"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Here's what's happening on your platform today.</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <NotificationCenter />
              <Link
                to="/matrix/admin/chat"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Seller Chat
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
 {/* Total Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_users}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          {/* Total Sellers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sellers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_sellers}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_products}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Current Month Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Month Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.current_month_orders}</p>
                <div className="flex items-center mt-1">
                  {stats.orders_change.monthly > 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${stats.orders_change.monthly > 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(stats.orders_change.monthly).toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Current Month Revenue */}
        

          {/* Pending Applications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_applications}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Sellers (This Month)</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topSellers.length > 0 ? (
                  topSellers.map((seller) => (
                    <tr key={seller.seller_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {seller.seller_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {seller.seller_email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {seller.order_count}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        ${seller.total_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                      No seller data available for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products (This Month)</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                 
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-600">
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </div>
                      </td>
                     
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {product.seller.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {product.total_quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        ${product.total_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                      No product data available for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep the getMockTopSellers and getMockTopProducts functions the same as before