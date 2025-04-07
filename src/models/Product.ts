import mongoose, { Schema, type Document } from "mongoose"

export interface IProduct extends Document {
  user_id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string
  created_at: Date
  stock: number
  rating: number
  reviews_count: number
  views_count: number
  clicks_count: number
  sales_count: number
  sku: string
  brand?: string
  sport_type?: string
  variants?: Array<{
    title: string
    price: number
    stock: number
    sku: string
    attributes: Record<string, string>
  }>
  specifications?: Record<string, string>
}

const ProductSchema: Schema = new Schema({
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image_url: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews_count: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  clicks_count: { type: Number, default: 0 },
  sales_count: { type: Number, default: 0 },
  sku: { type: String, required: true, unique: true },
  brand: { type: String },
  sport_type: { type: String },
  variants: [
    {
      title: { type: String, required: true },
      price: { type: Number, required: true },
      stock: { type: Number, required: true },
      sku: { type: String, required: true },
      attributes: { type: Map, of: String },
    },
  ],
  specifications: { type: Map, of: String },
})

export default mongoose.model<IProduct>("Product", ProductSchema)

