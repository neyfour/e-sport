"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, User, Clock } from "lucide-react"
import { useStore } from "../store"
import SellerSidebar from "../components/SellerSidebar"
import { getMockChatRooms, getMockChatMessages } from "../api/chatApi"
import type { ChatRoom, ChatMessage } from "../types"

export default function SellerForum() {
  const [loading, setLoading] = useState(true)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const user = useStore((state) => state.user)

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        // In a real app, you would fetch this from your API
        const rooms = getMockChatRooms()
        setChatRooms(rooms)

        if (rooms.length > 0) {
          setActiveRoom(rooms[0].id)
          setMessages(getMockChatMessages(rooms[0].id))
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching chat rooms:", error)
        setLoading(false)
      }
    }

    fetchChatRooms()
  }, [])

  useEffect(() => {
    if (activeRoom) {
      setMessages(getMockChatMessages(activeRoom))
    }
  }, [activeRoom])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !activeRoom || !user) return

    const newChatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender_id: user.id,
      sender_name: user.username || user.full_name || "User",
      sender_avatar: user.avatar_url,
      content: newMessage,
      timestamp: new Date().toISOString(),
      room_id: activeRoom,
    }

    setMessages([...messages, newChatMessage])
    setNewMessage("")
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

  return (
    <div className="flex h-screen">
      <SellerSidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Seller Forum</h1>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Rooms Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 overflow-y-auto hidden md:block">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chat Rooms</h2>
              <ul className="space-y-2">
                {chatRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      onClick={() => setActiveRoom(room.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeRoom === room.id
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="font-medium">{room.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {room.participants.length} participants
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeRoom ? (
              <>
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          }`}
                        >
                          {message.sender_id !== user?.id && (
                            <div className="flex items-center mb-1">
                              {message.sender_avatar ? (
                                <img
                                  src={message.sender_avatar || "/placeholder.svg"}
                                  alt={message.sender_name}
                                  className="w-5 h-5 rounded-full mr-2"
                                />
                              ) : (
                                <User className="w-5 h-5 mr-2" />
                              )}
                              <span className="text-xs font-medium">{message.sender_name}</span>
                            </div>
                          )}
                          <p>{message.content}</p>
                          <div
                            className={`text-xs mt-1 flex items-center ${
                              message.sender_id === user?.id ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No chat room selected</h3>
                  <p className="text-gray-600 dark:text-gray-400">Select a chat room to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

