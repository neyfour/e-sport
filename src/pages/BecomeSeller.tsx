"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Store, TrendingUp, BarChart3, Users, DollarSign, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react"
import { useStore } from "../store"
import toast from "react-hot-toast"

export default function BecomeSeller() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const user = useStore((state) => state.user)
  const applyForSeller = useStore((state) => state.applyForSeller)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    category: "",
    phone: "",
    address: "",
    taxId: "",
    description: "",
    agreeTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleContinue = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.businessName || !formData.businessType || !formData.category) {
        toast.error("Please fill in all required fields")
        return
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.address || !formData.taxId) {
        toast.error("Please fill in all required fields")
        return
      }
    }

    // Proceed to next step
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If not on the final step, just continue to next step
    if (step < 3) {
      handleContinue()
      return
    }

    // Final submission
    if (!formData.agreeTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    if (!formData.description) {
      toast.error("Please provide a business description")
      return
    }

    if (!user) {
      navigate("/auth")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      // Submit seller application with proper formatting
      const applicationData = {
        business_name: formData.businessName,
        business_type: formData.businessType,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        tax_id: formData.taxId,
        description: formData.description,
        user_id: user.id,
      }

      console.log("Submitting application data:", applicationData)

      // Get token from store
      const token = useStore.getState().token
      if (!token) {
        setError("You must be logged in to apply")
        setSubmitting(false)
        return
      }

      // Submit application
      await applyForSeller(applicationData)

      toast.success(
        "Your seller application has been submitted for review! You'll receive a notification when it's processed.",
      )
      navigate("/")
    } catch (error: any) {
      console.error("Error submitting seller application:", error)
      setError(error.message || "Failed to submit application. Please try again.")
      toast.error(error.message || "Failed to submit application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Business Type</option>
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Product Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Category</option>
                <option value="soccer">Soccer</option>
                <option value="basketball">Basketball</option>
                <option value="running">Running</option>
                <option value="tennis">Tennis</option>
                <option value="fitness">Fitness</option>
                <option value="swimming">Swimming</option>
                <option value="cycling">Cycling</option>
                <option value="yoga">Yoga</option>
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax ID / Business Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Tell us about your business and the products you sell..."
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <a href="#" className="text-indigo-600 hover:text-indigo-500">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-600 hover:text-indigo-500">
                  Seller Policy
                </a>
              </label>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">What happens next?</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                After submission, your application will be reviewed by our admin team. You'll receive a notification
                once your application is approved, and you'll gain access to the seller dashboard where you can list
                products and manage your store.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Store className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Become a Seller</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join our marketplace and start selling your sports products to customers worldwide
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {/* Progress Steps */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    type="button"
                    className={`flex-1 py-4 px-6 text-center border-b-2 ${
                      step >= 1
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500"
                    }`}
                    onClick={() => step > 1 && setStep(1)}
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-2">
                      1
                    </span>
                    Business Info
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-4 px-6 text-center border-b-2 ${
                      step >= 2
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500"
                    }`}
                    onClick={() => step > 1 && setStep(2)}
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-2">
                      2
                    </span>
                    Contact Details
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-4 px-6 text-center border-b-2 ${
                      step >= 3
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500"
                    }`}
                    onClick={() => step > 2 && setStep(3)}
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-2">
                      3
                    </span>
                    Final Steps
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                {renderStepContent()}

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1 || submitting}
                    className={`px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      step === 1 ? "invisible" : ""
                    } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${
                      submitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                      </>
                    ) : step === 3 ? (
                      <>Submit Application</>
                    ) : (
                      <>Continue</>
                    )}
                    {!submitting && <ArrowRight className="ml-2 w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Benefits */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Why Sell on Matrix Commerce?</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Reach Millions of Customers</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect with sports enthusiasts and athletes worldwide.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">AI-Powered Insights</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get sales predictions and market trends to optimize your business.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Powerful Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track performance with detailed reports and dashboards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Competitive Fees</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Low commission rates to maximize your profits.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Secure Payments</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fast and secure payment processing with protection for sellers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-xl shadow-sm p-6 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Seller Success Stories
              </h2>

              <div className="space-y-4">
                <div className="bg-indigo-700 rounded-lg p-4">
                  <p className="italic mb-2">
                    "Joining Matrix Commerce transformed my small sports equipment business. Sales increased by 200% in
                    just 6 months!"
                  </p>
                  <p className="text-sm text-indigo-200">— Sarah J., Fitness Equipment Seller</p>
                </div>

                <div className="bg-indigo-700 rounded-lg p-4">
                  <p className="italic mb-2">
                    "The AI-powered insights helped me identify trending products before my competitors. Game changer!"
                  </p>
                  <p className="text-sm text-indigo-200">— Michael T., Sports Apparel Brand</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

