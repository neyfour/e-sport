"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useStore } from "../store"
import toast from "react-hot-toast"
import { generateInvoice } from "../api/paymentApi"

interface PaymentFormProps {
  total: number
  shippingAddress: any
}

const PaymentForm: React.FC<PaymentFormProps> = ({ total, shippingAddress }) => {
  const navigate = useNavigate()
  const { createOrderFromCart, token } = useStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [cardDetails, setCardDetails] = useState({
    card_number: "",
    card_expiry: "",
    card_cvc: "",
    card_holder: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value)
  }

  const downloadInvoice = async (orderId: string) => {
    try {
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const invoiceBlob = await generateInvoice(orderId, token)

      // Create a download link
      const url = window.URL.createObjectURL(invoiceBlob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `invoice-${orderId}.pdf`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Invoice downloaded successfully")
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast.error("Failed to download invoice")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isProcessing) return

    // Basic validation
    if (paymentMethod === "credit_card") {
      if (!cardDetails.card_number || !cardDetails.card_expiry || !cardDetails.card_cvc || !cardDetails.card_holder) {
        toast.error("Please fill in all card details")
        return
      }

      // Simple card number validation
      if (cardDetails.card_number.replace(/\s/g, "").length !== 16) {
        toast.error("Please enter a valid card number")
        return
      }
    }

    setIsProcessing(true)

    try {
      // Prepare payment info
      const paymentInfo = {
        payment_method: paymentMethod,
        ...cardDetails,
      }

      // Create order and process payment
      const result = await createOrderFromCart(shippingAddress, paymentInfo)

      if (result && result._id) {
        toast.success("Payment processed successfully!")

        // Download invoice
        await downloadInvoice(result._id)

        // Redirect to order confirmation
        navigate(`/orders/${result._id}`)
      } else {
        toast.error("Something went wrong with your order")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="payment_method"
                value="credit_card"
                checked={paymentMethod === "credit_card"}
                onChange={handlePaymentMethodChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2">Credit Card</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="radio"
                name="payment_method"
                value="paypal"
                checked={paymentMethod === "paypal"}
                onChange={handlePaymentMethodChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2">PayPal</span>
            </label>
          </div>
        </div>

        {paymentMethod === "credit_card" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="card_number" className="block text-sm font-medium text-gray-700">
                Card Number
              </label>
              <input
                type="text"
                id="card_number"
                name="card_number"
                value={cardDetails.card_number}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="card_expiry" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="card_expiry"
                  name="card_expiry"
                  value={cardDetails.card_expiry}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  maxLength={5}
                />
              </div>

              <div>
                <label htmlFor="card_cvc" className="block text-sm font-medium text-gray-700">
                  CVC
                </label>
                <input
                  type="text"
                  id="card_cvc"
                  name="card_cvc"
                  value={cardDetails.card_cvc}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  maxLength={3}
                />
              </div>
            </div>

            <div>
              <label htmlFor="card_holder" className="block text-sm font-medium text-gray-700">
                Card Holder Name
              </label>
              <input
                type="text"
                id="card_holder"
                name="card_holder"
                value={cardDetails.card_holder}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {paymentMethod === "paypal" && (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">You will be redirected to PayPal to complete your payment.</p>
          </div>
        )}

        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Total:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentForm

