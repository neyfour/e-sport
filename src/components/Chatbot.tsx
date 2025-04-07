"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react"
import { sendChatbotMessage, type ChatMessage, getIsApiAvailable } from "../api/chatbotApi"
import { getAuthToken } from "../utils/auth"

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hello! I'm Alex your Assistant. How can I help you with our sports equipment marketplace today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isApiAvailable, setIsApiAvailableState] = useState(getIsApiAvailable())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "" || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Send message to API and get response
      const authToken = getAuthToken()
      const userId = authToken ? "authenticated-user" : "guest-user"

      const botResponse = await sendChatbotMessage([...messages, userMessage], userId)

      setMessages((prev) => [...prev, botResponse])

      // Update local state based on global API availability
      setIsApiAvailableState(getIsApiAvailable())
    } catch (error) {
      console.error("Error getting chatbot response:", error)

      // Update local state based on global API availability
      setIsApiAvailableState(getIsApiAvailable())

      // If we get here, the fallback response has already been generated in the API
    } finally {
      setIsLoading(false)
    }
  }

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Quick reply suggestions
  const suggestions = [
    "What products do you offer?",
    "Tell me about shipping",
    "How do returns work?",
    "Payment methods",
    "Become a seller",
  ]

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 flex items-center justify-center"
        aria-label="Chat with us"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-xl shadow-xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          {/* Chat Header */}
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-medium">Alex Assistant</h3>
            </div>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200 transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-96 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="text-xs opacity-75">{message.sender === "bot" ? "Alex" : "You"}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <span className="text-xs opacity-75 block text-right mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 rounded-tl-none max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs opacity-75">Alex</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="p-2 bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-2 justify-center border-t border-gray-200 dark:border-gray-700">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full px-3 py-1 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 flex items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={isLoading || inputValue.trim() === ""}
              className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              title="Send message"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>

          {/* API Status Indicator */}
          {!isApiAvailable && (
            <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs p-2 text-center">
              Running in offline mode. The backend server may be unavailable.
            </div>
          )}
        </div>
      )}
    </>
  )
}

