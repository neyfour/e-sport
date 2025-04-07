"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Users, Search, Edit, Clock, Award } from 'lucide-react'
import { useStore } from "../store"
import { 
  getSellerCommissions, 
  updateCommissionStatus, 
  updateCommissionPercentage,
  getDefaultCommissionValues
} from "../api/sellercommissionApi"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import toast from "react-hot-toast"
import { formatCurrency } from "../utils/formatCurrency"

export default function SellerCommissionList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [commissions, setCommissions] = useState<any[]>([])
  const [filteredCommissions, setFilteredCommissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("username")
  const [sortOrder, setSortOrder] = useState("asc")
  const [showEditModal, setShowEditModal] = useState(false)
  const [commissionToEdit, setCommissionToEdit] = useState<any>(null)
  const [defaultCommission, setDefaultCommission] = useState(0.1)
  const [topSellerCommissionBonus, setTopSellerCommissionBonus] = useState(0.15)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [showUpdateForm, setShowUpdateForm] = useState(false)

  // Add a new state variable for the commission percentage edit modal
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [newCommissionPercentage, setNewCommissionPercentage] = useState(0)
  const [isEditingTopSeller, setIsEditingTopSeller] = useState(false)

  const user = useStore((state) => state.user)
  const token = useStore((state) => state.token)

  // Function to generate a unique key for each commission entry
  const getCommissionKey = (commissionId: string, month: number, year: number): string => {
    return `commission_${commissionId}_${month}_${year}_status`;
  };

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true)
        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        // Fetch default commission values
        try {
          const defaultValues = await getDefaultCommissionValues(token);
          setDefaultCommission(defaultValues.defaultCommission);
          setTopSellerCommissionBonus(defaultValues.topSellerCommissionBonus);
        } catch (err) {
          console.error("Error fetching default commission values:", err);
        }

        const data = await getSellerCommissions(token, selectedMonth, selectedYear)
        console.log("Commissions data:", data)

        // Update commission status from localStorage
        const updatedCommissions = data.map(commission => {
          const commissionKey = getCommissionKey(commission._id, selectedMonth, selectedYear);
          const storedStatus = localStorage.getItem(commissionKey);
          if (storedStatus) {
            return { ...commission, commission_status: storedStatus };
          }
          return commission;
        });

        setCommissions(updatedCommissions)
        setFilteredCommissions(updatedCommissions)
      } catch (err) {
        console.error("Error fetching seller commissions:", err)
        setError("Failed to load seller commissions")
        toast.error("Failed to load seller commissions")
      } finally {
        setLoading(false)
      }
    }

    fetchCommissions()
  }, [token, selectedMonth, selectedYear])

  useEffect(() => {
    // Filter and sort commissions when search query or sort options change
    let result = [...commissions]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (commission) =>
          commission.username?.toLowerCase().includes(query) || commission.email?.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortBy]
      const valueB = b[sortBy]

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }

      return 0
    })

    setFilteredCommissions(result)
  }, [commissions, searchQuery, sortBy, sortOrder])

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

  const handleEditStatus = (commission: any) => {
    setCommissionToEdit(commission)
    setShowEditModal(true)
  }

  // Add a function to handle opening the commission edit modal
  const handleEditCommission = (commission: any) => {
    setCommissionToEdit(commission)
    setNewCommissionPercentage(commission.commission_percentage * 100)
    setIsEditingTopSeller(commission.is_top_seller)
    setShowCommissionModal(true)
  }

  const handleUpdateStatus = async (status: "pending" | "paid") => {
    if (!commissionToEdit) return

    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      await updateCommissionStatus(commissionToEdit._id, status, token)

      // Update local state
      setCommissions((prevCommissions) =>
        prevCommissions.map((c) => (c._id === commissionToEdit._id ? { ...c, commission_status: status } : c)),
      )
      setFilteredCommissions((prevCommissions) =>
        prevCommissions.map((c) => (c._id === commissionToEdit._id ? { ...c, commission_status: status } : c)),
      )

      // Save the new status to localStorage
      const commissionKey = getCommissionKey(commissionToEdit._id, selectedMonth, selectedYear);
      localStorage.setItem(commissionKey, status);

      toast.success(`Commission status updated to ${status}`)
    } catch (err) {
      console.error("Error updating commission status:", err)
      toast.error("Failed to update commission status")
    } finally {
      setShowEditModal(false)
      setCommissionToEdit(null)
    }
  }

  // Add a function to handle updating the commission percentage
  const handleUpdateCommission = async () => {
    if (!commissionToEdit) return

    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      // Convert percentage to decimal for API
      const commissionDecimal = newCommissionPercentage / 100

      // Call API to update commission percentage
      const result = await updateCommissionPercentage(commissionToEdit._id, newCommissionPercentage, token)

      // Update local state
      setCommissions((prevCommissions) =>
        prevCommissions.map((c) =>
          c._id === commissionToEdit._id
            ? {
                ...c,
                commission_percentage: commissionDecimal,
                commission_amount: result.commission_amount || c.total_revenue * commissionDecimal,
              }
            : c,
        ),
      )

      setFilteredCommissions((prevCommissions) =>
        prevCommissions.map((c) =>
          c._id === commissionToEdit._id
            ? {
                ...c,
                commission_percentage: commissionDecimal,
                commission_amount: result.commission_amount || c.total_revenue * commissionDecimal,
              }
            : c,
        ),
      )

      toast.success(`Commission percentage updated successfully`)
    } catch (err) {
      console.error("Error updating commission percentage:", err)
      toast.error("Failed to update commission percentage")
    } finally {
      setShowCommissionModal(false)
      setCommissionToEdit(null)
    }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Commissions</h1>
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
                <div className="flex items-center">
                  <label htmlFor="month" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Month:
                  </label>
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2023, month - 1, 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="year" className="ml-2 mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Year:
                  </label>
                  <select
                    id="year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Commissions Table */}
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("total_orders")}
                    >
                      Total Orders
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("total_revenue")}
                    >
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Commission (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Commission ($)
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
                  {filteredCommissions.map((commission) => (
                    <tr key={commission._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {commission.username}
                          </div>
                          {commission.is_top_seller && (
                            <Award className="ml-2 w-4 h-4 text-yellow-500" title="Top Seller" />
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{commission.total_orders}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(commission.total_revenue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {(commission.commission_percentage * 100).toFixed(1)}%
                          {commission.is_top_seller && (
                            <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">
                              (Top Seller)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(commission.commission_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            commission.commission_status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {commission.commission_status?.charAt(0).toUpperCase() +
                            commission.commission_status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditCommission(commission)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            title="Edit Commission Percentage"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditStatus(commission)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Edit Commission Status"
                          >
                            <Clock className="w-5 h-5" />
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

      {/* Edit Status Modal */}
      {showEditModal && commissionToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Commission Status</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to update the commission status for {commissionToEdit.username}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus("paid")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => handleUpdateStatus("pending")}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Mark as Pending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {showCommissionModal && commissionToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit Commission Percentage
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seller: {commissionToEdit.username}
              </label>
              
              {commissionToEdit.is_top_seller && (
                <div className="flex items-center mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <Award className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-400">
                    Top Seller (Top 5 by order count this month)
                  </span>
                </div>
              )}
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Commission Percentage (%)
              </label>
              <input
                type="number"
                value={newCommissionPercentage}
                onChange={(e) => setNewCommissionPercentage(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                step="0.1"
                min="0"
                max="100"
              />
              
              {commissionToEdit.is_top_seller && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>Default commission: {(defaultCommission * 100).toFixed(1)}%</p>
                  <p>Top seller bonus: +{(topSellerCommissionBonus * 100).toFixed(1)}%</p>
                  <p>Standard top seller rate: {((defaultCommission + topSellerCommissionBonus) * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCommissionModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommission}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Update Commission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
