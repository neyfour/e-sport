"use client"

import { ArrowRight, Star, Users, TrendingUp, Package } from "lucide-react"
import { Link } from "react-router-dom"
import LazyImage from "../components/LazyImage"
import { useState, useEffect } from "react"
import { getProductCategories, getProducts } from "../api/productApi"
import { useStore } from "../store"

interface Category {
  id: string
  title: string
  description: string
  image: string
  products: number
  rating: number
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const token = useStore((state) => state.token)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCategoriesWithProductCount = async () => {
      try {
        setLoading(true)
        const apiCategories = await getProductCategories(token)

        if (apiCategories && apiCategories.length > 0) {
          const updatedCategories = await Promise.all(
            apiCategories.map(async (apiCat) => {
              const products = await getProducts({ category: apiCat }, true)
              let imageUrl = ""
              switch (apiCat.toLowerCase()) {
                case "football":
                  imageUrl = "/categories/football.jpg"
                  break
                case "cycling":
                  imageUrl = "/categories/cycling.jpg"
                  break
                case "swimming":
                  imageUrl = "/categories/swimming.jpg"
                  break
                case "fitness":
                  imageUrl = "/categories/fitness.jpg"
                  break
                case "tennis":
                  imageUrl = "/categories/tennis.jpg"
                  break
                default:
                  imageUrl = "/placeholder.svg"
              }
              return {
                id: apiCat.toLowerCase(),
                title: apiCat,
                description: "Explore our wide range of professional sports equipment and gear",
                image: imageUrl,
                products: products.length,
                rating: 4.5, // Default rating
              }
            }),
          )
          setCategories(updatedCategories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoriesWithProductCount()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Sports Categories</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore our wide range of professional sports equipment and gear
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center">Loading categories...</div>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.title}`}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden block"
              >
                <div className="relative h-64">
                  <LazyImage
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
                        Explore Category
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{category.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="ml-1 text-gray-900 dark:text-white font-medium">{category.rating}</span>
                      </div>
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="ml-1 text-gray-900 dark:text-white font-medium">
                          {category.products} Products
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Featured Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Trending Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <TrendingUp className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">Fitness & Training</h3>
              <p className="text-indigo-100 mb-4">Most popular category with highest growth rate</p>
              <Link
                to="/shop?category=Fitness"
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors inline-block"
              >
                Explore Now
              </Link>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 text-white">
              <Star className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">Running</h3>
              <p className="text-green-100 mb-4">Highest rated products and customer satisfaction</p>
              <Link
                to="/shop?category=Running"
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors inline-block"
              >
                View Collection
              </Link>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
              <Users className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">Team Sports</h3>
              <p className="text-orange-100 mb-4">Best deals for teams and group purchases</p>
              <Link
                to="/shop?category=Soccer"
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors inline-block"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

