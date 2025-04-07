"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, Camera, Package, Tag, Palette, Settings, ChevronRight, Plus, X, AlertCircle } from "lucide-react"
import { createProduct } from "../api/productApi"
import { useStore } from "../store"
import { api } from "../config/db"
import "../styles/AddProduct.css"
import SellerSidebar from "../components/SellerSidebar"

const PRODUCT_CATEGORIES = ["Soccer", "Basketball", "Running", "Tennis", "Fitness", "Swimming", "Cycling", "Yoga"]

interface ProductForm {
  title: string
  description: string
  category: string
  price: string
  stock: string
  images: string[]
  brand: string
  sport_type: string
  specifications: { [key: string]: string }
  variants: ProductVariant[]
  image_url: string
}

interface ProductVariant {
  title: string
  price: string
  stock: string
  attributes: { [key: string]: string }
}

export default function AddProduct() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, token } = useStore((state) => ({
    user: state.user,
    token: state.token,
  }))

  const [formData, setFormData] = useState<ProductForm>({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    images: [],
    brand: "",
    sport_type: "",
    specifications: {},
    variants: [],
    image_url: "",
  })

  useEffect(() => {
    if (!user || !token) {
      navigate("/login")
      return
    }

    if (user.role !== "seller" && user.role !== "admin" && user.role !== "superadmin") {
      navigate("/")
      return
    }
  }, [user, token, navigate])

  const steps = [
    { number: 1, title: "Basic Information", icon: Package },
    { number: 2, title: "Images & Media", icon: Camera },
    { number: 3, title: "Pricing & Inventory", icon: Tag },
    { number: 4, title: "Variants", icon: Palette },
    { number: 5, title: "Specifications", icon: Settings },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, result],
          image_url: result, // Set the main image URL
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    // Basic validation
    if (!formData.title) {
      setError("Product title is required")
      return false
    }
    if (!formData.description) {
      setError("Product description is required")
      return false
    }
    if (!formData.category) {
      setError("Product category is required")
      return false
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      setError("Valid product price is required")
      return false
    }
    if (!formData.stock || isNaN(Number(formData.stock))) {
      setError("Valid stock quantity is required")
      return false
    }

    return true
  }

  // Completely separate function for product creation
  const handleCreateProduct = () => {
    if (!token) {
      setError("You must be logged in to create a product")
      return
    }

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare product data for API
      const productData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        image_url: formData.image_url || "/placeholder.svg?height=300&width=400",
        brand: formData.brand || "",
        variants: formData.variants.map((variant) => ({
          title: variant.title || "",
          price: Number(variant.price) || 0,
          stock: Number(variant.stock) || 0,
          attributes: variant.attributes || {},
        })),
        specifications: formData.specifications || {},
      }

      console.log("Submitting with token:", token)
      console.log("API URL:", api.url)

      // Create product via API
      createProduct(productData, token)
        .then((result) => {
          console.log("Product created successfully:", result)

          // After successful product creation
          localStorage.setItem("productCreated", "true")
          localStorage.setItem("productCreatedTimestamp", Date.now().toString())

          // Redirect to products page on success with a query parameter to force refresh
          navigate("/seller/products?refresh=true")
        })
        .catch((err) => {
          console.error("Error creating product:", err)

          // Display a more user-friendly error message
          if (err.message === "Could not validate credentials") {
            setError("Authentication failed. Please try logging in again.")
          } else {
            setError(err.message || "Failed to create product. Please try again.")
          }
        })
        .finally(() => {
          setIsSubmitting(false)
        })
    } catch (err: any) {
      console.error("Error creating product:", err)
      setError(err.message || "Failed to create product. Please try again.")
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter product title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter product description"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="drag-drop-zone cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag and drop your images here, or click to select files
              </p>
            </div>
            {imagePreview && (
              <div className="relative w-32 h-32">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null)
                    setFormData((prev) => ({
                      ...prev,
                      images: prev.images.filter((img) => img !== imagePreview),
                      image_url: prev.images.filter((img) => img !== imagePreview)[0] || "",
                    }))
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter stock quantity"
                  min="0"
                />
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Variants</h3>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    variants: [...prev.variants, { title: "", price: "", stock: "", attributes: {} }],
                  }))
                }}
                className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </div>
            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="variant-card p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Variant {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = [...formData.variants]
                        newVariants.splice(index, 1)
                        setFormData({ ...formData, variants: newVariants })
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={variant.title}
                      onChange={(e) => {
                        const newVariants = [...formData.variants]
                        newVariants[index].title = e.target.value
                        setFormData({ ...formData, variants: newVariants })
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Variant name"
                    />
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => {
                        const newVariants = [...formData.variants]
                        newVariants[index].price = e.target.value
                        setFormData({ ...formData, variants: newVariants })
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => {
                        const newVariants = [...formData.variants]
                        newVariants[index].stock = e.target.value
                        setFormData({ ...formData, variants: newVariants })
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Stock"
                      min="0"
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const key = prompt("Enter attribute key (e.g., 'color', 'size')")
                        const value = prompt("Enter attribute value")
                        if (key && value) {
                          const newVariants = [...formData.variants]
                          newVariants[index].attributes = {
                            ...newVariants[index].attributes,
                            [key]: value,
                          }
                          setFormData({ ...formData, variants: newVariants })
                        }
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      + Add Attribute
                    </button>
                  </div>
                  {Object.entries(variant.attributes).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Attributes</h5>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center bg-white dark:bg-gray-600 px-2 py-1 rounded text-xs"
                          >
                            <span className="font-medium">{key}:</span>
                            <span className="ml-1">{value}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newVariants = [...formData.variants]
                                const newAttributes = { ...newVariants[index].attributes }
                                delete newAttributes[key]
                                newVariants[index].attributes = newAttributes
                                setFormData({ ...formData, variants: newVariants })
                              }}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Specifications</h3>
              <button
                type="button"
                onClick={() => {
                  const key = prompt("Enter specification key (e.g., 'Material', 'Weight')")
                  const value = prompt("Enter specification value")
                  if (key && value) {
                    setFormData((prev) => ({
                      ...prev,
                      specifications: {
                        ...prev.specifications,
                        [key]: value,
                      },
                    }))
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Specification
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(formData.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{key}</p>
                    <p className="text-gray-600 dark:text-gray-400">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newSpecs = { ...formData.specifications }
                      delete newSpecs[key]
                      setFormData({ ...formData, specifications: newSpecs })
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex">
      <SellerSidebar />
      <div className="flex-1 p-6 md:ml-64">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Product</h1>
            </div>

            <div className="p-6">
              <div className="mb-8">
                <div className="flex justify-between">
                  {steps.map((step) => (
                    <div key={step.number} className={`progress-step ${currentStep === step.number ? "active" : ""}`}>
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            currentStep === step.number
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <step.icon className="w-5 h-5" />
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white hidden md:block">
                          {step.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Changed from form to div to completely prevent form submission */}
              <div className="space-y-8">
                <div className="form-section">{renderStepContent()}</div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                    className={`px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                      currentStep === 1 ? "invisible" : ""
                    }`}
                  >
                    Previous
                  </button>
                  {currentStep === steps.length ? (
                    <button
                      type="button" // Changed from submit to button
                      onClick={handleCreateProduct} // Direct call to product creation function
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Product</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep < steps.length) {
                          setCurrentStep((prev) => prev + 1)
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

