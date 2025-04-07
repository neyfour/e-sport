"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/matrix",
    },
    {
      title: "Products",
      icon: ShoppingBag,
      path: "/matrix/products",
    },
    {
      title: "Orders",
      icon: PackageCheck,
      path: "/matrix/orders",
    },
    {
      title: "Predictions",
      icon: BarChart3,
      path: "/matrix/predictions",
    },
    {
      title: "Statistics",
      icon: PieChart,
      path: "/matrix/statistics",
    },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-24 left-4 z-50 p-2 rounded-md bg-indigo-600 text-white md:hidden"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-50 pt-20 ${
          isCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="px-4 py-2 flex justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hidden md:block"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <div className="px-2 py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className={`${isCollapsed ? "mx-auto" : "mr-3"}`} size={20} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

