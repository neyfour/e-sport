import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Product, Theme, Notification, ChatMessage, ChatRoom, CartItem, WishlistItem } from "../types"
import {
  loginUser,
  registerUser,
  checkAuthStatus,
  applyForSeller as apiApplyForSeller,
  googleLogin as apiGoogleLogin,
} from "../api/authApi"
import { createOrder } from "../api/orderApi"
import toast from "react-hot-toast"
import { processPayment } from "../api/paymentApi"

interface StoreState {
  user: User | null
  token: string | null
  products: Product[]
  theme: Theme
  notifications: Notification[]
  chatMessages: ChatMessage[]
  chatRooms: ChatRoom[]
  activeRoom: string | null
  cart: CartItem[]
  wishlist: WishlistItem[]
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (product: Product) => void
  deleteProduct: (productId: string) => void
  toggleTheme: () => void
  loginUser: (email: string, password: string) => Promise<User>
  registerUser: (userData: { email: string; password: string; full_name: string; role?: string }) => Promise<void>
  googleLogin: (token: string) => Promise<User>
  logoutUser: () => void
  checkAuth: () => Promise<boolean>
  applyForSeller: (applicationData: any) => Promise<any>
  addNotification: (notification: Notification) => void
  markNotificationAsRead: (notificationId: string) => void
  clearNotifications: () => void
  addChatMessage: (message: ChatMessage) => void
  setChatRooms: (rooms: ChatRoom[]) => void
  setActiveRoom: (roomId: string | null) => void
  addToCart: (product: Product, quantity?: number, variant?: any) => void
  updateCartItemQuantity: (itemId: string, quantity: number) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  addToWishlist: (product: Product) => void
  removeFromWishlist: (itemId: string) => void
  isInWishlist: (itemId: string) => boolean
  getCartTotal: () => number
  getUserCart: () => CartItem[]
  getUserWishlist: () => WishlistItem[]
  createOrderFromCart: (shippingAddress: any, paymentInfo: any) => Promise<any>
  login: (userData: User, token: string) => boolean
  isAuthenticated: boolean
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      products: [],
      theme: "light",
      notifications: [],
      chatMessages: [],
      chatRooms: [],
      activeRoom: null,
      cart: [],
      wishlist: [],
      isAuthenticated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setProducts: (products) => set({ products }),
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),
      updateProduct: (product) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
        })),
      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        })),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
      loginUser: async (email, password) => {
        try {
          const userData = await loginUser(email, password)
          set({ user: userData, token: localStorage.getItem("auth_token") || "sample-token" })
          return userData
        } catch (error) {
          console.error("Login failed:", error)
          throw error
        }
      },
      registerUser: async (userData) => {
        try {
          const user = await registerUser(userData.full_name, userData.email, userData.password)
          // After registration, log the user in
          const loggedInUser = await loginUser(userData.email, userData.password)
          set({ user: loggedInUser, token: localStorage.getItem("auth_token") || "sample-token" })
        } catch (error) {
          console.error("Registration failed:", error)
          throw error
        }
      },
      googleLogin: async (token) => {
        try {
          const userData = await apiGoogleLogin(token)
          set({ user: userData, token: localStorage.getItem("auth_token") || "sample-token" })
          return userData
        } catch (error) {
          console.error("Google login failed:", error)
          throw error
        }
      },
      logoutUser: () => {
        localStorage.removeItem("auth_token")
        set({ user: null, token: null })
      },
      checkAuth: async () => {
        try {
          const user = await checkAuthStatus()
          if (user) {
            set({ user, token: localStorage.getItem("auth_token") || "sample-token" })
            return true
          }
          return false
        } catch (error) {
          console.error("Auth check failed:", error)
          set({ user: null, token: null })
          return false
        }
      },
      applyForSeller: async (applicationData) => {
        try {
          const { token } = get()
          if (!token) {
            throw new Error("Authentication required")
          }

          console.log("Submitting application data:", applicationData)
          const result = await apiApplyForSeller(applicationData, token)

          // Update user state with seller application info
          const { user } = get()
          if (user) {
            set({
              user: {
                ...user,
                seller_application: {
                  status: "pending",
                  ...applicationData,
                  submitted_at: new Date().toISOString(),
                },
              },
            })
          }

          return result
        } catch (error) {
          console.error("Error in store applyForSeller:", error)
          throw error
        }
      },
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      markNotificationAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        })),
      clearNotifications: () => set({ notifications: [] }),
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),
      setChatRooms: (rooms) => set({ chatRooms: rooms }),
      setActiveRoom: (roomId) => set({ activeRoom: roomId }),

      // Enhanced cart functions with user-specific functionality
      addToCart: (product, quantity = 1, variant = null) => {
        if (!product || !product.id) {
          console.error("Invalid product data:", product)
          return
        }

        const { user } = get()
        if (!user) {
          toast.error("Please log in to add items to your cart")
          return
        }

        set((state) => {
          // Ensure we have a valid user ID
          const userId = user.id || user._id

          if (!userId) {
            console.error("User ID is missing")
            return state
          }

          const existingItemIndex = state.cart.findIndex(
            (item) =>
              item.id === product.id &&
              (!variant || !item.variant || item.variant.id === variant.id) &&
              item.user_id === userId,
          )

          if (existingItemIndex >= 0) {
            // Update existing item
            const updatedCart = [...state.cart]
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: updatedCart[existingItemIndex].quantity + quantity,
            }
            return { cart: updatedCart }
          } else {
            // Add new item
            const newItem: CartItem = {
              id: product.id,
              title: product.title || "Product",
              price: product.price || 0,
              image_url: product.image_url || "/placeholder.svg?height=300&width=400",
              quantity: quantity,
              stock: product.stock || 10,
              user_id: userId,
              variant: variant
                ? {
                    id: variant.id,
                    title: variant.title,
                    color: variant.color,
                    size: variant.size,
                  }
                : undefined,
            }
            return { cart: [...state.cart, newItem] }
          }
        })
      },

      updateCartItemQuantity: (itemId, quantity) => {
        const { user } = get()
        if (!user) {
          toast.error("Please log in to update your cart")
          return
        }

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === itemId && item.user_id === userId ? { ...item, quantity } : item,
          ),
        }))
      },

      removeFromCart: (itemId) => {
        const { user } = get()
        if (!user) {
          toast.error("Please log in to remove items from your cart")
          return
        }

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return
        }

        set((state) => ({
          cart: state.cart.filter((item) => !(item.id === itemId && item.user_id === userId)),
        }))
      },

      clearCart: () => {
        const { user } = get()
        if (!user) {
          toast.error("Please log in to clear your cart")
          return
        }

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return
        }

        set((state) => ({
          cart: state.cart.filter((item) => item.user_id !== userId),
        }))
      },

      // Enhanced wishlist functions with user-specific functionality
      addToWishlist: (product) => {
        if (!product || !product.id) {
          console.error("Invalid product data:", product)
          return
        }

        const { user } = get()
        if (!user) {
          toast.error("Please log in to add items to your wishlist")
          return
        }

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return
        }

        set((state) => {
          // Check if already in wishlist for this user
          if (state.wishlist.some((item) => item.id === product.id && item.user_id === userId)) {
            return state
          }

          // Add to wishlist
          const newItem: WishlistItem = {
            id: product.id,
            title: product.title || "Product",
            price: product.price || 0,
            image_url: product.image_url || "/placeholder.svg?height=300&width=400",
            stock: product.stock || 10,
            user_id: userId,
          }

          return { wishlist: [...state.wishlist, newItem] }
        })
      },

      removeFromWishlist: (itemId) => {
        const { user } = get()
        if (!user) {
          toast.error("Please log in to remove items from your wishlist")
          return
        }

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return
        }

        set((state) => ({
          wishlist: state.wishlist.filter((item) => !(item.id === itemId && item.user_id === userId)),
        }))
      },

      isInWishlist: (itemId: string) => {
        try {
          const { wishlist, user } = get()
          if (!user || !itemId || !wishlist) return false

          // Ensure we have a valid user ID
          const userId = user.id || user._id

          if (!userId) {
            console.error("User ID is missing")
            return false
          }

          return wishlist.some((item) => item.id === itemId && item.user_id === userId)
        } catch (error) {
          console.error("Error checking wishlist:", error)
          return false
        }
      },

      getCartTotal: () => {
        const { cart, user } = get()
        if (!user) return 0

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return 0
        }

        return cart
          .filter((item) => item.user_id === userId)
          .reduce((total, item) => total + item.price * item.quantity, 0)
      },

      // Helper functions for user-specific data
      getUserCart: () => {
        const { cart, user } = get()
        if (!user) return []

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return []
        }

        // Debug log to check filtering
        const userCart = cart.filter((item) => item.user_id === userId)
        console.log(`Getting cart for user ${userId}:`, userCart)
        return userCart
      },

      getUserWishlist: () => {
        const { wishlist, user } = get()
        if (!user) return []

        // Ensure we have a valid user ID
        const userId = user.id || user._id

        if (!userId) {
          console.error("User ID is missing")
          return []
        }

        // Debug log to check filtering
        const userWishlist = wishlist.filter((item) => item.user_id === userId)
        console.log(`Getting wishlist for user ${userId}:`, userWishlist)
        return userWishlist
      },

      // Create order from cart
      createOrderFromCart: async (shippingAddress, paymentInfo) => {
        const { user, token, getUserCart, getCartTotal, clearCart } = get()

        if (!user || !token) {
          toast.error("You must be logged in to place an order")
          throw new Error("Authentication required")
        }

        const cartItems = getUserCart()
        if (cartItems.length === 0) {
          toast.error("Your cart is empty")
          throw new Error("Cart is empty")
        }

        try {
          // Prepare order data
          const orderData = {
            items: cartItems.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
              product_name: item.title,
              product_image: item.image_url,
              variant: item.variant
                ? {
                    color: item.variant.color,
                    size: item.variant.size,
                  }
                : null,
              seller_id: item.seller_id || "default_seller", // Ensure seller_id is included
            })),
            shipping_address: shippingAddress,
            billing_address: shippingAddress, // Using same address for billing
            payment_method: paymentInfo.payment_method || "credit_card",
            payment_details: paymentInfo,
          }

          // Create order in database
          const order = await createOrder(orderData, token)

          // Process payment if order was created successfully
          if (order && order._id) {
            const paymentData = {
              order_id: order._id,
              payment_method: paymentInfo.payment_method || "credit_card",
              payment_details: {
                card_number: paymentInfo.card_number,
                card_expiry: paymentInfo.card_expiry,
                card_cvc: paymentInfo.card_cvc,
                card_holder: paymentInfo.card_holder,
              },
              amount: getCartTotal(),
            }

            const paymentResult = await processPayment(paymentData, token)

            // Clear the cart after successful payment
            if (paymentResult && paymentResult.status === "completed") {
              clearCart()
            }

            return {
              ...order,
              payment: paymentResult,
            }
          }

          return order
        } catch (error) {
          console.error("Error creating order:", error)
          toast.error("Failed to create order. Please try again.")
          throw error
        }
      },
      login: (userData, token) => {
        // Validate token before saving
        if (!token || typeof token !== "string" || token.length < 10) {
          console.error("Invalid token received during login:", token)
          return false
        }

        console.log("Saving token to store:", token.substring(0, 10) + "...")

        // Save token to localStorage for persistence
        localStorage.setItem("token", token)

        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        })

        return true
      },
    }),
    {
      name: "matrix-store",
    },
  ),
)

