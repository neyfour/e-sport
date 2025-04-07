"use client"

import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"

export default function SellerLayout() {
  const { user, token } = useStore((state) => ({
    user: state.user,
    token: state.token,
  }))
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in and is a seller
    if (!token) {
      navigate("/login")
      return
    }

    if (!user || (user.role !== "seller" && user.role !== "admin" && user.role !== "superadmin")) {
      navigate("/")
      return
    }
  }, [user, token, navigate])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <SellerSidebar />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 ease-in-out">
        <main className="p-4 md:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

