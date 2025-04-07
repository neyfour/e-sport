"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  MessageSquare,
} from "lucide-react"
import { useStore } from "../store"
import { logoutUser } from "../api/authApi"
// Remove the getFullAvatarUrl function we just added and replace with import
import { getFullAvatarUrl, handleImageError } from "../utils/imageUtils"

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const navigate = useNavigate()

  // Close the dropdown when clicking outside
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

  const handleLogout = async () => {
    try {
      await logoutUser()
      setUser(null)
      navigate("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={getFullAvatarUrl(user.avatar_url) || "/placeholder.svg"}
            alt={user.username || "User"}
            className="h-8 w-8 rounded-full object-cover"
            // Update the img tag's onError handler:
            onError={(e) => handleImageError(e)}
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">{user.username || user.full_name || "User"}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username || user.full_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <div className="mt-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-medium inline-block">
              {user.role ? (
                    user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      ) : (
                      'User'
                    )}
            </div>
          </div>

          {(user.role === "superadmin" ) && (
            <button
              onClick={() => {
                setIsOpen(false)
                navigate("/matrix/admin")
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Admin Dashboard
            </button>
          )}

          {user.role === "seller" && (
            <>
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate("/seller/dashboard")
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Seller Dashboard
              </button>
             
            </>
          )}

          <button
            onClick={() => {
              setIsOpen(false)
              navigate("/profile")
            }}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

