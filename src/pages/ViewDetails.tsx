"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Package } from "lucide-react"
import { Truck } from "lucide-react"
import { CheckCircle } from "lucide-react"
import { Clock } from "lucide-react"
import { XCircle } from "lucide-react"
import type { Order } from "../types"
import type { LucideIcon } from "lucide-react"

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

const statusColors: Record<OrderStatus, { bg: string; text: string; icon: LucideIcon }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
  processing: { bg: "bg-blue-100", text: "text-blue-800", icon: Package },
  shipped: { bg: "bg-indigo-100", text: "text-indigo-800", icon: Truck },
  delivered: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
  cancelled: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
}

const fetchOrderById = async (id: string): Promise<Order | null> => {
  try {
    // Replace this with an actual API call
    const orders: Order[] = [
      {
        id: "1",
        user_id: "1",
        status: "processing",
        total: 299.99,
        created_at: "2024-03-15T10:30:00Z",
        shipping_address: {
          full_name: "John Doe",
          street: "123 Sports Ave",
          city: "Athletic City",
          state: "AC",
          postal_code: "12345",
          country: "United States",
          phone: "+1234567890",
        },
        billing_address: {
          full_name: "John Doe",
          street: "123 Sports Ave",
          city: "Athletic City",
          state: "AC",
          postal_code: "12345",
          country: "United States",
          phone: "+1234567890",
        },
        items: [
          {
            product_id: "1",
            quantity: 2,
            price: 149.99,
            product_title: "Premium Soccer Cleats",
            product_image:
              "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=400",
            variant_title: "Size 42 - Black/Red",
          },
        ],
        payment_status: "paid",
        tracking_number: "TRK123456789",
        seller_id: "",
      },
      // Add more sample orders as needed
    ]
    return orders.find((order) => order.id === id) || null
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

const ViewDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError("Order ID is missing")
        setLoading(false)
        return
      }

      try {
        const data = await fetchOrderById(orderId)
        if (!data) {
          setError("Order not found")
        }
        setOrder(data)
      } catch (err) {
        setError("Failed to load order details")
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-red-600">{error || "Order not found"}</p>
      </div>
    )
  }

  const StatusIcon = statusColors[order.status as OrderStatus].icon

  return (
    <div className="space-y-8 p-6 bg-white rounded-xl shadow-sm" role="main">
      {/* Order Header */}
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <p className="text-gray-600 mt-1">Order ID: #{order.id}</p>
      </header>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <section className="bg-gray-50 p-4 rounded-lg" aria-labelledby="shipping-heading">
          <h2 id="shipping-heading" className="text-lg font-semibold text-gray-900">
            Shipping Address
          </h2>
          <address className="mt-2 text-sm text-gray-600 not-italic">
            {order.shipping_address.full_name}
            <br />
            {order.shipping_address.street}
            <br />
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            <br />
            {order.shipping_address.country}
            <br />
            <a href={`tel:${order.shipping_address.phone}`} className="hover:text-indigo-600">
              {order.shipping_address.phone}
            </a>
          </address>
        </section>

        {/* Billing Address */}
        <section className="bg-gray-50 p-4 rounded-lg" aria-labelledby="billing-heading">
          <h2 id="billing-heading" className="text-lg font-semibold text-gray-900">
            Billing Address
          </h2>
          <address className="mt-2 text-sm text-gray-600 not-italic">
            {order.billing_address.full_name}
            <br />
            {order.billing_address.street}
            <br />
            {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}
            <br />
            {order.billing_address.country}
            <br />
            <a href={`tel:${order.billing_address.phone}`} className="hover:text-indigo-600">
              {order.billing_address.phone}
            </a>
          </address>
        </section>
      </div>

      {/* Order Items */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        <div className="mt-4 space-y-4">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <img src={item.product_image} alt={item.product_title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{item.product_title}</p>
                  <p className="text-sm text-gray-500">{item.variant_title}</p>
                </div>
              </div>
              <div className="text-sm text-gray-900">
                ${item.price.toFixed(2)} x {item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Status and Total */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
          <div className="mt-2">
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status].bg} ${statusColors[order.status].text}`}
            >
              <StatusIcon className="w-4 h-4 mr-1" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900">Order Total</h2>
          <div className="mt-2 text-sm text-gray-900">${order.total.toFixed(2)}</div>
        </div>
      </div>

      {/* Tracking Information */}
      {order.tracking_number && (
        <section className="bg-gray-50 p-4 rounded-lg" aria-labelledby="tracking-heading">
          <h2 id="tracking-heading" className="text-lg font-semibold text-gray-900">
            Tracking Information
          </h2>
          <div className="mt-2 text-sm text-gray-600">
            <p>
              Tracking Number: <span className="font-mono">{order.tracking_number}</span>
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

export default ViewDetails

