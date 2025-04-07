import { getAuthToken } from "../utils/auth"

export interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export interface ChatRequest {
  messages: Array<{
    role: string
    content: string
  }>
  userId?: string
}

export interface ChatResponse {
  response: string
  timestamp: string
}

// Check if we're in development or production
const isDev = import.meta.env.DEV || window.location.hostname === "localhost"

// Use the same base URL that's working for other API calls
const API_URL = isDev ? "http://localhost:8000" : import.meta.env.VITE_API_URL || ""

// The endpoint for the chatbot
const CHATBOT_ENDPOINT = `${API_URL}/chatbot/chat`

// Global state to track API availability
let isApiAvailable = true

// Function to get API availability state
export const getIsApiAvailable = () => isApiAvailable

// Function to set API availability state
export const setIsApiAvailable = (available: boolean) => {
  isApiAvailable = available
}

/**
 * Sends a message to the chatbot API and returns the response
 */
export const sendChatbotMessage = async (messages: ChatMessage[], userId = "guest"): Promise<ChatMessage> => {
  try {
    const token = getAuthToken()
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Format messages for the API
    const apiMessages = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }))

    console.log(`Sending chatbot request to: ${CHATBOT_ENDPOINT}`)

    // Create an AbortController to handle timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(CHATBOT_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages: apiMessages,
        user_id: userId,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`API error: ${response.status} - ${response.statusText}`)
      throw new Error(`API error: ${response.status}`)
    }

    const data: ChatResponse = await response.json()

    // Update API availability state
    setIsApiAvailable(true)

    return {
      id: `bot_${Date.now()}`,
      text: data.response,
      sender: "bot",
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error in chatbot API:", error)

    // Update API availability state
    setIsApiAvailable(false)

    // Use the fallback response
    return getFallbackResponse(messages[messages.length - 1]?.text || "")
  }
}

/**
 * Get a fallback response when the API is unavailable
 */
const getFallbackResponse = (userMessage: string): ChatMessage => {
  return {
    id: `bot_fallback_${Date.now()}`,
    text: getMockChatbotResponse(userMessage),
    sender: "bot",
    timestamp: new Date(),
  }
}

/**
 * Fallback function to get a mock response when the API is unavailable
 */
export const getMockChatbotResponse = (userMessage: string): string => {
  const lowerCaseMessage = userMessage.toLowerCase()

  // Simple keyword matching for fallback responses
  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
    return "Hello! How can I help you with our sports equipment today?"
  }

  if (lowerCaseMessage.includes("product") || lowerCaseMessage.includes("item")) {
    return "We offer a wide range of sports equipment including basketball, soccer, tennis, and fitness gear. You can browse our catalog in the Shop section."
  }

  if (lowerCaseMessage.includes("price") || lowerCaseMessage.includes("cost")) {
    return "Our prices vary depending on the product. You can find detailed pricing information on each product page. We also offer discounts for bulk orders!"
  }

  if (lowerCaseMessage.includes("shipping") || lowerCaseMessage.includes("delivery")) {
    return "We offer free shipping on orders over $100. Standard shipping typically takes 3-5 business days, while express shipping is available for 1-2 business days."
  }

  if (lowerCaseMessage.includes("return") || lowerCaseMessage.includes("refund")) {
    return "Our return policy allows returns within 30 days of purchase for unused items in original packaging. Please visit our Returns page for more details."
  }

  if (lowerCaseMessage.includes("account") || lowerCaseMessage.includes("login")) {
    return "You can create an account or log in by clicking the user icon in the top right corner of the page. Having an account allows you to track orders and save your favorite items."
  }

  if (lowerCaseMessage.includes("contact") || lowerCaseMessage.includes("support")) {
    return "You can reach our customer support team at e.sportscompany.contact@gmail.com . Our support hours are Monday to Friday, 9 AM to 6 PM EST."
  }

  if (lowerCaseMessage.includes("seller") || lowerCaseMessage.includes("sell")) {
    return "To become a seller on E-SPORTS Store, click on the 'Become a Seller' link and complete the application process. Our team will review your application within 2-3 business days."
  }

  if (lowerCaseMessage.includes("payment") || lowerCaseMessage.includes("pay")) {
    return "We accept all major credit cards. Your payment information is securely processed and never stored on our servers."
  }

  if (lowerCaseMessage.includes("discount") || lowerCaseMessage.includes("coupon")) {
    return "We regularly offer discounts and promotions. Check our Promotions page for current offers, or sign up for our newsletter to receive exclusive discount codes."
  }

  // Default response
  return "I'm currently running in offline mode with limited capabilities. I can still help with basic information about our products, shipping, returns, and account management. For more specific assistance, please try again later when our servers are available."
}

