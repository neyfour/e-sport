"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle, Clock, User, Check, ShoppingBag, AlertCircle, Trash2 ,X} from "lucide-react"
import { useStore } from "../store"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../api/notificationApi"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const token = useStore((state) => state.token)
  const user = useStore((state) => state.user)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    // Only fetch notifications if token exists
    if (token) {
      fetchNotifications()

      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

      return () => clearInterval(interval)
    }
  }, [token])

  const fetchNotifications = async () => {
    if (!token) return

    try {
      setLoading(true)
      const data = await getNotifications(token)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // Don't show error state in UI for a better user experience
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id, token)

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(token)

      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))

      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification._id)
    }

    // Handle navigation based on notification type
    if (notification.type === "application_status") {
      if (notification.data?.status === "approved") {
        navigate("/seller/dashboard")
      } else {
        navigate("/become-seller")
      }
    } else if (notification.type === "order_status") {
      navigate(`/orders/${notification.data?.order_id}`)
    } else if (notification.type === "new_order") {
      navigate(`/seller/orders/${notification.data?.order_id}`)
    }

    // Close notification panel
    setIsOpen(false)
  }

  // Close the notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "seller_application":
        return <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      case "application_status":
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case "order_status":
        return <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case "new_order":
        return <ShoppingBag className="w-5 h-5 text-green-600 dark:text-green-400" />
      case "role_update":
        return <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
      default:
        return <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    }
  }

  // Only show notification bell if user is logged in
  if (!user) {
    return null
  }

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteNotification(id, token)

      // Update local state
      setNotifications((prev) => prev.filter((notification) => notification._id !== id))
      toast.success("Notification deleted")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const handleDeleteAllNotifications = async () => {
    try {
      await deleteAllNotifications(token)

      // Update local state
      setNotifications([])
      toast.success("All notifications deleted")
    } catch (error) {
      console.error("Error deleting all notifications:", error)
      toast.error("Failed to delete all notifications")
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex space-x-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark all read
                  </button>
                  <button
                    onClick={handleDeleteAllNotifications}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-purple-600 rounded-full border-t-transparent mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 ${
                      notification.read ? "bg-white dark:bg-gray-800" : "bg-purple-50 dark:bg-purple-900/10"
                    } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification._id)
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            aria-label="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(notification._id, e)}
                          className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          aria-label="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

