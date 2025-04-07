import type React from "react"

interface CardProps {
  className?: string
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className = "", children }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className = "", children }) => {
  return <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
}

interface CardTitleProps {
  className?: string
  children: React.ReactNode
}

export const CardTitle: React.FC<CardTitleProps> = ({ className = "", children }) => {
  return <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>{children}</h3>
}

interface CardDescriptionProps {
  className?: string
  children: React.ReactNode
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ className = "", children }) => {
  return <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>
}

interface CardContentProps {
  className?: string
  children: React.ReactNode
}

export const CardContent: React.FC<CardContentProps> = ({ className = "", children }) => {
  return <div className={`p-4 ${className}`}>{children}</div>
}

