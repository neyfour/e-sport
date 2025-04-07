// src/api/authApi.ts
import { api } from "../config/db"
import type { User } from "../types"

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
}): Promise<User> => {
  try {
    const response = await fetch(`${api.url}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
      }),
    });

    if (!response.ok) {
      // Try to parse error response
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
        
        // Handle validation errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join('\n');
        }
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Store token if available
    if (data.access_token) {
      localStorage.setItem("auth_token", data.access_token);
    }

    return data.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};
// Update the loginUser function to match the backend API
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    // Format credentials for OAuth2 password flow
    const formData = new URLSearchParams()
    formData.append("username", email)
    formData.append("password", password)

    // Try to make login request to the backend
    const response = await fetch(`${api.url}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    if (!response.ok) {
      // Handle suspension and other errors
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403 && errorData.detail) {
        throw new Error(`Account suspended until ${errorData.detail}`);
      }
      
      throw new Error(errorData.detail || "Login failed");
    }

    const data: LoginResponse = await response.json();

    // Store token in localStorage for future requests
    localStorage.setItem("auth_token", data.access_token);
    return data.user;

  } catch (error) {
    console.error("Login error:", error)
    throw error
    
  }
}

// Update the googleLogin function to match the backend API
export const googleLogin = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${api.url}/users/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Google login failed")
    }

    const data = await response.json()

    // Store token in localStorage for future requests
    if (data.access_token) {
      localStorage.setItem("auth_token", data.access_token)
    }

    return data.user
  } catch (error) {
    console.error("Google login error:", error)
    throw error
  }
}

export const logoutUser = () => {
  // Remove token from localStorage
  localStorage.removeItem("auth_token")
  console.log("Logging out user")
}

// Update the checkAuthStatus function to match the backend API
export const checkAuthStatus = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem("auth_token")

    if (!token) {
      return null
    }

    const response = await fetch(`${api.url}/users/me`, {
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      localStorage.removeItem("auth_token")
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Auth check error:", error)
    return null
  }
}

// Add a function to apply for seller status
export const applyForSeller = async (applicationData: any, token: string): Promise<any> => {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    console.log("Sending seller application data:", applicationData)

    const response = await fetch(`${api.url}/seller-applications`, {
      method: "POST",
      headers: api.getHeaders(token),
      body: JSON.stringify(applicationData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Server error response:", errorData)
      throw new Error(errorData.detail || "Application failed")
    }

    const result = await response.json()
    console.log("Server response for seller application:", result)
    return result
  } catch (error) {
    console.error("Seller application error:", error)
    throw error
  }
}

// Add a function for superadmin to approve/reject seller applications
export const updateSellerStatus = async (
  applicationId: string,
  status: "approved" | "rejected",
  reason = "",
  token: string,
): Promise<any> => {
  try {
    if (!applicationId) {
      throw new Error("Application ID is required")
    }

    console.log(`Updating application ${applicationId} status to ${status}`)

    // Use the correct endpoint format
    const endpoint = `/seller-applications/${applicationId}/status`
    const body = JSON.stringify({
      status: status,
      reason: status === "rejected" ? reason : "",
    })

    const response = await fetch(`${api.url}${endpoint}`, {
      method: "PUT",
      headers: api.getHeaders(token),
      body: body,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to update seller status")
    }

    return await response.json()
  } catch (error) {
    console.error("Update seller status error:", error)
    throw error
  }
}

// Get seller applications
export const getSellerApplications = async (token: string, status?: string): Promise<any[]> => {
  try {
    const url = status ? `${api.url}/seller-applications?status=${status}` : `${api.url}/seller-applications`

    const response = await fetch(url, {
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch seller applications")
    }

    return await response.json()
  } catch (error) {
    console.error("Get seller applications error:", error)
    // Return empty array instead of throwing
    return []
  }
}

// Delete a seller
export const deleteSeller = async (sellerId: string, token: string): Promise<boolean> => {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    if (!sellerId) {
      throw new Error("Seller ID is required")
    }

    console.log(`Deleting seller with ID: ${sellerId}`)

    const response = await fetch(`${api.url}/users/${sellerId}`, {
      method: "DELETE",
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      // Try to get error details if available
      let errorMessage = "Failed to delete seller"
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    return true
  } catch (error) {
    console.error("Delete seller error:", error)
    throw error
  }
}

// Get all sellers (for superadmin)
export const getSellers = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch(`${api.url}/users/sellers`, {
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch sellers")
    }

    return await response.json()
  } catch (error) {
    console.error("Get sellers error:", error)
    throw error
  }
}

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

// Delete a seller application
export const deleteSellerApplication = async (applicationId: string, token: string): Promise<boolean> => {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    if (!applicationId) {
      throw new Error("Application ID is required")
    }

    console.log(`Deleting application with ID: ${applicationId}`)

    const response = await fetch(`${api.url}/seller-applications/${applicationId}`, {
      method: "DELETE",
      headers: api.getHeaders(token),
    })

    if (!response.ok) {
      // Try to get error details if available
      let errorMessage = "Failed to delete application"
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    return true
  } catch (error) {
    console.error("Delete seller application error:", error)
    throw error
  }
}
// Mark all notifications as read
export const markAllNotificationsAsRead = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${api.url}/notifications/read-all`, {
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

