"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Users, Search, Trash2, Ban, CheckCircle, Clock } from "lucide-react"
import { useStore } from "../store"
import { getSellers, deleteSeller } from "../api/authApi"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function SellersList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sellers, setSellers] = useState<any[]>([])
  const [filteredSellers, setFilteredSellers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sellerToDelete, setSellerToDelete] = useState<any>(null)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)
  const [isUnsuspending, setIsUnsuspending] = useState(false)
  const [sellerToSuspend, setSellerToSuspend] = useState<any>(null)
  const [suspensionReason, setSuspensionReason] = useState("")

  const user = useStore((state) => state.user)
  const token = useStore((state) => state.token)
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        const sellersData = await getSellers(token)
        setSellers(sellersData)
        setFilteredSellers(sellersData)
      } catch (err) {
        console.error("Error fetching sellers:", err)
        setError("Failed to load sellers")
        toast.error("Failed to load sellers")
      } finally {
        setLoading(false)
      }
    }

    fetchSellers()
  }, [token])

  useEffect(() => {
    // Filter and sort sellers when search query or sort options change
    let result = [...sellers]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (seller) =>
          seller.username?.toLowerCase().includes(query) ||
          seller.email?.toLowerCase().includes(query) ||
          seller.full_name?.toLowerCase().includes(query) ||
          seller.business_name?.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA = a[sortBy]
      let valueB = b[sortBy]

      // Handle numeric values
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA
      }

      // Handle date values
      if (sortBy === "created_at") {
        valueA = new Date(valueA).getTime()
        valueB = new Date(valueB).getTime()
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA
      }

      // Handle string values
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }

      return 0
    })

    setFilteredSellers(result)
  }, [sellers, searchQuery, sortBy, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The filtering is already handled in the useEffect
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new sort field and default to descending order
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleDeleteSeller = (seller: any) => {
    setSellerToDelete(seller)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!sellerToDelete) return

    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      await deleteSeller(sellerToDelete._id, token)
      setSellers(sellers.filter((s) => s._id !== sellerToDelete._id))
      setFilteredSellers(filteredSellers.filter((s) => s._id !== sellerToDelete._id))
      toast.success("Seller deleted successfully")
    } catch (err) {
      console.error("Error deleting seller:", err)
      toast.error("Failed to delete seller")
    } finally {
      setShowDeleteModal(false)
      setSellerToDelete(null)
    }
  }

  const handleSuspendSeller = (seller: any) => {
    setSellerToSuspend(seller)
    setSuspensionReason("")
    setShowSuspendModal(true)
  }

  const confirmSuspend = async () => {
    if (!sellerToSuspend) return

    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      setIsSuspending(true)
      // Calculate suspension end date (10 days from now)
      const suspensionEndDate = new Date()
      suspensionEndDate.setDate(suspensionEndDate.getDate() + 10)

      // Update seller's account with suspension details
      const response = await fetch(`${apiBaseUrl}/users/${sellerToSuspend._id}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          suspended_until: suspensionEndDate.toISOString(),
          reason: suspensionReason || "Violation of terms of service",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to suspend seller")
      }

      // Update local state
      setSellers((prevSellers) =>
        prevSellers.map((s) =>
          s._id === sellerToSuspend._id
            ? {
                ...s,
                suspended_until: suspensionEndDate.toISOString(),
                suspension_reason: suspensionReason || "Violation of terms of service",
              }
            : s,
        ),
      )
      setFilteredSellers((prevSellers) =>
        prevSellers.map((s) =>
          s._id === sellerToSuspend._id
            ? {
                ...s,
                suspended_until: suspensionEndDate.toISOString(),
                suspension_reason: suspensionReason || "Violation of terms of service",
              }
            : s,
        ),
      )

      toast.success("Seller suspended successfully")
    } catch (err) {
      console.error("Error suspending seller:", err)
      toast.error("Failed to suspend seller")
    } finally {
      setShowSuspendModal(false)
      setSellerToSuspend(null)
      setIsSuspending(false)
    }
  }

  const handleUnsuspendSeller = async (seller: any) => {
    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      setIsUnsuspending(true)

      // Call the unsuspend API endpoint
      const response = await fetch(`${apiBaseUrl}/users/${seller._id}/unsuspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to unsuspend seller")
      }

      // Update local state
      setSellers((prevSellers) =>
        prevSellers.map((s) =>
          s._id === seller._id
            ? {
                ...s,
                suspended_until: undefined,
                suspension_reason: undefined,
              }
            : s,
        ),
      )
      setFilteredSellers((prevSellers) =>
        prevSellers.map((s) =>
          s._id === seller._id
            ? {
                ...s,
                suspended_until: undefined,
                suspension_reason: undefined,
              }
            : s,
        ),
      )

      toast.success("Seller unsuspended successfully")
    } catch (err) {
      console.error("Error unsuspending seller:", err)
      toast.error("Failed to unsuspend seller")
    } finally {
      setIsUnsuspending(false)
    }
  }

  // Helper function to check if a seller is currently suspended
  const isSellerSuspended = (seller: any) => {
    if (!seller.suspended_until) return false
    const suspensionEndDate = new Date(seller.suspended_until)
    return suspensionEndDate > new Date()
  }

  // Helper function to format suspension end date
  const formatSuspensionDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

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
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sellers</h1>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search sellers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("username")}
                    >
                      Username
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date of Becoming Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSellers.map((seller) => (
                    <tr key={seller._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{seller.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{seller.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {seller.created_at ? format(new Date(seller.created_at), "MMM dd, yyyy") : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{seller.total_products || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{seller.total_orders || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${seller.total_sales?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSellerSuspended(seller) ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-orange-500 mr-1" />
                            <span className="text-sm text-orange-500">
                              Suspended until {formatSuspensionDate(seller.suspended_until)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                           
                            <span className="text-sm text-green-500">Active</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {isSellerSuspended(seller) ? (
                            <button
                              onClick={() => handleUnsuspendSeller(seller)}
                              disabled={isUnsuspending}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                              title="Unsuspend Seller"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendSeller(seller)}
                              disabled={isSuspending}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                              title="Suspend Seller"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSeller(seller)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Delete Seller"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sellerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete seller "{sellerToDelete.username}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && sellerToSuspend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Suspension</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to suspend seller "{sellerToSuspend.username}" for 10 days?
            </p>
            <div className="mb-4">
              <label
                htmlFor="suspensionReason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Reason for suspension (optional)
              </label>
              <textarea
                id="suspensionReason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Enter reason for suspension"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspend}
                disabled={isSuspending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                {isSuspending ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span>
                    Suspending...
                  </>
                ) : (
                  "Suspend"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

