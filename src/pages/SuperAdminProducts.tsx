"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Package, Search, Trash2, Eye, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useStore } from "../store"
import { getAllProducts, deleteProduct, getProductDetails } from "../api/superadminproductsApi"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import toast from "react-hot-toast"
import { format } from "date-fns"
import LazyImage from "../components/LazyImage"
import { formatCurrency } from "../utils/formatCurrency"

export default function SuperAdminProducts() {
  // State for products
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [productsPerPage, setProductsPerPage] = useState(10)

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [categories, setCategories] = useState<string[]>([])

  // State for modals
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [productDetails, setProductDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Get user and token from store
  const user = useStore((state) => state.user)
  const token = useStore((state) => state.token)

  // Memoized fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      if (!token) {
        setError("Authentication required")
        setLoading(false)
        return
      }

      const productsData = await getAllProducts(
        token,
        currentPage,
        productsPerPage,
        searchQuery,
        categoryFilter,
        sortBy,
        sortOrder,
      )
      if (productsData && Array.isArray(productsData)) {
        setProducts(productsData);
        setFilteredProducts(productsData);
      
        // Extract unique categories - fixed version
        const uniqueCategories = Array.from(
          new Set(productsData.map((product: any) => product.category))
        ).filter(Boolean) as string[];
      
        setCategories(uniqueCategories);
      } else {
        console.error("Invalid products data format:", productsData);
        setProducts([]);
        setFilteredProducts([]);
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products")
      toast.error("Failed to load products")
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, productsPerPage, searchQuery, categoryFilter, sortBy, sortOrder])

  // Fetch products on initial load and when filters change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Memoized handleSearch function
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
  }, [])

  // Memoized handleSort function
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new sort field and default to descending order
      setSortBy(field)
      setSortOrder("desc")
    }
    setCurrentPage(1) // Reset to first page on sort change
  }, [sortBy, sortOrder])

  // Memoized handleDeleteProduct function
  const handleDeleteProduct = useCallback((product: any) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }, [])

  // Memoized confirmDelete function
  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return

    try {
      if (!token) {
        throw new Error("Authentication required")
      }

      await deleteProduct(token, productToDelete._id)

      // Optimistic update
      setProducts(prev => prev.filter((p) => p._id !== productToDelete._id))
      setFilteredProducts(prev => prev.filter((p) => p._id !== productToDelete._id))

      toast.success("Product deleted successfully")
    } catch (err) {
      console.error("Error deleting product:", err)
      toast.error("Failed to delete product")
    } finally {
      setShowDeleteModal(false)
      setProductToDelete(null)
    }
  }, [productToDelete, token])

  // Memoized handleViewDetails function
  const handleViewDetails = useCallback(async (product: any) => {
    try {
      setLoadingDetails(true)
      if (!token) {
        throw new Error("Authentication required")
      }

      const details = await getProductDetails(token, product._id)
      setProductDetails(details)
      setShowDetailsModal(true)
    } catch (err) {
      console.error("Error fetching product details:", err)
      toast.error("Failed to load product details")
    } finally {
      setLoadingDetails(false)
    }
  }, [token])

  // Memoized pagination controls
  const totalPages = useMemo(() => Math.ceil(totalProducts / productsPerPage), [totalProducts, productsPerPage])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // Memoized loading state UI
  const loadingUI = useMemo(() => (
    <div className="flex">
      <SuperAdminSidebar />
      <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    </div>
  ), [])

 

  // Memoized pagination buttons
  const paginationButtons = useMemo(() => {
    if (totalPages <= 1) return null
    
    return (
      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing{" "}
              <span className="font-medium">
                {Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)}
              </span>{" "}
              to <span className="font-medium">{Math.min(currentPage * productsPerPage, totalProducts)}</span>{" "}
              of <span className="font-medium">{totalProducts}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber =
                  currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                      ? totalPages - 4 + i
                      : currentPage - 2 + i

                if (pageNumber <= totalPages) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === pageNumber
                          ? "bg-purple-50 dark:bg-purple-900 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-200"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      } text-sm font-medium`}
                    >
                      {pageNumber}
                    </button>
                  )
                }
                return null
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }, [currentPage, goToPage, productsPerPage, totalPages, totalProducts])

  // Memoized table rows
  const tableRows = useMemo(() => {
    if (filteredProducts.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            {loading ? "Loading products..." : "No products found"}
          </td>
        </tr>
      )
    }

    return filteredProducts.map((product) => (
      <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            <LazyImage
              src={product.image_url || "/placeholder.svg?height=64&width=64"}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.title}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {product.category || "Uncategorized"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrency(product.price)}
          </div>
          {product.compare_at_price && (
            <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
              {formatCurrency(product.compare_at_price)}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {product.seller?.username || "Unknown"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {product.created_at ? format(new Date(product.created_at), "MMM dd, yyyy") : "N/A"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => handleViewDetails(product)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
              title="View Details"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDeleteProduct(product)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title="Delete Product"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
    ))
  }, [filteredProducts, loading, handleViewDetails, handleDeleteProduct])

  if (loading && products.length === 0) {
    return loadingUI
  }

  return (
    <div className="flex">
      <SuperAdminSidebar />

      <div className="flex-1 md:ml-64 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
                  />
                </form>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
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

          {/* Products Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Image
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("title")}
                    >
                      Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("category")}
                    >
                      Category {sortBy === "category" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("price")}
                    >
                      Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Seller
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      Created At {sortBy === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tableRows}
                </tbody>
              </table>
            </div>

            {paginationButtons}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete product "{productToDelete.title}"? This action cannot be undone.
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

      {/* Product Details Modal */}
      {showDetailsModal && productDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Product Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Images */}
                <div className="space-y-4">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <LazyImage
                      src={productDetails.image_url || "/placeholder.svg?height=400&width=400"}
                      alt={productDetails.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{productDetails.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Added on{" "}
                      {productDetails.created_at ? format(new Date(productDetails.created_at), "MMMM dd, yyyy") : "N/A"}
                    </p>
                  </div>

                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                      {formatCurrency(productDetails.price)}
                    </span>
                    {productDetails.compare_at_price && (
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        {formatCurrency(productDetails.compare_at_price)}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {productDetails.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Details</h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {productDetails.category || "Uncategorized"}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{productDetails.sku || "N/A"}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Inventory</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {productDetails.stock || 0} in stock
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Seller</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {productDetails.seller?.username || "Unknown"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {productDetails.stats && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Statistics</h3>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Views</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {productDetails.stats.views || 0}
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {productDetails.stats.orders || 0}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {productDetails.reviews && productDetails.reviews.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Reviews ({productDetails.reviews.length})
                      </h3>
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {productDetails.reviews.map((review: any) => (
                          <div
                            key={review._id}
                            className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {review.user_name || "Anonymous"}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {review.created_at ? format(new Date(review.created_at), "MMM dd, yyyy") : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="flex text-yellow-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={
                                      i < (review.rating || 0) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                                    }
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}