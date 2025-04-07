"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CreditCard, Calendar, Lock, CheckCircle, Download, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useStore } from "../store"
// Import the processPayment function
import { processPayment } from "../api/paymentApi"

interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  image: string
}

interface ShippingAddress {
  full_name: string
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
}

export default function Payment() {
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [isSameAddress, setIsSameAddress] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orderDetails, setOrderDetails] = useState<any>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const user = useStore((state) => state.user)
  const getUserCart = useStore((state) => state.getUserCart)
  const getCartTotal = useStore((state) => state.getCartTotal)
  const createOrderFromCart = useStore((state) => state.createOrderFromCart)
  const clearCart = useStore((state) => state.clearCart)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/auth")
      return
    }

    // Get cart items from localStorage or query params
    const searchParams = new URLSearchParams(location.search)
    const cartParam = searchParams.get("cart")
    const addressParam = searchParams.get("address")

    if (addressParam) {
      try {
        const decodedAddress = JSON.parse(decodeURIComponent(addressParam))
        setShippingAddress(decodedAddress)
      } catch (error) {
        console.error("Error parsing address data:", error)
      }
    }

    if (cartParam) {
      try {
        const decodedCart = JSON.parse(decodeURIComponent(cartParam))
        setCartItems(decodedCart.items || [])
        setTotalAmount(decodedCart.total || 0)
      } catch (error) {
        console.error("Error parsing cart data:", error)
        toast.error("Failed to load cart data")
        navigate("/cart")
      }
    } else {
      // Get from user's cart in store
      const userCart = getUserCart()
      if (userCart.length > 0) {
        setCartItems(userCart)
        setTotalAmount(getCartTotal())
      } else {
        // No cart data found
        toast.error("No items in cart")
        navigate("/cart")
      }
    }
  }, [location, navigate, user, getUserCart, getCartTotal])

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ")

    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19)
  }

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    }

    return digits
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
    validateField("cardNumber", formatCardNumber(e.target.value))
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value))
    validateField("expiryDate", formatExpiryDate(e.target.value))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 4)
    setCvv(value)
    validateField("cvv", value)
  }

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value)
    validateField("cardName", e.target.value)
  }

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case "cardNumber":
        if (value.replace(/\s/g, "").length < 16) {
          newErrors.cardNumber = "Please enter a valid 16-digit card number"
        } else {
          delete newErrors.cardNumber
        }
        break
      case "cardName":
        if (!value.trim()) {
          newErrors.cardName = "Cardholder name is required"
        } else {
          delete newErrors.cardName
        }
        break
      case "expiryDate":
        if (value.length < 5) {
          newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)"
        } else {
          const [month, year] = value.split("/")
          const currentYear = new Date().getFullYear() % 100
          const currentMonth = new Date().getMonth() + 1

          if (Number.parseInt(month) < 1 || Number.parseInt(month) > 12) {
            newErrors.expiryDate = "Month must be between 01 and 12"
          } else if (
            Number.parseInt(year) < currentYear ||
            (Number.parseInt(year) === currentYear && Number.parseInt(month) < currentMonth)
          ) {
            newErrors.expiryDate = "Card has expired"
          } else {
            delete newErrors.expiryDate
          }
        }
        break
      case "cvv":
        if (value.length < 3) {
          newErrors.cvv = "CVV must be 3 or 4 digits"
        } else {
          delete newErrors.cvv
        }
        break
    }

    setErrors(newErrors)
  }

  const validateForm = () => {
    validateField("cardNumber", cardNumber)
    validateField("cardName", cardName)
    validateField("expiryDate", expiryDate)
    validateField("cvv", cvv)

    return Object.keys(errors).length === 0
  }

  const generateInvoice = (orderData: any) => {
    const doc = new jsPDF()

    // Add invoice header
    doc.setFontSize(20)
    doc.text("INVOICE", 105, 20, { align: "center" })

    // Add company info
    doc.setFontSize(12)
    doc.text("Matrix Commerce", 20, 40)
    doc.text("123 Sports Avenue", 20, 45)
    doc.text("Athletic City, CA 90210", 20, 50)

    // Add customer info
    doc.text("Bill To:", 20, 65)
    doc.text(user?.username || cardName || "Customer", 20, 70)
    doc.text(user?.email || "", 20, 75)
    if (shippingAddress) {
      doc.text(shippingAddress.street, 20, 80)
      doc.text(`${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`, 20, 85)
      doc.text(shippingAddress.country, 20, 90)
    }

    // Add invoice details
    doc.text(`Invoice #: INV-${orderData.id || orderData._id || Math.floor(Math.random() * 10000)}`, 140, 40)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 45)

    // Add table header
    const tableColumn = ["Item", "Qty", "Price", "Total"]
    const tableRows: any[] = []

    // Add items to table
    cartItems.forEach((item) => {
      const itemData = [
        item.title,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`,
      ]
      tableRows.push(itemData)
    })

    // Generate the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 100,
      theme: "grid",
    })

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text("Subtotal:", 140, finalY)
    doc.text(`$${(totalAmount * 0.9).toFixed(2)}`, 170, finalY, { align: "right" })

    doc.text("Tax (10%):", 140, finalY + 5)
    doc.text(`$${(totalAmount * 0.1).toFixed(2)}`, 170, finalY + 5, { align: "right" })

    doc.text("Total:", 140, finalY + 15)
    doc.setFontSize(14)
    doc.text(`$${totalAmount.toFixed(2)}`, 170, finalY + 15, { align: "right" })

    // Add thank you note
    doc.setFontSize(12)
    doc.text("Thank you for your business!", 105, finalY + 30, { align: "center" })

    // Save the PDF
    const pdfBlob = doc.output("blob")
    const pdfUrl = URL.createObjectURL(pdfBlob)

    return pdfUrl
  }

  // Updated processPaymentWithFallback function with better error handling
  const processPaymentWithFallback = async (paymentData: any) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      console.log("Processing payment with data:", JSON.stringify(paymentData))

      // Process payment with the backend
      const response = await processPayment(
        {
          payment_method: "credit_card",
          payment_details: paymentData.card,
          amount: paymentData.amount,
          billing_address: paymentData.billing_address,
          shipping_address: paymentData.shipping_address,
          order_id: paymentData.order_id,
        },
        token,
      )

      // Check if payment was already processed
      if (response.already_paid) {
        return {
          success: true,
          already_paid: true,
          transaction_id: response.transaction_id || response._id,
          amount: response.amount,
          date: response.created_at,
          ...response,
        }
      }

      return {
        success: response.status === "completed",
        transaction_id: response.transaction_id || response._id,
        amount: response.amount,
        date: response.created_at,
        ...response,
      }
    } catch (error) {
      console.log("Payment processing failed:", error)

      // Check if the error is about payment already processed
      if (error.message && error.message.includes("Payment already processed")) {
        return {
          success: true,
          already_paid: true,
          transaction_id: `already_paid_${Date.now()}`,
          amount: paymentData.amount,
          date: new Date().toISOString(),
          status: "completed",
        }
      }

      // Simulate payment processing for development/testing
      if (process.env.NODE_ENV === "development") {
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Return mock payment result
        return {
          success: true,
          transaction_id: `mock_tx_${Math.random().toString(36).substring(2, 15)}`,
          amount: paymentData.amount,
          date: new Date().toISOString(),
          status: "completed",
        }
      }

      throw error
    }
  }

  // Update the handleSubmit function to properly handle the payment process:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    const [cardMonth, cardYear] = expiryDate.split("/")
    const cardExpiry = `${cardYear}-${cardMonth}`
    const cardCvc = cvv

    const billingAddress = isSameAddress ? shippingAddress : null

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast.error("Please log in to complete your purchase")
        navigate("/auth?redirect=/cart")
        return
      }

      // Format items for the backend
      const formattedItems = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        title: item.title,
        name: item.title, // Add name field for backend compatibility
        image: item.image,
      }))

      // Create order first
      let orderData
      try {
        orderData = await createOrderFromCart(shippingAddress, {
          payment_method: "credit_card",
          card_number: cardNumber.replace(/\s/g, "").slice(-4), // Only store last 4 digits
          card_expiry: cardExpiry,
          card_holder: cardName,
        })
      } catch (error) {
        console.error("Error creating order:", error)

        // Check if the error is because the order already exists
        if (error.message && error.message.includes("already exists")) {
          toast.error("This order has already been placed")
          setIsProcessing(false)
          return
        }

        // For development, create a mock order
        if (process.env.NODE_ENV === "development") {
          console.warn("Using mock order for development")
          // Generate a valid MongoDB ObjectId format (24 hex chars)
          const mockId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

          orderData = {
            _id: mockId,
            id: mockId,
            user_id: "000000000000000000000000",
            items: formattedItems,
            total: totalAmount,
            status: "pending",
            payment_status: "pending",
            created_at: new Date().toISOString(),
            shipping_address: shippingAddress,
            billing_address: shippingAddress,
          }
        } else {
          throw error
        }
      }

      // Set order details for confirmation
      setOrderDetails(orderData)
      setOrderId(orderData.id || orderData._id)

      // Prepare payment data
      const paymentData = {
        order_id: orderData._id,
        amount: totalAmount,
        payment_method: "credit_card",
        payment_details: {
          number: cardNumber.replace(/\s/g, "").slice(-4),
          expiry: cardExpiry,
          cvc: cardCvc,
          name: cardName,
        },
        billing_address: billingAddress,
        shipping_address: shippingAddress,
      }

      // Process payment
      let paymentResult
      try {
        paymentResult = await processPaymentWithFallback(paymentData)
      } catch (error) {
        console.error("Error processing payment:", error)

        // Check if the error is about payment already processed
        if (error.message && error.message.includes("Payment already processed")) {
          // Show success message for already processed payments
          toast.success("Your payment was already processed successfully!")
          setPaymentSuccess(true)

          // Generate invoice
          const invoiceUrl = generateInvoice(orderData)
          setInvoiceUrl(invoiceUrl)

          setIsProcessing(false)
          return
        }

        // For development, create a mock payment result
        if (process.env.NODE_ENV === "development") {
          console.warn("Using mock payment result for development")
          paymentResult = {
            success: true,
            transaction_id: `mock_tx_${Math.random().toString(36).substring(2, 15)}`,
            amount: totalAmount,
            date: new Date().toISOString(),
            status: "completed",
          }
        } else {
          throw error
        }
      }

      // Check if payment was already processed
      if (paymentResult.already_paid) {
        toast.success("Your payment was already processed successfully!")
        setPaymentSuccess(true)

        // Generate invoice
        const invoiceUrl = generateInvoice(orderData)
        setInvoiceUrl(invoiceUrl)

        // Clear cart if needed
        if (typeof clearCart === "function") {
          clearCart()
        }

        setIsProcessing(false)
        return
      }

      if (paymentResult.success) {
        // Generate invoice
        const invoiceUrl = generateInvoice(orderData)
        setInvoiceUrl(invoiceUrl)

        // Clear cart if needed
        if (typeof clearCart === "function") {
          clearCart()
        }

        // Show success message
        setPaymentSuccess(true)
        toast.success("Payment successful!")
      } else {
        throw new Error(paymentResult.message || "Payment failed")
      }
    } catch (error) {
      if (error.message === "Authentication required") {
        toast.error("Please log in to complete your purchase")
        navigate("/auth?redirect=/cart")
      } else if (error.message && error.message.includes("Payment already processed")) {
        // Handle already processed payments
        toast.success("Your payment was already processed successfully!")
        setPaymentSuccess(true)
      } else {
        toast.error(error.message || "Payment processing failed")
        console.error("Payment error:", error)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // If not logged in, don't render (redirect will happen)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {paymentSuccess ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your order #{orderId} has been placed successfully. You will receive a confirmation email shortly.
            </p>
            {invoiceUrl && (
              <div className="flex justify-center mb-6">
                <a
                  href={invoiceUrl}
                  download={`invoice-${orderId}.pdf`}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Invoice
                </a>
              </div>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Complete Your Payment</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Payment Form */}
              <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payment Details</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="cardNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Card Number
                      </label>
                      <div className="relative">
                        <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          id="cardNumber"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className={`pl-10 w-full rounded-lg border ${
                            errors.cardNumber
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                          } focus:border-transparent dark:bg-gray-700 dark:text-white py-3`}
                        />
                      </div>
                      {errors.cardNumber && <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>}
                    </div>

                    <div>
                      <label
                        htmlFor="cardName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        id="cardName"
                        value={cardName}
                        onChange={handleCardNameChange}
                        placeholder="John Doe"
                        className={`w-full rounded-lg border ${
                          errors.cardName
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                        } focus:border-transparent dark:bg-gray-700 dark:text-white py-3 px-4`}
                      />
                      {errors.cardName && <p className="mt-1 text-sm text-red-500">{errors.cardName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="expiryDate"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Expiry Date
                        </label>
                        <div className="relative">
                          <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            id="expiryDate"
                            value={expiryDate}
                            onChange={handleExpiryDateChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            className={`pl-10 w-full rounded-lg border ${
                              errors.expiryDate
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                            } focus:border-transparent dark:bg-gray-700 dark:text-white py-3`}
                          />
                        </div>
                        {errors.expiryDate && <p className="mt-1 text-sm text-red-500">{errors.expiryDate}</p>}
                      </div>

                      <div>
                        <label
                          htmlFor="cvv"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          CVV
                        </label>
                        <div className="relative">
                          <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            id="cvv"
                            value={cvv}
                            onChange={handleCvvChange}
                            placeholder="123"
                            maxLength={4}
                            className={`pl-10 w-full rounded-lg border ${
                              errors.cvv
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                            } focus:border-transparent dark:bg-gray-700 dark:text-white py-3`}
                          />
                        </div>
                        {errors.cvv && <p className="mt-1 text-sm text-red-500">{errors.cvv}</p>}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="same-address"
                        type="checkbox"
                        checked={isSameAddress}
                        onChange={() => setIsSameAddress(!isSameAddress)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="same-address" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Billing address is the same as shipping address
                      </label>
                    </div>

                    <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        Your payment information is secure. We use encryption to protect your data.
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>Pay ${totalAmount.toFixed(2)}</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.title} {item.quantity > 1 && `(${item.quantity})`}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">${(totalAmount * 0.9).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                      <span className="text-gray-900 dark:text-white">${(totalAmount * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-indigo-600 dark:text-indigo-400">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {shippingAddress && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
                      <address className="not-italic text-sm text-gray-600 dark:text-gray-400">
                        <p>{shippingAddress.full_name}</p>
                        <p>{shippingAddress.street}</p>
                        <p>
                          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                        </p>
                        <p>{shippingAddress.country}</p>
                        <p>{shippingAddress.phone}</p>
                      </address>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

