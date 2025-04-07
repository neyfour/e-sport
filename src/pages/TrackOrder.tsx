"use client"

import type React from "react"
import { useState } from "react"

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [trackingResult, setTrackingResult] = useState<null | {
    status: string
    location: string
    lastUpdate: string
  }>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated tracking result
    setTrackingResult({
      status: "In Transit",
      location: "Distribution Center",
      lastUpdate: new Date().toLocaleDateString(),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Track Your Order</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                Order ID
              </label>
              <input
                type="text"
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Track Order
            </button>
          </form>

          {trackingResult && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tracking Result</h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Status: <span className="font-medium text-gray-900">{trackingResult.status}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Location: <span className="font-medium text-gray-900">{trackingResult.location}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Last Update: <span className="font-medium text-gray-900">{trackingResult.lastUpdate}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrackOrder

