"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, className = "" }) => {
  const [tabValue, setTabValue] = useState(defaultValue)

  const contextValue: TabsContextType = {
    value: value !== undefined ? value : tabValue,
    onValueChange: (newValue) => {
      if (onValueChange) {
        onValueChange(newValue)
      } else {
        setTabValue(newValue)
      }
    },
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = "" }) => {
  return <div className={`flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>{children}</div>
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component")
  }

  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all
        ${
          isActive
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        } ${className}`}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component")
  }

  const isActive = context.value === value

  if (!isActive) return null

  return (
    <div role="tabpanel" data-state={isActive ? "active" : "inactive"} className={className}>
      {children}
    </div>
  )
}

