"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Plus, Search, Filter, Edit, Trash2, Eye, AlertCircle, RefreshCw } from "lucide-react"
import { getProducts, deleteProduct } from "../api/productApi"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"

export default function SellerProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0) // Add a refresh key to force re-render
  const { user, token } = useStore((state) => ({
    user: state.user,
    token: state.token,
  }))

  const navigate = useNavigate()
  const location = useLocation()
  const [sortField, setSortField] = useState("title")
  const [sortDirection, setSortDirection] = useState("asc")
  const [totalProducts, setTotalProducts] = useState(0)

  // Replace the first useEffect that checks for localStorage
  useEffect(() => {
    // Check if we're coming from the add product page with a refresh parameter
    const shouldRefresh = location.search.includes("refresh=true") || localStorage.getItem("productCreated") === "true"

    if (shouldRefresh) {
      console.log("Product was just created, refreshing product list...")
      // Clear the localStorage flag
      localStorage.removeItem("productCreated")
      localStorage.removeItem("productCreatedTimestamp")

      // Force an immediate refresh
      fetchProducts()
    }
  }, [location])

  useEffect(() => {
    if (!user || !token) {
      navigate("/login")
      return
    }

    if (user.role !== "seller" && user.role !== "admin" && user.role !== "superadmin") {
      navigate("/")
      return
    }

    fetchProducts()
  }, [user, token, navigate, sortField, sortDirection, filterCategory, location.pathname, refreshKey])

  // Update the fetchProducts function to properly handle seller_id
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the seller ID from the user object
      let sellerId = user?._id || user?.id

      // If the ID is an object with an $oid property (MongoDB ObjectId format), use that
      if (typeof sellerId === "object" && sellerId?.$oid) {
        sellerId = sellerId.$oid
      }

      console.log("Current user:", user)
      console.log("Using seller ID for filter:", sellerId)

      // Only fetch products for the current seller
      const filters = {
        seller_id: sellerId,
      }

      console.log("Fetching products with filters:", filters)
      console.log("Using token:", token ? "Yes (token exists)" : "No token")

      // Pass true as the second parameter to fetch all products
      const data = await getProducts(filters, true)
      console.log("Fetched products response:", data)

      if (Array.isArray(data)) {
        setProducts(data)
        setTotalProducts(data.length)
        console.log(`Successfully loaded ${data.length} products`)
      } else {
        console.error("API returned non-array data:", data)
        setProducts([])
        setTotalProducts(0)
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products. Please try again.")
      setProducts([]) // Set empty array on error
      setTotalProducts(0)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    // Force a complete refresh by clearing any cached data
    setRefreshKey((prev) => prev + 1) // Increment refresh key to trigger re-fetch
    fetchProducts() // Explicitly call fetchProducts to ensure immediate refresh
  }

  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    try {
      await deleteProduct(productToDelete.id, token)
      setProducts(products.filter((p) => p.id !== productToDelete.id))
      setTotalProducts((prev) => prev - 1)
      setShowDeleteModal(false)
      setProductToDelete(null)
    } catch (err) {
      console.error("Error deleting product:", err)
      setError("Failed to delete product. Please try again.")
    }
  }

  const filteredProducts = products.filter((product) => {
    // Add null checks to prevent errors with undefined properties
    const productTitle = product?.title || ""
    const productCategory = product?.category || ""

    const matchesSearch = productTitle.toLowerCase().includes((searchTerm || "").toLowerCase())
    const matchesCategory = filterCategory ? productCategory === filterCategory : true

    return matchesSearch && matchesCategory
  })

  // Safely extract categories with null check
  const categories = [
    ...new Set(
      products
        .map((product) => product?.category)
        .filter((category) => category), // Filter out undefined/null categories
    ),
  ]

  return (
    <div className="flex">
      <SellerSidebar />
      <div className="flex-1 p-6 md:ml-64">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Products</h1>
               
                <button
                  onClick={handleRefresh}
                  className="ml-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                  title="Refresh products"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              <Link
                to="/seller/add-product"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Product
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No products found.</p>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {searchTerm || filterCategory
                      ? "Try adjusting your search or filter."
                      : "Click 'Add New Product' to create your first product."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-750">
                      <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                           <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                              {product.id || "no id "}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={product.image_url || "/placeholder.svg?height=40&width=40"}
                                  alt={product.title || "Product"}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product.title || "Untitled Product"}
                                </div>
                               
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                              {product.category || "Uncategorized"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${typeof product.price === "number" ? product.price.toFixed(2) : "0.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                (product.stock || 0) > 10
                                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  : (product.stock || 0) > 0
                                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                              }`}
                            >
                              {product.stock || 0} in stock
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                             
                              <Link
                                to={`/seller/edit-product/${product.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{productToDelete?.title || "this product"}"? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

