"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShoppingBag,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
} from "lucide-react"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"
import { getSellerOrders, getOrderCount } from "../api/orderApi"
import { updateOrderStatus } from "../api/orderApi"

interface OrderItem {
  product_id: string
  quantity: number
  price: number
  product_name?: string
  product_title?: string
  product_image?: string
  seller_id: string
  product?: {
    _id: string
    name: string
    image_url: string
  }
}

interface Order {
  _id: string
  user_id: string
  items: OrderItem[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  payment_status: "pending" | "paid" | "failed"
  created_at: string
  user?: {
    _id: string
    username: string
    email: string
  }
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [orderDetails, setOrderDetails] = useState<Order | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [totalOrders, setTotalOrders] = useState(0)

  const navigate = useNavigate()
  const { user, token } = useStore((state) => ({
    user: state.user,
    token: state.token,
  }))

  const ordersPerPage = 10

  // Update the fetchOrders function to pass the token to getSellerOrders
  const fetchOrders = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)

      // Pass token to getSellerOrders
      const fetchedOrders = await getSellerOrders(token, statusFilter, ordersPerPage, (currentPage - 1) * ordersPerPage)

      // Get total order count
      const countData = await getOrderCount(token, statusFilter)
      setTotalOrders(countData.count)
      setTotalPages(Math.ceil(countData.count / ordersPerPage))

