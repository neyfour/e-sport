"use client"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, Settings, LogOut, UserCheck, MessageSquare, Package,DollarSign } from "lucide-react"
import { useStore } from "../store"
import { getFullAvatarUrl, handleImageError } from "../utils/imageUtils"

interface SuperAdminSidebarProps {
  isOpen?: boolean
  setIsOpen?: (isOpen: boolean) => void
}

export default function SuperAdminSidebar({ isOpen: propIsOpen, setIsOpen: propSetIsOpen }: SuperAdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const logout = useStore((state) => state.logoutUser)
  const user = useStore((state) => state.user)

  const [isOpen, setIsOpen] = useState(propIsOpen !== undefined ? propIsOpen : true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Sync with external state
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen)
    }
  }, [propIsOpen])

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    if (propSetIsOpen) {
      propSetIsOpen(newState)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const sidebarWidth = isOpen ? "16rem" : "60px"

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 w-64"
      style={{ width: sidebarWidth }}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <Link to="/matrix/admin" className="flex items-center">
          {user?.avatar_url ? (
            <img
              src={getFullAvatarUrl(user.avatar_url) || "/placeholder.svg"}
              alt={user.username || "User"}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => handleImageError(e)}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold">A</span>
            </div>
          )}
          <span className="ml-2 text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {user?.username || "Admin Portal"}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="py-4 overflow-y-auto">
        <ul className="space-y-2 px-3">
          <li>
            <Link
              to="/matrix/admin"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="ml-3">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/matrix/admin/seller-applications"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin/seller-applications"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="ml-3">Seller Applications</span>
            </Link>
          </li>
          <li>
            <Link
              to="/matrix/admin/sellers"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin/sellers"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="ml-3">Sellers</span>
            </Link>
          </li>
          <li>
            <Link
              to="/matrix/admin/products"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin/products"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="ml-3">All Products</span>
            </Link>
          </li>
          <li>
            <Link
              to="/matrix/admin/seller-commissions"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin/seller-commissions"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
               <DollarSign className="w-5 h-5" />
              <span className="ml-3">Seller Commissions</span>
            </Link>
          </li>
          <li>
            <Link
              to="/matrix/admin/chat"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin/chat"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="ml-3">Seller Chat</span>
            </Link>
          </li>
          <li>
            <Link
              to="/matrix/admin/superadmin-setting"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/matrix/admin/settings"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="ml-3">Account Settings</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  )
}