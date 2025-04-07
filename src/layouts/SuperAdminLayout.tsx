import type React from "react"
import { useState, useEffect } from "react"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import SuperAdminNavbar from "../components/SuperAdminNavbar"

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SuperAdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "16rem" : "3.5rem" }}
      >
        <SuperAdminNavbar onMenuButtonClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}