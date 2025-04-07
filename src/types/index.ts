export type UserRole = "buyer" | "seller" | "admin" | "superadmin"

export interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  role?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  phone?: string
  created_at: string
  seller_application?: any
}

export interface Product {
  id: string
  title: string
  price: number
  image_url?: string
  stock?: number
  description?: string
  category?: string
  seller_id?: string
  variants?: any[]
  created_at?: string
  updated_at?: string
  user_id: string
  rating: number
  reviews_count: number
  views_count: number
  clicks_count: number
  sales_count: number
  sku: string
  brand?: string
  sport_type?: string
  specifications?: Record<string, string>
  seller?: {
    full_name: string
    avatar_url?: string
    rating: number
  }
  reviews?: Review[]
  discount_percent?: number
  shipping_info?: string
  warranty?: string
  return_policy?: string
}

export interface ProductVariant {
  id: string
  product_id: string
  title: string
  price: number
  stock: number
  sku: string
  attributes: Record<string, string>
  color?: string
  size?: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user_name: string
  user_avatar?: string
  helpful_count: number
  verified?: boolean
}

export interface Order {
  id: string
  user_id: string
  seller_id: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  created_at: string
  shipping_address: Address
  billing_address: Address
  items: OrderItem[]
  payment_status: "pending" | "paid" | "failed"
  tracking_number?: string
  tracking_updates?: TrackingUpdate[]
}

export interface OrderItem {
  product_id: string
  quantity: number
  price: number
  product_title: string
  product_image: string
  variant_title?: string
}

export interface Address {
  full_name: string
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
}

export interface TrackingUpdate {
  status: string
  location: string
  timestamp: string
  description: string
}

export interface SalesPrediction {
  period: string
  actual_revenue?: number
  predicted_revenue: number
  confidence_score: number
  growth_rate: number
  factors: {
    seasonal_impact: number
    market_trend: number
    competition_index: number
  }
}

export interface MarketInsight {
  category: string
  market_size: number
  growth_rate: number
  competition_level: "low" | "medium" | "high"
  opportunity_score: number
  trending_keywords: string[]
  price_range: {
    min: number
    max: number
    optimal: number
  }
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

export interface Event {
  id: string
  user_id: string
  title: string
  description: string
  type: "tournament" | "training" | "other"
  sport: string
  date: string
  location: string
  price?: number
  max_participants?: number
  current_participants: number
  image_url?: string
}

export type Theme = "light" | "dark"

export interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type?: string
  user_id?: string
  data?: any
}

// Add a message type for the forum/chat
export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
  sender_id?: string
  sender_name?: string
  sender_avatar?: string
  content?: string
  timestamp?: string
  read?: boolean
}

// Add a chat room type
export interface ChatRoom {
  id: string
  name: string
  participants: string[]
  created_at: string
  partner?: {
    id: string
    username: string
    full_name?: string
    role: string
    avatar_url?: string
    isOnline?: boolean
    lastActive?: Date
  }
  last_message?: string
  last_timestamp?: string
  unread_count?: number
}

// Add these types at the end of the file

export interface CartItem {
  id: string
  title: string
  price: number
  image_url: string
  quantity: number
  stock: number
  user_id: string
  variant?: {
    id: string
    title: string
    color?: string
    size?: string
  }
}

export interface WishlistItem {
  id: string
  title: string
  price: number
  image_url: string
  stock: number
  user_id: string
}

