"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, User, RefreshCw, Circle, Trash2, Smile, X } from "lucide-react"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"
import { getChatRooms, getChatMessages, sendChatMessage, markRoomAsRead } from "../api/chatApi"
import type { ChatRoom, ChatMessage } from "../types"
import toast from "react-hot-toast"

// Simple emoji picker data
const commonEmojis = [
  "😊",
  "👍",
  "❤️",
  "😂",
  "🙏",
  "😍",
  "👏",
  "🔥",
  "🎉",
  "😁",
  "💯",
  "⭐",
  "✅",
  "🤔",
  "👌",
  "😉",
  "🚀",
  "💪",
  "😎",
  "🙌",
]

export default function SellerChat() {
  const [loading, setLoading] = useState(true)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [activeAdmin, setActiveAdmin] = useState<any | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; messageId: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  })

  // Add a new state to track deleted message IDs
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatPollingRef = useRef<NodeJS.Timeout | null>(null)
  const roomsPollingRef = useRef<NodeJS.Timeout | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const user = useStore((state) => state.user)
  const token = useStore((state) => state.token)

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }))
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Check if token exists
        if (!token) {
          toast.error("Authentication required. Please log in.")
          setLoading(false)
          return
        }

        // Fetch chat rooms
        await fetchChatRooms()
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast.error("Failed to load chat data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling for rooms with a longer interval to reduce interference
    if (token) {
      roomsPollingRef.current = setInterval(fetchChatRooms, 30000) // Poll every 30 seconds instead of 15
    }

    return () => {
      if (roomsPollingRef.current) clearInterval(roomsPollingRef.current)
      if (chatPollingRef.current) clearInterval(chatPollingRef.current)
    }
  }, [token])

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    if (!token) return

    try {
      const rooms = await getChatRooms(token)

      // Filter for admin chats only
      const adminRooms = rooms.filter((room) => room.partner?.role === "superadmin")

      // Process rooms to replace "current_user" with actual user ID in mock data if needed
      const processedRooms = adminRooms.map((room) => {
        if (room.participants.includes("current_user")) {
          return {
            ...room,
            participants: room.participants.map((id) => (id === "current_user" ? user?.id || id : id)),
          }
        }
        return room
      })

      // Only update state if we got rooms back
      if (processedRooms && processedRooms.length > 0) {
        setChatRooms(processedRooms)

        // If no active room is set but we have rooms, set the first one as active
        if (!activeRoom) {
          setActiveRoom(processedRooms[0].id)
          setActiveAdmin({
            ...processedRooms[0].partner,
            // Set admin as online when user is logged in
            isOnline: true,
            lastActive: new Date(),
          })

          // Mark room as read - don't await this to prevent blocking
          markRoomAsRead(processedRooms[0].id, token).catch(() => {
            // Silently handle errors
          })
        }
      } else if (!activeRoom && rooms.length > 0) {
        // If no admin rooms but we have other rooms, create a default admin chat
        const adminId = "admin1" // This should be the actual admin ID from your system
        const roomId = `chat_${adminId}`

        const newRoom: ChatRoom = {
          id: roomId,
          name: "Admin Support",
          participants: [user?.id || "", adminId],
          created_at: new Date().toISOString(),
          partner: {
            id: adminId,
            username: "SuperAdmin",
            full_name: "System Administrator",
            role: "superadmin",
            avatar_url: "",
            isOnline: true,
            lastActive: new Date(),
          },
          last_message: "",
          last_timestamp: new Date().toISOString(),
          unread_count: 0,
        }

        setChatRooms([newRoom])
        setActiveRoom(newRoom.id)
        setActiveAdmin(newRoom.partner)
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      // Don't show error toast on polling
      if (!roomsPollingRef.current) {
        toast.error("Failed to load chat rooms")
      }
    }
  }

  // Fetch messages when active room changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeRoom || !token) return

      try {
        const roomMessages = await getChatMessages(activeRoom, token)
        if (roomMessages && roomMessages.length >= 0) {
          // Process messages to replace "current_user" with actual user ID
          const processedMessages = roomMessages
            .filter((message) => !deletedMessageIds.has(message.id)) // Filter out deleted messages
            .map((message) => {
              if (message.sender_id === "current_user") {
                return {
                  ...message,
                  sender_id: user?.id || message.sender_id,
                  sender_name: user?.username || message.sender_name || "You",
                }
              }
              // Ensure SuperAdmin is displayed for admin messages
              if (message.sender_id.includes("admin")) {
                return {
                  ...message,
                  sender_name: "SuperAdmin",
                }
              }
              return message
            })

          setMessages(processedMessages)

          // Mark room as read - don't await this to prevent blocking
          markRoomAsRead(activeRoom, token).catch(() => {
            // Silently handle errors
          })

          // Update unread count in rooms list
          setChatRooms((prev) => prev.map((room) => (room.id === activeRoom ? { ...room, unread_count: 0 } : room)))
        }
      } catch (error) {
        console.error(`Error fetching messages for room ${activeRoom}:`, error)
        // Don't show error toast on polling
        if (!chatPollingRef.current) {
          toast.error("Failed to load messages")
        }
      }
    }

    if (activeRoom) {
      fetchMessages()

      // Set up polling for messages in this room
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current)
      }

      chatPollingRef.current = setInterval(fetchMessages, 5000) // Poll every 5 seconds
    }

    return () => {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current)
        chatPollingRef.current = null
      }
    }
  }, [activeRoom, token, user?.id, user?.username, deletedMessageIds])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !activeRoom || !user || sendingMessage) return

    try {
      setSendingMessage(true)

      // Send message to the API
      let sentMessage = await sendChatMessage(activeRoom, newMessage, token)

      // If using mock data, replace "current_user" with actual user ID
      if (sentMessage.sender_id === "current_user") {
        sentMessage = {
          ...sentMessage,
          sender_id: user.id,
          sender_name: user.username || "You",
        }
      }

      // Add message to the UI
      setMessages((prev) => [...prev, sentMessage])
      setNewMessage("")

      // Refresh rooms to update last message
      fetchChatRooms()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await fetchChatRooms()

      if (activeRoom) {
        const roomMessages = await getChatMessages(activeRoom, token)
        if (roomMessages && roomMessages.length >= 0) {
          setMessages(roomMessages)
        }
      }

      toast.success("Chat refreshed")
    } catch (error) {
      console.error("Error refreshing chat:", error)
      toast.error("Failed to refresh chat")
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearChat = async () => {
    if (!activeRoom || clearing) return

    setClearing(true)
    try {
      setDeletedMessageIds((prev) => {
        const newSet = new Set(prev)
        messages.forEach((message) => newSet.add(message.id))
        return newSet
      })

      // Clear messages from UI
      setMessages([])
      toast.success("Chat cleared")
    } catch (error) {
      console.error("Error clearing chat:", error)
      toast.error("Failed to clear chat")
    } finally {
      setClearing(false)
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    setDeletedMessageIds((prev) => {
      const newSet = new Set(prev)
      newSet.add(messageId)
      return newSet
    })

    // Also remove from UI immediately
    setMessages((prev) => prev.filter((message) => message.id !== messageId))
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null })
    toast.success("Message deleted")
  }

  const handleMessageContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
    })
  }

  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatLastActive = (date: Date) => {
    if (!date) return "Offline"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins === 1) return "1 minute ago"
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours === 1) return "1 hour ago"
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`

    // For older dates, show the actual date
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
    })
  }

  // Add this helper function after the formatLastActive function and before the loading check
  const formatMessageDate = (timestamp: string) => {
    const messageDate = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date()

    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time part for date comparison
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return "Today"
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Yesterday"
    } else {
      return messageDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <SellerSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!token || !user) {
    return (
      <div className="flex">
        <SellerSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Authentication Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to access the chat.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <SellerSidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Support Chat</h1>
              {activeAdmin && (
                <div className="ml-4 flex items-center">
                  <span className="mx-2 text-gray-400">|</span>
                  <div className="flex items-center">
                    {activeAdmin.avatar_url ? (
                      <img
                        src={activeAdmin.avatar_url || "/placeholder.svg?height=24&width=24"}
                        alt={activeAdmin.username}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-2">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                          {activeAdmin.username?.charAt(0).toUpperCase() || "A"}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {activeAdmin.username || activeAdmin.full_name || "Admin"}
                        </span>

                        {/* Online status indicator */}
                      
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                disabled={clearing || !activeRoom}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${clearing ? "animate-pulse" : ""}`} />
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Refresh chat"
                title="Refresh chat"
              >
                <RefreshCw className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeRoom ? (
              <>
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Send a message to start the conversation with the admin
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        // Enhanced sender identification logic
                        const isCurrentUser =
                          message.sender_id === user?.id ||
                          message.sender_name?.toLowerCase() === user?.username?.toLowerCase() ||
                          message.sender_id === "current_user" ||
                          (!message.sender_id.includes("admin") &&
                            !message.sender_name?.toLowerCase().includes("admin"))

                        const isAdmin =
                          message.sender_id.includes("admin") ||
                          message.sender_name?.toLowerCase().includes("admin") ||
                          message.sender_name?.toLowerCase() === "superadmin"

                        // Final determination - if it's not an admin message, it's from the current user
                        const isSentByMe = isCurrentUser && !isAdmin

                        // Check if we should show sender info (avatar and name)
                        const showSenderInfo =
                          index === 0 ||
                          messages[index - 1].sender_id !== message.sender_id ||
                          messages[index - 1].sender_name !== message.sender_name

                        // Check if we should show date header
                        const showDateHeader =
                          index === 0 ||
                          new Date(message.timestamp).toDateString() !==
                            new Date(messages[index - 1].timestamp).toDateString()

                        return (
                          <React.Fragment key={message.id}>
                            {/* Date Header */}
                            {showDateHeader && (
                              <div className="flex justify-center my-4">
                                <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
                                  {formatMessageDate(message.timestamp)}
                                </div>
                              </div>
                            )}

                            <div
                              className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                              onContextMenu={(e) => handleMessageContextMenu(e, message.id)}
                            >
                              {/* Left side - Received messages (from admin) */}
                              {!isSentByMe && (
                                <div className="flex max-w-[70%]">
                                  {/* Avatar for admin */}
                                  {showSenderInfo && (
                                    <div className="flex-shrink-0 mr-2 self-end">
                                      {message.sender_avatar ? (
                                        <img
                                          src={message.sender_avatar || "/placeholder.svg?height=28&width=28"}
                                          alt={message.sender_name}
                                          className="w-8 h-8 rounded-full"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className={!showSenderInfo ? "ml-10" : ""}>
                                    {/* Sender name */}
                                    {showSenderInfo && (
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1 mb-1">
                                        {message.sender_name || "Admin"}
                                      </div>
                                    )}

                                    {/* Message bubble - LEFT ALIGNED, LIGHT BACKGROUND */}
                                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-t-lg rounded-r-lg rounded-bl-none shadow-sm relative group">
                                      <p className="whitespace-pre-wrap">{message.content}</p>

                                      {/* Delete button on hover */}
                                      <button
                                        className="absolute right-0 top-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteMessage(message.id)}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                      {formatTime(message.timestamp)}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Right side - Sent messages (from current user) */}
                              {isSentByMe && (
                                <div className="max-w-[70%]">
                                  {/* Message bubble - RIGHT ALIGNED, INDIGO BACKGROUND */}
                                  <div className="bg-indigo-600 text-white px-3 py-2 rounded-t-lg rounded-l-lg rounded-br-none relative group">
                                    <p className="whitespace-pre-wrap">{message.content}</p>

                                    {/* Delete button on hover */}
                                    <button
                                      className="absolute left-0 top-0 -mt-2 -ml-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleDeleteMessage(message.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Timestamp */}
                                  <div className="text-xs mt-1 text-right text-gray-500 dark:text-gray-400">
                                    {formatTime(message.timestamp)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </React.Fragment>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Context Menu */}
                {contextMenu.visible && (
                  <div
                    className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 z-50 border border-gray-200 dark:border-gray-700"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => contextMenu.messageId && handleDeleteMessage(contextMenu.messageId)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Message
                    </button>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form onSubmit={handleSendMessage} className="flex relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to admin..."
                      className="flex-1 px-4 py-3 rounded-l-full border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={sendingMessage}
                    />

                    {/* Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className={`px-5 py-3 bg-indigo-600 text-white rounded-r-full transition-colors ${
                        sendingMessage || !newMessage.trim()
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "hover:bg-indigo-700"
                      }`}
                    >
                      <Send className={`w-5 h-5 ${sendingMessage ? "animate-pulse" : ""}`} />
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10"
                      >
                        <div className="grid grid-cols-5 gap-2">
                          {commonEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleEmojiClick(emoji)}
                              className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Admin Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No active chat found. Please refresh to connect with an admin.
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

