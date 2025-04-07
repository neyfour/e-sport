"use client"

import { useState } from "react"
import { Tag, Calendar, Clock, Percent, ShoppingBag, Gift, ChevronRight, Copy, CheckCircle } from "lucide-react"
import { useStore } from "../store"
import toast from "react-hot-toast"

export default function Promotions() {
  const [activeTab, setActiveTab] = useState("current")
  const user = useStore((state) => state.user)

  // Sample promotions data
  const promotions = [
    {
      id: "SUMMER25",
      title: "Summer Sale",
      description: "Get 25% off on all summer sports equipment",
      discount_type: "percentage",
      discount_value: 25,
      min_purchase: 50,
      expiry_date: "2024-08-31",
      categories: ["running", "swimming", "tennis"],
      image_url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "NEWUSER10",
      title: "New Customer Discount",
      description: "Save $10 on your first purchase",
      discount_type: "fixed",
      discount_value: 10,
      min_purchase: 30,
      expiry_date: "2024-12-31",
      categories: ["all"],
      image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "BUNDLE20",
      title: "Bundle Discount",
      description: "Buy any 3 items and get 20% off",
      discount_type: "percentage",
      discount_value: 20,
      min_purchase: 0,
      expiry_date: "2024-07-15",
      categories: ["basketball", "soccer", "fitness"],
      image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "FREESHIP75",
      title: "Free Shipping",
      description: "Free shipping on orders over $75",
      discount_type: "shipping",
      discount_value: 100,
      min_purchase: 75,
      expiry_date: "2024-09-30",
      categories: ["all"],
      image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
    },
  ]

  // Filter promotions based on active tab
  const filteredPromotions = promotions.filter((promo) => {
    const today = new Date()
    const expiryDate = new Date(promo.expiry_date)

    if (activeTab === "current") {
      return expiryDate >= today
    } else {
      return expiryDate < today
    }
  })

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Promo code ${code} copied to clipboard!`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Tag className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Special Offers & Promotions</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover exclusive deals and discounts on our sports equipment
          </p>
        </div>

        {/* Featured Promotion */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white mb-4">
                Limited Time Offer
              </span>
              <h2 className="text-3xl font-bold text-white mb-4">Summer Sale</h2>
              <p className="text-indigo-100 mb-6">
                Get 25% off on all summer sports equipment. Stock up now for your outdoor activities!
              </p>
              <div className="bg-white/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-white">SUMMER25</span>
                    <button
                      onClick={() => copyPromoCode("SUMMER25")}
                      className="ml-3 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex items-center text-white">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">Expires in {getDaysRemaining("2024-08-31")} days</span>
                  </div>
                </div>
              </div>
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors self-start">
                Shop Now
              </button>
            </div>
            <div className="hidden md:block relative">
              <img
                src="https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80&w=800"
                alt="Summer Sale"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-indigo-600/50"></div>
            </div>
          </div>
        </div>

        {/* Promotions Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("current")}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "current"
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Current Promotions
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "expired"
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Expired Promotions
            </button>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPromotions.map((promotion) => {
            const daysRemaining = getDaysRemaining(promotion.expiry_date)
            const isExpired = daysRemaining <= 0

            return (
              <div
                key={promotion.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative h-48">
                  <img src={promotion.image_url} alt={promotion.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{promotion.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{promotion.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {promotion.discount_type === "percentage" ? (
                        <Percent className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                      ) : promotion.discount_type === "fixed" ? (
                        <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                      ) : (
                        <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {promotion.discount_type === "percentage"
                          ? `${promotion.discount_value}% Off`
                          : promotion.discount_type === "fixed"
                            ? `$${promotion.discount_value} Off`
                            : "Free Shipping"}
                      </span>
                    </div>
                    {promotion.min_purchase > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Min. ${promotion.min_purchase}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Expires: {new Date(promotion.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                    {!isExpired && (
                      <span
                        className={`text-sm font-medium ${
                          daysRemaining <= 3 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {daysRemaining} days left
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="relative">
                        <input
                          type="text"
                          value={promotion.id}
                          readOnly
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
                        />
                        <button
                          onClick={() => copyPromoCode(promotion.id)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <button
                      disabled={isExpired}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        isExpired
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      }`}
                    >
                      {isExpired ? "Expired" : "Apply"}
                      {!isExpired && <ChevronRight className="w-4 h-4 ml-1" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredPromotions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === "current" ? "No active promotions" : "No expired promotions"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeTab === "current"
                ? "Check back later for new deals and discounts"
                : "Previous promotions will appear here"}
            </p>
          </div>
        )}

        {/* How to Use Promo Codes */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">How to Use Promo Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Step 1: Copy Code</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Click the copy button next to the promo code you want to use
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Step 2: Add to Cart</h3>
              <p className="text-gray-600 dark:text-gray-400">Add eligible products to your shopping cart</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Step 3: Apply at Checkout</h3>
              <p className="text-gray-600 dark:text-gray-400">Paste the code in the promo code field during checkout</p>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Get Exclusive Promotions</h2>
            <p className="text-indigo-100 mb-6">
              Subscribe to our newsletter and be the first to know about new deals and special offers
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="button"
                onClick={() => toast.success("Thank you for subscribing!")}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

