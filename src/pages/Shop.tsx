"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Filter, Search, SlidersHorizontal, X, ShoppingBag } from "lucide-react"
import { getProducts, getProductCategories } from "../api/productApi"
import { useStore } from "../store"
import ProductPreviewModal from "../components/ProductPreviewModal"
import ProductCard from "../components/ProductCard"
import type { Product } from "../types"

export default function Shop() {
  const location = useLocation()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const token = useStore((state) => state.token)

  // Preview modal state
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 })
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [minRating, setMinRating] = useState<number>(0)
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")

  // Get unique colors and sizes from products
  const colors = [...new Set(products.flatMap((p) => p.variants?.map((v) => v.color).filter(Boolean) || []))].filter(
    Boolean,
  ) as string[]
  const sizes = [...new Set(products.flatMap((p) => p.variants?.map((v) => v.size).filter(Boolean) || []))].filter(
    Boolean,
  ) as string[]

  useEffect(() => {
    // Parse search params from URL
    const params = new URLSearchParams(location.search)
    const searchFromUrl = params.get("search")
    const categoryFromUrl = params.get("category")

    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }

    fetchCategories()
    fetchProducts()
  }, [location.search])

  const fetchCategories = async () => {
    try {
      const categoriesData = await getProductCategories(token)
      setCategories(categoriesData)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Failed to load categories")
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(location.search)
      const searchFromUrl = params.get("search")
      const categoryFromUrl = params.get("category")

      const productsData = await getProducts({
        search: searchFromUrl || searchQuery || undefined,
        category: categoryFromUrl || selectedCategory || undefined,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        brand: selectedBrand || undefined,
        inStock: inStockOnly,
        rating: minRating > 0 ? minRating : undefined,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
      })

      setProducts(productsData)

      // Extract unique brands
      const uniqueBrands = [...new Set(productsData.map((p) => p.brand).filter(Boolean))]
      setBrands(uniqueBrands as string[])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const applyFilters = () => {
    fetchProducts()
    if (window.innerWidth < 768) {
      setFiltersOpen(false)
    }
  }

  const resetFilters = () => {
    setSelectedCategory("")
    setSelectedBrand("")
    setPriceRange({ min: 0, max: 1000 })
    setMinRating(0)
    setInStockOnly(false)
    setSelectedColor("")
    setSelectedSize("")
    setSearchQuery("")

    // Immediately fetch products with reset filters
    setTimeout(() => {
      fetchProducts()
    }, 0)
  }

  const openProductPreview = (product: Product) => {
    if (!product) {
      console.error("Cannot preview undefined product")
      return
    }
    setPreviewProduct(product)
    setIsPreviewOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Shop Our Collection</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Discover quality products for every need</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg mb-4 w-full justify-center"
        >
          <SlidersHorizontal size={18} />
          {filtersOpen ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Filters Sidebar */}
        <div
          className={`w-full md:w-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 transition-all duration-300 ${
            filtersOpen ? "block" : "hidden md:block"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter size={20} />
              Filters
            </h2>
            <button
              onClick={resetFilters}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-600 dark:text-indigo-400"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Categories
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === category}
                    onChange={() => {
                      setSelectedCategory(category)
                      applyFilters()
                    }}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category}</span>
                </label>
              ))}
              {selectedCategory && (
                <button
                  onClick={() => {
                    setSelectedCategory("")
                    applyFilters()
                  }}
                  className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                >
                  <X size={12} className="mr-1" />
                  Clear selection
                </button>
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              Price Range
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                min="0"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Min"
              />
              <span className="text-gray-500 dark:text-gray-400">-</span>
              <input
                type="number"
                min="0"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number.parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Max"
              />
            </div>
            <div className="px-1">
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number.parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number.parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 mt-2"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>$0</span>
                <span>$500</span>
                <span>$1000</span>
              </div>
            </div>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                Brands
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {brands.map((brand) => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === brand}
                      onChange={() => {
                        setSelectedBrand(brand)
                        applyFilters()
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{brand}</span>
                  </label>
                ))}
                {selectedBrand && (
                  <button
                    onClick={() => {
                      setSelectedBrand("")
                      applyFilters()
                    }}
                    className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                  >
                    <X size={12} className="mr-1" />
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                Colors
              </h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(selectedColor === color ? "" : color)
                      applyFilters()
                    }}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      selectedColor === color
                        ? "bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300"
                        : "bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Sizes</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(selectedSize === size ? "" : size)
                      applyFilters()
                    }}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      selectedSize === size
                        ? "bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300"
                        : "bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In Stock Only */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={() => {
                  setInStockOnly(!inStockOnly)
                  applyFilters()
                }}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
            </label>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={applyFilters}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Filter size={16} />
            Apply Filters
          </button>
        </div>

        {/* Products Grid */}
        <div className="w-full md:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
              <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No products found</p>
              <p className="text-gray-500 dark:text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCategory || "All Products"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{products.length} products</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onQuickView={openProductPreview} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal product={previewProduct} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  )
}

