"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Chart tooltip component
export const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md"
      {...props}
    />
  ),
)
ChartTooltip.displayName = "ChartTooltip"

// Chart tooltip label component
export const ChartTooltipLabel = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className="font-medium text-gray-900 dark:text-white" {...props} />,
)
ChartTooltipLabel.displayName = "ChartTooltipLabel"

// Chart tooltip value component
export const ChartTooltipValue = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    color?: string
  }
>(({ className, color = "#6366F1", ...props }, ref) => (
  <p ref={ref} className="text-indigo-600 dark:text-indigo-400" style={{ color }} {...props} />
))
ChartTooltipValue.displayName = "ChartTooltipValue"

// Export all Recharts components
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
}

