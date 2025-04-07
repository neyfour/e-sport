"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Lock, Mail, UserCircle, Trash2, Save, AlertTriangle, CheckCircle2, X, Camera } from "lucide-react"
import toast from "react-hot-toast"
import { useStore } from "../store"
import { checkAuthStatus } from "../api/authApi"
import { getFullAvatarUrl, handleImageError } from "../utils/imageUtils"

// Import API functions
import { api } from "../config/db"

interface ProfileFormData {
  username: string
  email: string
  full_name?: string
  current_password: string
}

interface PasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

interface DeleteAccountData {
  password: string
  confirmation: boolean
}

export default function Settings() {
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Form states
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: user?.username || "",
    email: user?.email || "",
    full_name: user?.full_name || "",
    current_password: "",
  })

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [deleteAccountData, setDeleteAccountData] = useState<DeleteAccountData>({
    password: "",
    confirmation: false,
  })

  // Add email verification functionality
  const [verificationCode, setVerificationCode] = useState("")
  const [showVerification, setShowVerification] = useState(false)

  // Function to get the full URL for an avatar
  // const getFullAvatarUrl = (avatarPath: string | null | undefined): string => {
  //   if (!avatarPath) return "/placeholder.svg"

  //   // If it's already a full URL, return it
  //   if (avatarPath.startsWith("http")) {
  //     return avatarPath
  //   }

  //   // If it's a relative path starting with /, join it with the API base URL
  //   if (avatarPath.startsWith("/")) {
  //     // Remove trailing slash from API URL if it exists
  //     const baseUrl = api.url.endsWith("/") ? api.url.slice(0, -1) : api.url
  //     return `${baseUrl}${avatarPath}`
  //   }

  //   // Otherwise, join with / separator
  //   return `${api.url}/${avatarPath}`
  // }

  useEffect(() => {
    // Redirect to home if not logged in
    if (!user) {
      navigate("/")
      return
    }

    // Update form data when user changes
    if (user) {
      setProfileData({
        ...profileData,
        username: user.username || "",
        email: user.email || "",
        full_name: user.full_name || "",
      })

      // Check if email needs verification
      if (user.email_verified === false) {
        setShowVerification(true)
      }
    }
  }, [user, navigate])

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData({ ...profileData, [name]: value })
  }

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData({ ...passwordData, [name]: value })
  }

  // Handle delete account form changes
  const handleDeleteAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setDeleteAccountData({
      ...deleteAccountData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, and GIF images are allowed")
        return
      }

      setAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      // Get auth token and check if it exists
      const token = localStorage.getItem("auth_token")
      if (!token) {
        // If no token, try to refresh it or redirect to login
        toast.error("You need to be logged in to update your profile")
        navigate("/auth") // Redirect to auth page
        return
      }

      // Update the profile picture upload section in handleProfileUpdate
      // First update avatar if there's a new one
      if (avatarFile) {
        const formData = new FormData()
        formData.append("file", avatarFile)

        try {
          // Use the correct API endpoint
          const response = await fetch(`${api.url}/settings/profile-picture`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || "Failed to update profile picture")
          }

          const data = await response.json()
          console.log("Profile picture update response:", data)

          // Update avatar preview
          setAvatarPreview(null)
          setAvatarFile(null)

          // If we got an avatar URL back, update the user object
          if (data.avatar_url && user) {
            // Get the full URL for the avatar
            const fullAvatarUrl = data.full_avatar_url || getFullAvatarUrl(data.avatar_url)
            console.log("Full avatar URL:", fullAvatarUrl)

            // Update user state with new avatar URL
            setUser({
              ...user,
              avatar_url: fullAvatarUrl,
            })

            // Show success message
            toast.success("Profile picture updated successfully")
          }
        } catch (error) {
          console.error("Profile picture update error:", error)
          toast.error("Failed to update profile picture, but continuing with profile update")
          // Continue with profile update even if avatar update fails
        }
      }

      // Then update profile data
      // Format the data according to what the backend expects
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        full_name: profileData.full_name || "",
        current_password: profileData.current_password,
      }

      console.log("Sending profile update with token:", token)
      console.log("Update data:", updateData)

      // Use the correct API endpoint with /api prefix
      const response = await fetch(`${api.url}/settings/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to update profile")
      }

      // Get the updated user data from the response
      const updatedUserData = await response.json()

      // Update user in store with the response data
      if (updatedUserData) {
        // Make sure the user object has the correct format
        const formattedUser = {
          ...updatedUserData,
          id: updatedUserData.id || updatedUserData._id,
          // Ensure avatar_url is a full URL
          avatar_url: updatedUserData.avatar_url ? getFullAvatarUrl(updatedUserData.avatar_url) : null,
        }
        setUser(formattedUser)
      }

      setSuccessMessage("Profile updated successfully")
      toast.success("Profile updated successfully")

      // Clear password field
      setProfileData({
        ...profileData,
        current_password: "",
      })

      // Check if email was changed and show verification message if needed
      if (updatedUserData.email !== user?.email && updatedUserData.email_verified === false) {
        toast.info("A verification code has been sent to your new email address")
        setShowVerification(true)
      }
    } catch (error) {
      console.error("Profile update error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")

      // If we get an authentication error, redirect to login
      if (error instanceof Error && error.message.includes("Authentication")) {
        localStorage.removeItem("auth_token") // Clear invalid token
        toast.error("Your session has expired. Please log in again.")
        setTimeout(() => navigate("/auth"), 2000) // Redirect after showing toast
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage("New passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (passwordData.new_password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast.error("You need to be logged in to update your password")
        navigate("/auth")
        return
      }

      // Format the data according to what the backend expects
      const passwordUpdateData = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      }

      console.log("Sending password update with token:", token)

      // Use the correct API endpoint with /api prefix
      const response = await fetch(`${api.url}/settings/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordUpdateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to update password")
      }

      setSuccessMessage("Password updated successfully")
      toast.success("Password updated successfully")

      // Clear password fields
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (error) {
      console.error("Password update error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")

      // If we get an authentication error, redirect to login
      if (error instanceof Error && error.message.includes("Authentication")) {
        localStorage.removeItem("auth_token") // Clear invalid token
        toast.error("Your session has expired. Please log in again.")
        setTimeout(() => navigate("/auth"), 2000) // Redirect after showing toast
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    if (!deleteAccountData.confirmation) {
      setErrorMessage("You must confirm account deletion")
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast.error("You need to be logged in to delete your account")
        navigate("/auth")
        return
      }

      // Format the data according to what the backend expects
      const deleteData = {
        password: deleteAccountData.password,
        confirmation: deleteAccountData.confirmation,
      }

      console.log("Sending account deletion with token:", token)

      // Use the correct API endpoint with /api prefix
      const response = await fetch(`${api.url}/settings/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deleteData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to delete account")
      }

      // Clear auth token and user data
      localStorage.removeItem("auth_token")
      setUser(null)

      toast.success("Account deleted successfully")
      navigate("/")
    } catch (error) {
      console.error("Account deletion error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Add this function to handle email verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast.error("You need to be logged in to verify your email")
        navigate("/auth")
        return
      }

      console.log("Sending email verification with token:", token)

      // Use the correct API endpoint with /api prefix
      const response = await fetch(`${api.url}/settings/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to verify email")
      }

      // Update user in store
      const updatedUser = await checkAuthStatus()
      if (updatedUser) {
        setUser(updatedUser)
      }

      setSuccessMessage("Email verified successfully")
      toast.success("Email verified successfully")
      setShowVerification(false)
      setVerificationCode("")
    } catch (error) {
      console.error("Email verification error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")

      // If we get an authentication error, redirect to login
      if (error instanceof Error && error.message.includes("Authentication")) {
        localStorage.removeItem("auth_token") // Clear invalid token
        toast.error("Your session has expired. Please log in again.")
        setTimeout(() => navigate("/auth"), 2000) // Redirect after showing toast
      }
    } finally {
      setLoading(false)
    }
  }

  // Clear messages when changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setErrorMessage("")
    setSuccessMessage("")
  }

  // Add a useEffect to check authentication on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          console.error("No authentication token found")
          navigate("/auth")
          return
        }

        // Log the token for debugging
        console.log("Token found:", token ? "Yes" : "No")

        // Verify the token is valid
        const userData = await checkAuthStatus()
        if (!userData) {
          console.error("Authentication check failed")
          localStorage.removeItem("auth_token")
          navigate("/auth")
        }
      } catch (error) {
        console.error("Authentication verification error:", error)
        toast.error("Authentication failed. Please log in again.")
        localStorage.removeItem("auth_token")
        navigate("/auth")
      }
    }

    verifyAuth()
  }, [navigate])

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Account Settings</h1>

      {/* Settings navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleTabChange("profile")}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </button>
        <button
          onClick={() => handleTabChange("password")}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === "password"
              ? "bg-primary text-primary-foreground"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Lock className="w-4 h-4 mr-2" />
          Password
        </button>
        <button
          onClick={() => handleTabChange("delete")}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === "delete"
              ? "bg-red-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </button>
      </div>

      {/* Success/Error messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
          <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-grow text-green-800 dark:text-green-300">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-500 hover:text-green-700 dark:text-green-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-grow text-red-800 dark:text-red-300">{errorMessage}</div>
          <button onClick={() => setErrorMessage("")} className="text-red-500 hover:text-red-700 dark:text-red-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Information</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Update your account's profile information.</p>
          </div>

          {showVerification && (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">Verify Your Email</h3>
              <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                A verification code has been sent to your email address. Please enter the code below to verify your
                email.
              </p>
              <form onSubmit={handleVerifyEmail} className="mt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="block w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-md shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify Email"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="p-6">
            {/* Avatar section */}
            <div className="mb-6 flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e)}
                    />
                  ) : user.avatar_url ? (
                    <img
                      src={getFullAvatarUrl(user.avatar_url) || "/placeholder.svg"}
                      alt={user.username || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <UserCircle className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span className="sr-only">Upload avatar</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex-grow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.username || user.full_name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Click the camera icon to upload a new profile picture
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={profileData.full_name || ""}
                  onChange={handleProfileChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="current_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Current Password (to confirm changes)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={profileData.current_password}
                    onChange={handleProfileChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Settings */}
      {activeTab === "password" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Update Password</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Ensure your account is using a secure password.</p>
          </div>

          <form onSubmit={handlePasswordUpdate} className="p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Current Password
                </label>
                <input
                  id="current_password"
                  name="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="new_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  New Password
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Update Password
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Account */}
      {activeTab === "delete" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-red-200 dark:border-red-900/50">
          <div className="p-6 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-300">Delete Account</h2>
            <p className="text-red-600 dark:text-red-400 mt-1">
              Once your account is deleted, all of its resources and data will be permanently deleted.
            </p>
          </div>

          <form onSubmit={handleDeleteAccount} className="p-6">
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Warning</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                    <p>
                      This action cannot be undone. This will permanently delete your account and remove your data from
                      our servers.
                    </p>
                    {user.role === "seller" && (
                      <p className="mt-2">
                        <strong>Seller accounts:</strong> All your products will be permanently deleted.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="delete_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Enter your password to confirm
                </label>
                <input
                  id="delete_password"
                  name="password"
                  type="password"
                  value={deleteAccountData.password}
                  onChange={handleDeleteAccountChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="confirmation"
                    name="confirmation"
                    type="checkbox"
                    checked={deleteAccountData.confirmation}
                    onChange={handleDeleteAccountChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="confirmation" className="font-medium text-gray-700 dark:text-gray-300">
                    I understand that this action cannot be undone
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

