// User types
export interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  role: "buyer" | "seller" | "admin" | "superadmin"
  created_at: string
  avatar_url?: string
  seller_application_status?: "pending" | "approved" | "rejected"
}

// Product types
export interface ProductVariant {
  color?: string | null
  size?: string | null
  price: number
  stock: number
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string
  rating: number
  stock: number
  seller_id?: string
  created_at: string
  updated_at?: string
  brand?: string
  tags?: string[]
  discount_percent?: number
  variants?: ProductVariant[]
  quantity?: number
  user_id?: string
  reviews_count?: number
  views_count?: number
  clicks_count?: number
  sales_count?: number
  sku?: string
}

// Order types
export interface OrderItem {
  id: string
  product_id: string
  product_title: string
  product_image: string
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: string
  user_id: string
  items: OrderItem[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  created_at: string
  updated_at?: string
  shipping_address?: string
  payment_method?: string
  tracking_number?: string
}

// Notification types
export interface Notification {
  id: string
  title: string
  message: string
  type: "order_update" | "seller_application" | "system"
  read: boolean
  created_at: string
  link?: string
}

// Chat types
export interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  content: string
  timestamp: string
  room_id: string
}

export interface ChatRoom {
  id: string
  name: string
  participants: string[]
  created_at: string
}

// Statistics and Predictions
export interface SalesPrediction {
  period: string
  predicted_revenue: number
  actual_revenue?: number
  growth_rate: number
  confidence_low?: number
  confidence_high?: number
}

export interface MarketInsight {
  category: string
  market_size: number
  growth_rate: number
  competition_level: string
  opportunity_score: number
  trending_keywords: string[]
  price_range: {
    min: number
    max: number
    optimal: number
  }
}

