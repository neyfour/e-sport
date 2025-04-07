import { api } from "../config/db"

// Get notifications
export const getNotifications = async (token: string, unreadOnly = false): Promise<any[]> => {
  try {
    if (!token) {
      console.warn("No token provided for getNotifications")
      return []
    }

    const url = unreadOnly ? `${api.url}/notifications?unread=true` : `${api.url}/notifications`

    const response = await fetch(url, {
      headers: api.getHeaders(token),
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, clear it
        localStorage.removeItem("auth_token")
        console.warn("Authentication token expired or invalid")
        return []
      }
      throw new Error("Failed to fetch notifications")
    }

    return await response.json()
  } catch (error) {
    console.error("Get notifications error:", error)
    // Return empty array instead of throwing
    return []
  }
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string, token: string): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: api.getHeaders(token),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to mark notification as read")
    }

    return await response.json()
  } catch (error) {
    console.error("Mark notification as read error:", error)
    throw error
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/notifications/mark-all-read`, {
      method: "PUT",
      headers: api.getHeaders(token),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to mark all notifications as read")
    }

    return await response.json()
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    throw error
  }
}

// Get notification count
export const getNotificationCount = async (token: string): Promise<number> => {
  try {
    if (!token) {
      return 0
    }

    const response = await fetch(`${api.url}/notifications/count`, {
      headers: api.getHeaders(token),
      credentials: "include",
    })

    if (!response.ok) {
      return 0
    }

    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error("Error getting notification count:", error)
    return 0
  }
}

// Delete a specific notification
export const deleteNotification = async (notificationId: string, token: string): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/notifications/${notificationId}`, {
      method: "DELETE",
      headers: api.getHeaders(token),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to delete notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Delete notification error:", error)
    throw error
  }
}

// Delete all notifications
export const deleteAllNotifications = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/notifications`, {
      method: "DELETE",
      headers: api.getHeaders(token),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to delete all notifications")
    }

    return await response.json()
  } catch (error) {
    console.error("Delete all notifications error:", error)
    throw error
  }
}

