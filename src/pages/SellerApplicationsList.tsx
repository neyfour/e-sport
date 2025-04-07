"use client"

import { useState, useEffect } from "react"
import { Users, Search, Filter, CheckCircle, XCircle, Clock, Trash } from "lucide-react"
import { useStore } from "../store"
import { getSellerApplications, updateSellerStatus, deleteSellerApplication } from "../api/authApi"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import toast from "react-hot-toast"
import { api } from "../config/db"

export default function SellerApplicationsList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const token = useStore((state) => state.token)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        if (!token) {
          setError("Authentication required")
          setLoading(false)
          return
        }

        console.log("Fetching seller applications...")
        const data = await getSellerApplications(token)
        console.log("Received seller applications:", data)

        if (Array.isArray(data)) {
          setApplications(data)
          setFilteredApplications(data)
        } else {
          console.error("Invalid data format received:", data)
          setApplications([])
          setFilteredApplications([])
          setError("Invalid data format received from server")
        }
      } catch (err) {
        console.error("Error fetching seller applications:", err)
        setError("Failed to load seller applications")
        setApplications([])
        setFilteredApplications([])
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchApplications, 30000)

    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    // Filter applications based on search query and status filter
    let filtered = [...applications]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.business_name?.toLowerCase().includes(query) ||
          app.user?.username?.toLowerCase().includes(query) ||
          app.user?.email?.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchQuery, statusFilter])

  const handleApplicationAction = async (applicationId: string, action: "approved" | "rejected") => {
    try {
      console.log(`Attempting to ${action} application with ID:`, applicationId)

      if (!applicationId) {
        toast.error(`Cannot ${action} application: Missing application ID`)
        return
      }

      await updateSellerStatus(
        applicationId,
        action,
        action === "rejected" ? "Application rejected by admin" : "",
        token!,
      )

      // Update the local state
      setApplications((prevApplications) =>
        prevApplications.map((app) => (app._id === applicationId ? { ...app, status: action } : app)),
      )

      // Find the application to get the user ID
      const application = applications.find((app) => app._id === applicationId)

      if (application && application.user_id) {
        // Create notification for the user
        try {
          await fetch(`${api.url}/notifications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: application.user_id,
              type: "seller_application_status",
              title: `Application ${action}`,
              message:
                action === "approved"
                  ? "Congratulations! Your seller application has been approved. You can now access the seller dashboard."
                  : "Your seller application has been rejected. Please contact support for more information.",
              data: { application_id: applicationId, status: action },
            }),
          })
        } catch (notifError) {
          console.error("Failed to create notification:", notifError)
          // Continue even if notification creation fails
        }
      }

      toast.success(`Seller application ${action}`)
    } catch (err) {
      console.error(`Error ${action} seller application:`, err)
      toast.error(`Failed to ${action} seller application`)
    }
  }

  // Function to delete a rejected application
  const handleDeleteApplication = async (applicationId: string) => {
    try {
      if (!token) {
        toast.error("Authentication required")
        return
      }

      if (!applicationId) {
        toast.error("Cannot delete application: Missing application ID")
        return
      }

      // Set deleting state to prevent multiple clicks
      setIsDeleting(true)

      // Show loading toast
      const loadingToast = toast.loading("Deleting application...")

      try {
        // Use the deleteSellerApplication function from authApi
        const success = await deleteSellerApplication(applicationId, token)

        // Dismiss loading toast
        toast.dismiss(loadingToast)

        if (success) {
          // Update local state by removing the deleted application
          setApplications((prevApplications) => prevApplications.filter((app) => app._id !== applicationId))
          setFilteredApplications((prevApplications) => prevApplications.filter((app) => app._id !== applicationId))
          toast.success("Application deleted successfully")
        }
      } catch (error) {
        // Dismiss loading toast
        toast.dismiss(loadingToast)
        console.error("Error deleting application:", error)
        toast.error(error instanceof Error ? error.message : "Failed to delete application")
      } finally {
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Error in delete handler:", error)
      toast.error("An unexpected error occurred")
      setIsDeleting(false)
    }
  }

  const openEditModal = (application: any) => {
    setCurrentApplication(application)
    setIsEditModalOpen(true)
  }

  const handleStatusUpdate = async (newStatus: "pending" | "approved" | "rejected") => {
    if (!currentApplication || !currentApplication._id) return

    try {
      await updateSellerStatus(
        currentApplication._id,
        newStatus,
        newStatus === "rejected" ? "Application status updated by admin" : "",
        token!,
      )

      // Update the local state
      setApplications((prevApplications) =>
        prevApplications.map((app) => (app._id === currentApplication._id ? { ...app, status: newStatus } : app)),
      )

      toast.success(`Application status updated to ${newStatus}`)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error("Error updating application status:", err)
      toast.error("Failed to update application status")
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Applications</h1>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredApplications.length > 0 ? (
                    filteredApplications.map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.business_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {application.business_type?.charAt(0).toUpperCase() + application.business_type?.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.user?.username || application.user_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {application.user?.email || application.user_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            {application.category?.charAt(0).toUpperCase() + application.category?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full 
                           ${
                             application.status === "pending"
                               ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                               : application.status === "approved"
                                 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                 : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                           }`}
                          >
                            {application.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                            {application.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {application.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                            {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(application.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {application.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApplicationAction(application._id, "approved")}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApplicationAction(application._id, "rejected")}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(application)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                title="Edit Application Status"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-5 h-5"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteApplication(application._id)}
                                disabled={isDeleting}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                                title="Delete Application"
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          No applications found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "No seller applications have been submitted yet"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Status Modal */}
      {isEditModalOpen && currentApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Application Status</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Business:{" "}
                <span className="font-medium text-gray-900 dark:text-white">{currentApplication.business_name}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Status:
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full 
            ${
              currentApplication.status === "pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                : currentApplication.status === "approved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            }`}
                >
                  {currentApplication.status?.charAt(0).toUpperCase() + currentApplication.status?.slice(1)}
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Status:</label>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleStatusUpdate("pending")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentApplication.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-2 border-yellow-500"
                      : "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusUpdate("approved")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentApplication.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-2 border-green-500"
                      : "bg-green-50 text-green-800 dark:bg-green-900/10 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => handleStatusUpdate("rejected")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentApplication.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-2 border-red-500"
                      : "bg-red-50 text-red-800 dark:bg-red-900/10 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

