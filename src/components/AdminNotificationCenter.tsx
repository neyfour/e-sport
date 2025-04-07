"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, CheckCircle, XCircle, Clock, User, Trash2 } from "lucide-react"
import { useStore } from "../store"
import { getSellerApplications, updateSellerStatus } from "../api/authApi"
import toast from "react-hot-toast"

export default function AdminNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const token = useStore((state) => state.token)

  // Close the notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch seller applications
  useEffect(() => {
    if (isOpen) {
      fetchApplications()
    }
  }, [isOpen, token])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const data = await getSellerApplications(token || "")
      setApplications(data)
    } catch (error) {
      console.error("Error fetching seller applications:", error)
      // Fallback to mock data
      const mockData = getMockSellerApplications()
      setApplications(mockData)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, userId: string, action: "approved" | "rejected") => {
    try {
      // In a real app, you would call your API to update the application status
      await updateSellerStatus(userId, action, "", token!)

      // Update the local state
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status: action,
                [action === "approved" ? "approved_at" : "rejected_at"]: new Date().toISOString(),
              }
            : app,
        ),
      )

      toast.success(`Seller application ${action}`)
    } catch (err) {
      console.error(`Error ${action} seller application:`, err)
      toast.error(`Failed to ${action} seller application`)
    }
  }

  // Mock data for seller applications
  const getMockSellerApplications = (): any[] => {
    return [
      {
        id: "app1",
        user_id: "user1",
        user_name: "John Smith",
        user_email: "john@example.com",
        business_name: "Smith Sports Equipment",
        business_type: "llc",
        category: "running",
        description: "We specialize in high-quality running gear for professional athletes.",
        status: "pending",
        submitted_at: "2024-06-10T14:30:00Z",
      },
      {
        id: "app2",
        user_id: "user2",
        user_name: "Sarah Johnson",
        user_email: "sarah@example.com",
        business_name: "Johnson Fitness",
        business_type: "individual",
        category: "fitness",
        description: "Premium fitness equipment for home and professional gyms.",
        status: "pending",
        submitted_at: "2024-06-09T10:15:00Z",
      },
    ]
  }

  const pendingApplicationsCount = applications.filter((app) => app.status === "pending").length

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      // In a real app, you would call your API to delete the application
      // For now, we'll just update the local state
      setApplications((prevApplications) => prevApplications.filter((app) => app.id !== applicationId))

      toast.success("Application removed from notifications")
    } catch (err) {
      console.error("Error removing application:", err)
      toast.error("Failed to remove application")
    }
  }

  const handleClearAllApplications = () => {
    try {
      // In a real app, you would call your API to clear all applications
      // For now, we'll just update the local state
      setApplications([])

      toast.success("All applications cleared")
    } catch (err) {
      console.error("Error clearing applications:", err)
      toast.error("Failed to clear applications")
    }
  }

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {pendingApplicationsCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            {pendingApplicationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Seller Applications</h3>
            <div className="flex space-x-2">
              {applications.length > 0 && (
                <button
                  onClick={handleClearAllApplications}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 rounded-full border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading applications...</p>
              </div>
            ) : applications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className={`p-4 ${
                      application.status === "pending"
                        ? "bg-yellow-50 dark:bg-yellow-900/10"
                        : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.business_name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {application.user_name} ({application.user_email})
                          </p>
                          <div className="mt-1 flex items-center text-xs">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium 
                              ${
                                application.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                  : application.status === "approved"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                            >
                              {application.status === "pending" && <Clock className="w-3 h-3 mr-1 inline" />}
                              {application.status === "approved" && <CheckCircle className="w-3 h-3 mr-1 inline" />}
                              {application.status === "rejected" && <XCircle className="w-3 h-3 mr-1 inline" />}
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(application.submitted_at).toLocaleString()}
                          </div>

                          {application.status === "pending" && (
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => handleApplicationAction(application.id, application.user_id, "approved")}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApplicationAction(application.id, application.user_id, "rejected")}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteApplication(application.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        aria-label="Delete application"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400">No seller applications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

