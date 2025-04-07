"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, AlertCircle } from "lucide-react"
import { useStore } from "../store"
import toast from "react-hot-toast"

// Import AuthModal
import AuthModal from "../components/AuthModal"

export default function Cart() {
  const [isLoading, setIsLoading] = useState(true)
  const [shippingAddress, setShippingAddress] = useState({
    full_name: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAddressForm, setShowAddressForm] = useState(false)

  const user = useStore((state) => state.user)
  const getUserCart = useStore((state) => state.getUserCart)
  const getCartTotal = useStore((state) => state.getCartTotal)
  const updateCartItemQuantity = useStore((state) => state.updateCartItemQuantity)
  const removeFromCart = useStore((state) => state.removeFromCart)

  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartTotal, setCartTotal] = useState(0)

  // Add state for auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Update the useEffect to show AuthModal instead of redirecting
  useEffect(() => {
    // Load cart items if user is logged in
    if (user) {
      const loadCart = async () => {
        try {
          setIsLoading(true)
          const items = getUserCart()
          console.log("Cart items loaded:", items)
          setCartItems(items)
          setCartTotal(getCartTotal())

          // Pre-fill address form with user data if available
          if (user.address) {
            setShippingAddress({
              full_name: user.full_name || "",
              street: user.address.street || "",
              city: user.address.city || "",
              state: user.address.state || "",
              postal_code: user.address.postal_code || "",
              country: user.address.country || "",
              phone: user.phone || "",
            })
          }
        } catch (error) {
          console.error("Error loading cart:", error)
          toast.error("Failed to load cart items")
        } finally {
          setIsLoading(false)
        }
      }

      loadCart()
    } else {
      setIsLoading(false)
    }
  }, [user, getUserCart, getCartTotal])

  // Add a listener for cart changes
  useEffect(() => {
    if (user) {
      // Create a function to update cart items
      const updateCartItems = () => {
        const items = getUserCart()
        setCartItems(items)
        setCartTotal(getCartTotal())
      }

      // Set up an interval to check for cart changes
      const intervalId = setInterval(updateCartItems, 2000)

      // Clean up the interval on component unmount
      return () => clearInterval(intervalId)
    }
  }, [user, getUserCart, getCartTotal])

  const handleQuantityChange = (itemId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) {
      newQuantity = 1
    } else if (newQuantity > maxStock) {
      newQuantity = maxStock
      toast.error(`Sorry, only ${maxStock} items available in stock`)
    }

    updateCartItemQuantity(itemId, newQuantity)

    // Update local state
    setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))

    // Recalculate total
    setCartTotal(getCartTotal())
  }

  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(itemId)

    // Update local state
    setCartItems((prev) => prev.filter((item) => item.id !== itemId))

    // Recalculate total
    setCartTotal(getCartTotal())

    toast.success("Item removed from cart")
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingAddress((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateAddressForm = () => {
    const errors: Record<string, string> = {}

    if (!shippingAddress.full_name.trim()) {
      errors.full_name = "Full name is required"
    }

    if (!shippingAddress.street.trim()) {
      errors.street = "Street address is required"
    }

    if (!shippingAddress.city.trim()) {
      errors.city = "City is required"
    }

    if (!shippingAddress.postal_code.trim()) {
      errors.postal_code = "Postal code is required"
    }

    if (!shippingAddress.country.trim()) {
      errors.country = "Country is required"
    }

    if (!shippingAddress.phone.trim()) {
      errors.phone = "Phone number is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setShowAddressForm(true)
  }

  const handleProceedToPayment = () => {
    if (!validateAddressForm()) {
      return
    }

    // Encode cart and address data for URL
    const cartData = {
      items: cartItems,
      total: cartTotal,
    }

    const cartParam = encodeURIComponent(JSON.stringify(cartData))
    const addressParam = encodeURIComponent(JSON.stringify(shippingAddress))

    navigate(`/payment?cart=${cartParam}&address=${addressParam}`)
  }

  // Replace the loading check with a check for both loading and user
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // If no user, show auth modal
  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Please log in to view your cart
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to be logged in to view and manage your shopping cart.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ShoppingCart className="h-8 w-8 text-indigo-500 mr-3" />
            My Cart
          </h1>

          {cartItems.length > 0 && !showAddressForm && (
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Shopping
            </button>
          </div>
        ) : showAddressForm ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Shipping Address</h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={shippingAddress.full_name}
                      onChange={handleAddressChange}
                      className={`w-full rounded-lg border ${
                        formErrors.full_name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                      } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                    />
                    {formErrors.full_name && <p className="mt-1 text-sm text-red-500">{formErrors.full_name}</p>}
                  </div>

                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleAddressChange}
                      className={`w-full rounded-lg border ${
                        formErrors.street
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                      } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                    />
                    {formErrors.street && <p className="mt-1 text-sm text-red-500">{formErrors.street}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        className={`w-full rounded-lg border ${
                          formErrors.city
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                        } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                      />
                      {formErrors.city && <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>}
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        State / Province
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        className={`w-full rounded-lg border ${
                          formErrors.state
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                        } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                      />
                      {formErrors.state && <p className="mt-1 text-sm text-red-500">{formErrors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="postal_code"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postal_code"
                        name="postal_code"
                        value={shippingAddress.postal_code}
                        onChange={handleAddressChange}
                        className={`w-full rounded-lg border ${
                          formErrors.postal_code
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                        } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                      />
                      {formErrors.postal_code && <p className="mt-1 text-sm text-red-500">{formErrors.postal_code}</p>}
                    </div>

                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={shippingAddress.country}
                        onChange={handleAddressChange}
                        className={`w-full rounded-lg border ${
                          formErrors.country
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                        } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                      />
                      {formErrors.country && <p className="mt-1 text-sm text-red-500">{formErrors.country}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleAddressChange}
                      className={`w-full rounded-lg border ${
                        formErrors.phone
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                      } focus:border-transparent dark:bg-gray-700 dark:text-white py-2 px-3`}
                    />
                    {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Cart
                  </button>

                  <button
                    onClick={handleProceedToPayment}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.title} {item.quantity > 1 && `(x${item.quantity})`}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">${(cartTotal * 0.9).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                    <span className="text-gray-900 dark:text-white">${(cartTotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <li key={item.id} className="p-6 flex flex-col sm:flex-row">
                      <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mb-4 sm:mb-0">
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-center object-cover"
                        />
                      </div>

                      <div className="sm:ml-6 flex-1 flex flex-col">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.title}</h3>
                            {item.variant && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {item.variant.title}
                                {item.variant.color && ` - ${item.variant.color}`}
                                {item.variant.size && ` - Size ${item.variant.size}`}
                              </p>
                            )}
                          </div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex-1 flex items-end justify-between">
                          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.stock)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-1 text-gray-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.stock)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        </div>

                        {item.stock <= 5 && (
                          <div className="mt-2 flex items-center text-sm text-amber-600 dark:text-amber-500">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {item.stock === 0 ? "Out of stock" : `Only ${item.stock} left`}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Items ({cartItems.length})</span>
                    <span className="text-gray-900 dark:text-white">${(cartTotal * 0.9).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                    <span className="text-gray-900 dark:text-white">${(cartTotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">Order total</span>
                    <span className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

