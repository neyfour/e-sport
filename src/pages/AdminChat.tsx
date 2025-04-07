"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, User, Search, RefreshCw, Circle, Trash2, Smile } from "lucide-react"
import { useStore } from "../store"
import SuperAdminSidebar from "../components/SuperAdminSidebar"
import { getChatRooms, getChatMessages, sendChatMessage, markRoomAsRead} from "../api/chatApi"
import { getSellers } from "../api/authApi"
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

export default function AdminChat() {
  const [loading, setLoading] = useState(true)
  const [sellers, setSellers] = useState<any[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [activeSeller, setActiveSeller] = useState<any | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
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

        // Fetch sellers
        const sellersData = await getSellers(token)

        // Add online status and last active time based on login status
        const sellersWithStatus =
          sellersData?.map((seller) => {
            const hasRecentLogin =
              seller.last_login && new Date().getTime() - new Date(seller.last_login).getTime() < 15 * 60 * 1000 // 15 minutes

            return {
              ...seller,
              isOnline: seller.is_online || hasRecentLogin || false,
              lastActive: seller.last_active ? new Date(seller.last_active) : new Date(),
            }
          }) || []

        setSellers(sellersWithStatus || [])

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
  }, [token])

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    if (!token) return

    try {
      const rooms = await getChatRooms(token)

      // Only update state if we got rooms back
      if (rooms && rooms.length > 0) {
        const processedRooms = rooms.map((room) => {
          if (room.participants.includes("current_user")) {
            return {
              ...room,
              participants: room.participants.map((id) => (id === "current_user" ? user?.id || id : id)),
            }
          }
          return room
        })

        // Preserve the active room when updating rooms
        setChatRooms((prevRooms) => {
          if (activeRoom) {
            const activeRoomExists = processedRooms.some((room) => room.id === activeRoom)

            if (!activeRoomExists) {
              const currentActiveRoom = prevRooms.find((room) => room.id === activeRoom)
              if (currentActiveRoom) {
                return [...processedRooms, currentActiveRoom]
              }
            }
          }

          return processedRooms
        })

        // Only set the first room as active if no room is currently active
        if (!activeRoom && rooms.length > 0) {
          setActiveRoom(processedRooms[0].id)
          setActiveSeller(processedRooms[0].partner)

          // Mark room as read
          await markRoomAsRead(processedRooms[0].id, token)
        }
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      if (!roomsPollingRef.current) {
        toast.error("Failed to load chat rooms")
      }
    }
  }

  // Fetch messages for the active room
  const fetchMessages = async () => {
    if (!activeRoom || !token) return

    try {
      const roomMessages = await getChatMessages(activeRoom, token)

      if (roomMessages && roomMessages.length >= 0) {
        const processedMessages = roomMessages.map((message) => {
          // Check if this message is from the current user (SuperAdmin)
          // This is the critical part that needs fixing
          const isFromCurrentUser =
            message.sender_id === user?.id ||
            message.sender_id === "current_user" ||
            message.sender_name === "SuperAdmin" ||
            (user?.role === "superadmin" && message.sender_role === "superadmin")

          return {
            ...message,
            sender_id: isFromCurrentUser ? user?.id : message.sender_id,
            sender_name: isFromCurrentUser
              ? user?.role === "superadmin"
                ? "SuperAdmin"
                : user?.username || "You"
              : message.sender_name,
          }
        })

        setMessages(processedMessages)
      }
    } catch (error) {
      console.error(`Error fetching messages for room ${activeRoom}:`, error)
    }
  }

  // Fetch messages when active room changes
  useEffect(() => {
    const fetchMessagesWrapper = async () => {
      await fetchMessages()
    }

    if (activeRoom) {
      fetchMessagesWrapper()

      // Set up polling for messages in this room
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current)
      }

      chatPollingRef.current = setInterval(fetchMessagesWrapper, 5000) // Poll every 5 seconds
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

  // Handle sending a message
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

  // Handle seller click
  const handleSellerClick = (seller: any) => {
    const room = chatRooms.find((r) => r.partner?.id === seller._id)

    // Reset deleted messages when changing rooms
    setDeletedMessageIds(new Set())

    if (room) {
      setActiveRoom(room.id)
      setActiveSeller({
        ...room.partner,
        isOnline: sellers.find((s) => s._id === seller._id)?.isOnline || false,
        lastActive: sellers.find((s) => s._id === seller._id)?.lastActive || new Date(),
      })

      // Clear any existing polling for messages
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current)
        chatPollingRef.current = null
      }

      // Mark room as read when switching to it
      markRoomAsRead(room.id, token).catch((error) => {
        console.error("Error marking room as read:", error)
      })

      // Fetch messages for this room immediately
      getChatMessages(room.id, token)
        .then((roomMessages) => {
          if (roomMessages && roomMessages.length >= 0) {
            const processedMessages = roomMessages.map((message) => {
              // More robust check for current user messages
              const isFromCurrentUser =
                message.sender_id === user?.id ||
                message.sender_id === "current_user" ||
                message.sender_name === "SuperAdmin" ||
                (user?.role === "superadmin" && message.sender_role === "superadmin")

              return {
                ...message,
                sender_id: isFromCurrentUser ? user?.id : message.sender_id,
                sender_name: isFromCurrentUser
                  ? user?.role === "superadmin"
                    ? "SuperAdmin"
                    : user?.username || "You"
                  : message.sender_name,
              }
            })

            setMessages(processedMessages)
          }
        })
        .catch((error) => {
          console.error(`Error fetching messages for room ${room.id}:`, error)
        })
    } else {
      // Create a new room ID using the format chat_sellerId
      const roomId = `chat_${seller._id}`

      // Create a new room object
      const newRoom: ChatRoom = {
        id: roomId,
        name: `Chat with ${seller.username || seller.full_name || "Seller"}`,
        participants: [user?.id || "", seller._id],
        created_at: new Date().toISOString(),
        partner: {
          id: seller._id,
          username: seller.username,
          full_name: seller.full_name,
          role: seller.role,
          avatar_url: seller.avatar_url,
          isOnline: seller.isOnline || false,
          lastActive: seller.lastActive || new Date(),
        },
        last_message: "",
        last_timestamp: new Date().toISOString(),
        unread_count: 0,
      }

      // Add the new room to the list and set it as active
      setChatRooms((prevRooms) => [...prevRooms, newRoom])
      setActiveRoom(newRoom.id)
      setActiveSeller(newRoom.partner)
      setMessages([]) // Clear messages when creating a new room

      // Clear any existing polling for messages
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current)
        chatPollingRef.current = null
      }
    }
  }

  // Handle refresh
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

  // Handle clear chat
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

  // Handle delete message
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

  // Handle message context menu
  const handleMessageContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
    })
  }

  // Handle emoji click
  const handleEmojiClick = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Format time for timestamps
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format date for message headers
  const formatMessageDate = (timestamp: string) => {
    const messageDate = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time components to compare dates only
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

  // Format last active time
  const formatLastActive = (date: Date) => {
    if (!date) return "Offline"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Active now"
    if (diffMins < 5) return "Active a moment ago"
    if (diffMins < 60) return `Active ${diffMins}m ago`
    if (diffHours === 1) return "Active 1h ago"
    if (diffHours < 24) return `Active ${diffHours}h ago`
    if (diffDays === 1) return "Active yesterday"
    if (diffDays < 7) return `Active ${diffDays}d ago`

    return `Active on ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`
  }

  // Filter sellers based on search query
  const filteredSellers = searchQuery
    ? sellers.filter(
        (seller) =>
          seller.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          seller.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          seller.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sellers

  if (loading) {
    return (
      <div className="flex">
        <SuperAdminSidebar />
        <div className="flex-1 md:ml-64 p-6 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-600 rounded-full border-t-transparent"></div>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!token || !user) {
    return (
      <div className="flex">
        <SuperAdminSidebar />
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
      <SuperAdminSidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Seller Chat</h1>
              {activeSeller && (
                <div className="ml-4 flex items-center">
                  <span className="mx-2 text-gray-400">|</span>
                  <div className="flex items-center">
                    {activeSeller.avatar_url ? (
                      <img
                        src={activeSeller.avatar_url || "/placeholder.svg?height=24&width=24"}
                        alt={activeSeller.username}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                        <span className="text-purple-600 dark:text-purple-400 font-medium text-xs">
                          {activeSeller.username?.charAt(0).toUpperCase() || "S"}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {activeSeller.username || activeSeller.full_name || "Seller"}
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
          {/* Sellers Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 overflow-y-auto hidden md:block">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sellers</h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all dark:text-white text-sm"
                />
              </div>

              {sellers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No sellers found</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredSellers.map((seller) => (
                    <li key={seller._id}>
                      <button
                        onClick={() => handleSellerClick(seller)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                          activeSeller?.id === seller._id
                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="relative">
                          {seller.avatar_url ? (
                            <img
                              src={seller.avatar_url || "/placeholder.svg?height=32&width=32"}
                              alt={seller.username}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                              <span className="text-purple-600 dark:text-purple-400 font-medium">
                                {seller.username?.charAt(0).toUpperCase() || "S"}
                              </span>
                            </div>
                          )}

                          {/* Online status indicator dot */}
                         
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{seller.username || seller.full_name || "Seller"}</div>
                          <div className="flex items-center justify-between">
                            

                            {/* Show unread count if any */}
                            {chatRooms.find((r) => r.partner?.id === seller._id)?.unread_count > 0 && (
                              <div className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {chatRooms.find((r) => r.partner?.id === seller._id)?.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}

                  {filteredSellers.length === 0 && (
                    <li className="text-center py-4 text-gray-500 dark:text-gray-400">No sellers found</li>
                  )}
                </ul>
              )}
            </div>
          </div>

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
                        <p className="text-gray-600 dark:text-gray-400">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        // More robust check for current user messages
                        const isCurrentUser =
                          message.sender_id === user?.id ||
                          message.sender_name === "SuperAdmin" ||
                          message.sender_name === user?.username ||
                          (user?.role === "superadmin" && message.sender_role === "superadmin")

                        const showSenderInfo = index === 0 || messages[index - 1].sender_id !== message.sender_id
                        const showTimestamp =
                          index === messages.length - 1 ||
                          new Date(messages[index + 1]?.timestamp).getTime() - new Date(message.timestamp).getTime() >
                            5 * 60 * 1000

                        // Determine if we should show a date header
                        const showDateHeader =
                          index === 0 ||
                          (index > 0 &&
                            new Date(message.timestamp).toDateString() !==
                              new Date(messages[index - 1].timestamp).toDateString())

                        return (
                          <React.Fragment key={message.id}>
                            {/* Date header */}
                            {showDateHeader && (
                              <div className="flex justify-center my-4">
                                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  {formatMessageDate(message.timestamp)}
                                </div>
                              </div>
                            )}

                            {/* Message */}
                            <div className="flex" onContextMenu={(e) => handleMessageContextMenu(e, message.id)}>
                              <div className={`flex max-w-[70%] ${isCurrentUser ? "ml-auto" : ""}`}>
                                {/* Avatar - only shown for received messages and first in group */}
                                {!isCurrentUser && showSenderInfo && (
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

                                <div className={`${!isCurrentUser && !showSenderInfo ? "ml-10" : ""}`}>
                                  {/* Sender name - only show for received messages and first in group */}
                                  {!isCurrentUser && showSenderInfo && (
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1 mb-1">
                                      {message.sender_name}
                                    </div>
                                  )}

                                  {/* Message bubble */}
                                  <div
                                    className={`relative px-3 py-2 rounded-2xl shadow-sm ${
                                      isCurrentUser
                                        ? "bg-indigo-500 text-white rounded-tr-none"
                                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap">{message.content}</p>

                                    {/* Tail for the message bubble */}
                                    <div
                                      className={`absolute bottom-0 w-3 h-3 transform rotate-45 ${
                                        isCurrentUser
                                          ? "-right-1.5 bg-indigo-500"
                                          : "-left-1.5 bg-white dark:bg-gray-700"
                                      }`}
                                    ></div>

                                    {/* Timestamp */}
                                    {showTimestamp && (
                                      <div
                                        className={`text-xs mt-1 ${
                                          isCurrentUser ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                                        }`}
                                      >
                                        {formatTime(message.timestamp)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
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
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form onSubmit={handleSendMessage} className="flex relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      className={`ml-2 p-3 rounded-full transition-colors ${
                        sendingMessage || !newMessage.trim()
                          ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
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
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Select a seller to chat</h3>
                  <p className="text-gray-600 dark:text-gray-400">Choose a seller from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

