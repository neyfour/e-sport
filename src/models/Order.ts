import mongoose, { Schema, type Document } from "mongoose"

export interface IOrder extends Document {
  user_id: string
  seller_id: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  created_at: Date
  shipping_address: {
    full_name: string
    street: string
    city: string
    state: string
    postal_code: string
    country: string
    phone: string
  }
  billing_address: {
    full_name: string
    street: string
    city: string
    state: string
    postal_code: string
    country: string
    phone: string
  }
  items: Array<{
    product_id: string
    quantity: number
    price: number
    product_title: string
    product_image: string
    variant_title?: string
  }>
  payment_status: "pending" | "paid" | "failed"
  tracking_number?: string
  tracking_updates?: Array<{
    status: string
    location: string
    timestamp: Date
    description: string
  }>
}

const OrderSchema: Schema = new Schema({
  user_id: { type: String, required: true },
  seller_id: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  total: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  shipping_address: {
    full_name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  billing_address: {
    full_name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  items: [
    {
      product_id: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      product_title: { type: String, required: true },
      product_image: { type: String, required: true },
      variant_title: { type: String },
    },
  ],
  payment_status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  tracking_number: { type: String },
  tracking_updates: [
    {
      status: { type: String, required: true },
      location: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      description: { type: String, required: true },
    },
  ],
})

export default mongoose.model<IOrder>("Order", OrderSchema)

