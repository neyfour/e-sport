"use client"

import type React from "react"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Settings,
  Menu,
  X,
  Store,
  ListIcon,
} from "lucide-react"
import { useStore } from "../store"

export default function SellerSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useStore((state) => state.logout)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleReviewsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate("/seller/products/reviews")
    closeSidebar()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <Link to="/seller/dashboard" className="flex items-center" onClick={closeSidebar}>
              <span className="self-center text-xl font-semibold whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                Seller Portal
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/seller/dashboard"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/dashboard")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/seller/orders"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/orders")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  <span>Orders</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/seller/products"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/products")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <Package className="w-5 h-5 mr-2" />
                  <span>Products</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/seller/chat"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/chat")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  <span>Chat</span>
                </Link>
              </li>
              <li>
                <a
                  href="/seller/products/reviews"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    location.pathname.includes("/seller/products/reviews")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={handleReviewsClick}
                >
                  <ListIcon className="w-5 h-5 mr-2" />
                  <span>Product Reviews</span>
                </a>
              </li>
              <li className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Analytics
                </h3>
              </li>
              <li>
                <Link
                  to="/seller/statistics"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/statistics")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  <span>Statistics</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/seller/predictions"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/predictions")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span>Predictions</span>
                </Link>
              </li>

              <li className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Settings
                </h3>
              </li>
              <li>
                <Link
                  to="/seller/profile-settings"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/seller/profile-settings")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  <span>Account Settings</span>
                </Link>
              </li>

              <li>
                <Link
                  to="/"
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isActive("/")
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={closeSidebar}
                >
                  <Store className="w-5 h-5 mr-2" />
                  <span>Back to Store</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}