      // Apply search filter
      let filteredOrders = fetchedOrders
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filteredOrders = filteredOrders.filter(
          (order) =>
            order._id.toLowerCase().includes(searchLower) ||
            (order.user?.username && order.user.username.toLowerCase().includes(searchLower)) ||
            (order.user?.email && order.user.email.toLowerCase().includes(searchLower)),
        )
      }

      // Sort orders
      const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortField === "created_at") {
          return sortDirection === "asc"
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        } else if (sortField === "total") {
          return sortDirection === "asc" ? a.total - b.total : b.total - a.total
        } else if (sortField === "status") {
          return sortDirection === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
        } else if (sortField === "_id") {
          return sortDirection === "asc" ? a._id.localeCompare(b._id) : b._id.localeCompare(a._id)
        } else {
          // Default sort by created_at
          return sortDirection === "asc"
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })

      setOrders(sortedOrders)
    } catch (err: any) {
      console.error("Error fetching orders:", err)

      // Handle authentication errors
      if (
        err.message?.includes("Authentication failed") ||
        err.message?.includes("Could not validate credentials") ||
        err.message?.includes("Authentication required")
      ) {
        setError("Your session has expired. Please log in again.")
        navigate("/login")
      } else {
        setError("Failed to load orders. Please try again.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, statusFilter, navigate, currentPage, ordersPerPage, searchTerm, sortField, sortDirection])

  useEffect(() => {
    if (!user || !token) {
      navigate("/login")
      return
    }

    if (user.role !== "seller" && user.role !== "admin" && user.role !== "superadmin") {
      navigate("/")
      return
    }

    fetchOrders()
  }, [user, token, navigate, fetchOrders])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleViewDetails = (order: Order) => {
    setOrderDetails(order)
    setIsDetailsModalOpen(true)
  }

  // Add this function after the handleViewDetails function
  const handleCompleteOrder = async (orderId: string) => {
    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      setRefreshing(true)

      // Pass the token to updateOrderStatus
      await updateOrderStatus(orderId, "delivered", token)

      // Show success message
      alert("Order marked as completed successfully!")

      // Refresh orders list
      fetchOrders()
    } catch (error) {
      console.error("Error completing order:", error)
      alert("Failed to complete order. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  // Replace the existing handleStatusChange function with this one
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  // Replace the existing getStatusBadgeClass function with this one
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
      case "shipped":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-500"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Count the number of products in an order for the current seller
  const countSellerProducts = (order: Order) => {
    // Debug logging to help identify the issue
    console.log("User ID:", user?._id)
    console.log(
      "Order items seller IDs:",
      order.items.map((item) => item.seller_id),
    )

    // Check if user exists and has an _id property
    if (!user || !user._id) {
      console.error("User or user._id is undefined")
      return 0
    }

    // Filter items by seller ID and sum quantities
    return order.items.filter((item) => item.seller_id === user._id).reduce((sum, item) => sum + item.quantity, 0)
  }

  // Calculate the total for the current seller's products in an order
  const calculateSellerTotal = (order: Order) => {
    // Check if user exists and has an _id property
    if (!user || !user._id) {
      console.error("User or user._id is undefined")
      return 0
    }

    // Filter items by seller ID and calculate total
    return order.items
      .filter((item) => item.seller_id === user._id)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  return (
    <div className="flex">
      <SellerSidebar />
      <div className="flex-1 p-6 md:ml-64">
        <div className="container mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                  <p className="text-gray-600 dark:text-gray-400">Manage your customer orders</p>
                </div>
                <button
                  onClick={fetchOrders}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by order ID or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </form>
                <div className="flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="delivered">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading orders...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-2 text-red-500">{error}</p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {searchTerm || statusFilter ? "No orders found matching your filters" : "No orders found"}
                </p>
                {(searchTerm || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("")
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-750">
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("_id")}
                        >
                          <div className="flex items-center">
                            Order ID
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Products
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("created_at")}
                        >
                          <div className="flex items-center">
                            Date
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center">
                            Status
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("total")}
                        >
                          <div className="flex items-center">
                            Your Total
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </th>
                        <th className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              #{order._id.substring(order._id.length - 6)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {order.user?.username || "Anonymous"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {order.user?.email || "No email"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {countSellerProducts(order)} items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{formatDate(order.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              <span className="ml-1">
                                {order.status === "delivered"
                                  ? "Completed"
                                  : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              ${calculateSellerTotal(order).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {order.status === "pending" && (
                                <button
                                  onClick={() => handleCompleteOrder(order._id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Mark as Completed"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                          : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                          : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{(currentPage - 1) * ordersPerPage + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(currentPage * ordersPerPage, totalOrders)}</span> of{" "}
                        <span className="font-medium">{totalOrders}</span> results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                            currentPage === 1
                              ? "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                              : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650"
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around current page
                          let pageNum = currentPage - 2 + i
                          if (pageNum <= 0) pageNum = i + 1
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                          if (pageNum <= 0) return null // Skip if page number is still invalid

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                                pageNum === currentPage
                                  ? "z-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                  : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650"
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                            currentPage === totalPages
                              ? "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                              : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650"
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && orderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Order Details - #{orderDetails._id.substring(orderDetails._id.length - 6)}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(orderDetails.status)}`}
                      >
                        {getStatusIcon(orderDetails.status)}
                        <span className="ml-1">
                          {orderDetails.status === "delivered"
                            ? "Completed"
                            : orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                        </span>
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Information</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {orderDetails.user?.username || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {orderDetails.user?.email || "No email"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formatDate(orderDetails.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Items</h4>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Product
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Price
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Quantity
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {orderDetails.items
                              // Filter items to only show those sold by the current seller
                              .filter((item) => item.seller_id === user?._id)
                              .map((item, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 flex-shrink-0">
                                        <img
                                          className="h-10 w-10 rounded-md object-cover"
                                          src={item.product_image || "/placeholder.svg"}
                                          alt={item.product_name || `Product ${index + 1}`}
                                          onError={(e) => {
                                            ;(e.target as HTMLImageElement).src =
                                              "/placeholder.svg?height=80&width=80&text=No+Image"
                                          }}
                                        />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                          {item.product_name || `Product ${index + 1}`}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                          ID: {item.product_id}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      ${item.price.toFixed(2)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">{item.quantity}</div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {orderDetails.payment_status.charAt(0).toUpperCase() + orderDetails.payment_status.slice(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Total</h4>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                          ${calculateSellerTotal(orderDetails).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

