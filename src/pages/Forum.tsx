"use client"

import type React from "react"
import { useState } from "react"
import { MessageSquare, Users, Search, Filter, Clock, MessageCircle, Eye, Plus, Tag } from "lucide-react"
import { useStore } from "../store"
import toast from "react-hot-toast"

interface ForumTopic {
  id: string
  title: string
  author: {
    id: string
    name: string
    avatar: string
  }
  category: string
  tags: string[]
  created_at: string
  last_activity: string
  replies: number
  views: number
  likes: number
  is_pinned?: boolean
  is_solved?: boolean
}

export default function Forum() {
  const user = useStore((state) => state.user)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showNewTopicForm, setShowNewTopicForm] = useState(false)
  const [newTopic, setNewTopic] = useState({
    title: "",
    category: "",
    content: "",
    tags: "",
  })

  // Sample forum topics
  const topics: ForumTopic[] = [
    {
      id: "1",
      title: "What running shoes do you recommend for trail running?",
      author: {
        id: "101",
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      },
      category: "running",
      tags: ["shoes", "trail running", "gear"],
      created_at: "2024-06-15T10:30:00Z",
      last_activity: "2024-06-17T14:45:00Z",
      replies: 12,
      views: 156,
      likes: 8,
      is_solved: true,
    },
    {
      id: "2",
      title: "Best basketball for indoor courts?",
      author: {
        id: "102",
        name: "Michael Thompson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
      },
      category: "basketball",
      tags: ["basketball", "indoor", "equipment"],
      created_at: "2024-06-14T08:15:00Z",
      last_activity: "2024-06-16T19:20:00Z",
      replies: 8,
      views: 94,
      likes: 5,
    },
    {
      id: "3",
      title: "Community Guidelines and Forum Rules - PLEASE READ",
      author: {
        id: "100",
        name: "Admin",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=100",
      },
      category: "announcements",
      tags: ["rules", "guidelines", "important"],
      created_at: "2024-01-01T00:00:00Z",
      last_activity: "2024-01-01T00:00:00Z",
      replies: 0,
      views: 1250,
      likes: 45,
      is_pinned: true,
    },
    {
      id: "4",
      title: "How to improve soccer ball control techniques?",
      author: {
        id: "103",
        name: "Carlos Rodriguez",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
      },
      category: "soccer",
      tags: ["soccer", "training", "techniques"],
      created_at: "2024-06-13T15:45:00Z",
      last_activity: "2024-06-15T11:30:00Z",
      replies: 15,
      views: 203,
      likes: 12,
    },
    {
      id: "5",
      title: "Yoga mat recommendations for beginners?",
      author: {
        id: "104",
        name: "Emma Wilson",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
      },
      category: "yoga",
      tags: ["yoga", "beginners", "equipment"],
      created_at: "2024-06-12T09:20:00Z",
      last_activity: "2024-06-14T16:15:00Z",
      replies: 10,
      views: 178,
      likes: 9,
      is_solved: true,
    },
  ]

  // Categories for filter
  const categories = [
    { id: "all", name: "All Categories" },
    { id: "announcements", name: "Announcements" },
    { id: "running", name: "Running" },
    { id: "basketball", name: "Basketball" },
    { id: "soccer", name: "Soccer" },
    { id: "fitness", name: "Fitness" },
    { id: "yoga", name: "Yoga" },
    { id: "cycling", name: "Cycling" },
    { id: "swimming", name: "Swimming" },
  ]

  // Filter topics based on search query and selected category
  const filteredTopics = topics
    .filter(
      (topic) =>
        (selectedCategory === "all" || topic.category === selectedCategory) &&
        (searchQuery === "" ||
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))),
    )
    .sort((a, b) => {
      // Pinned topics always come first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1

      // Then sort by last activity (most recent first)
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    })

  const handleNewTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please sign in to create a new topic")
      return
    }

    if (!newTopic.title || !newTopic.category || !newTopic.content) {
      toast.error("Please fill in all required fields")
      return
    }

    // In a real app, you would submit the new topic to your backend
    toast.success("Your topic has been created successfully!")
    setShowNewTopicForm(false)
    setNewTopic({
      title: "",
      category: "",
      content: "",
      tags: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTopic((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Community Forum</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join discussions with fellow sports enthusiasts and get advice from experts
          </p>
        </div>

        {/* Forum Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mr-4">
              <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Topics</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,245</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mr-4">
              <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Replies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8,732</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mr-4">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Community Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3,890</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics or tags..."
                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowNewTopicForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Topic
              </button>
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-6">Topic</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1 text-center">Replies</div>
            <div className="col-span-1 text-center">Views</div>
            <div className="col-span-2 text-right">Last Activity</div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                  topic.is_pinned ? "bg-indigo-50 dark:bg-indigo-900/10" : ""
                }`}
              >
                <div className="md:grid md:grid-cols-12 md:gap-4">
                  <div className="col-span-6 mb-2 md:mb-0">
                    <div className="flex items-start">
                      <img
                        src={topic.author.avatar}
                        alt={topic.author.name}
                        className="w-10 h-10 rounded-full mr-3 object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                          {topic.is_pinned && (
                            <span
                              className="inline-block w-4 h-4 bg-indigo-600 rounded-full mr-2"
                              title="Pinned Topic"
                            ></span>
                          )}
                          {topic.title}
                          {topic.is_solved && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                              Solved
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>By {topic.author.name}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {topic.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-medium capitalize">
                      {topic.category}
                    </span>
                  </div>

                  <div className="col-span-1 flex md:justify-center items-center text-sm text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-4 h-4 mr-1 md:mr-0 md:hidden" />
                    <span>{topic.replies}</span>
                  </div>

                  <div className="col-span-1 flex md:justify-center items-center text-sm text-gray-500 dark:text-gray-400">
                    <Eye className="w-4 h-4 mr-1 md:mr-0 md:hidden" />
                    <span>{topic.views}</span>
                  </div>

                  <div className="col-span-2 flex md:justify-end items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1 md:mr-2" />
                    <span>{new Date(topic.last_activity).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No topics found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => setShowNewTopicForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start a New Discussion
            </button>
          </div>
        )}

        {/* Forum Guidelines */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mb-4">Community Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-indigo-700 dark:text-indigo-400 mb-2">Do's</h3>
              <ul className="space-y-2 text-indigo-700 dark:text-indigo-300">
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2 mt-1"></span>
                  Be respectful and courteous to other members
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2 mt-1"></span>
                  Stay on topic and provide valuable contributions
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2 mt-1"></span>
                  Use appropriate language and formatting
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2 mt-1"></span>
                  Report inappropriate content to moderators
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-indigo-700 dark:text-indigo-400 mb-2">Don'ts</h3>
              <ul className="space-y-2 text-indigo-700 dark:text-indigo-300">
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2 mt-1"></span>
                  Post spam, advertisements, or self-promotion
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2 mt-1"></span>
                  Share personal information of others
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2 mt-1"></span>
                  Use offensive language or harass other members
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2 mt-1"></span>
                  Create multiple accounts or impersonate others
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Topic</h2>
              <button
                onClick={() => setShowNewTopicForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleNewTopicSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic Title *</label>
                <input
                  type="text"
                  name="title"
                  value={newTopic.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter a descriptive title for your topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                <select
                  name="category"
                  value={newTopic.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter((cat) => cat.id !== "all" && cat.id !== "announcements")
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content *</label>
                <textarea
                  name="content"
                  value={newTopic.content}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your topic in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <div className="relative">
                  <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="tags"
                    value={newTopic.tags}
                    onChange={handleInputChange}
                    className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., running, shoes, beginner"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add relevant tags to help others find your topic
                </p>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewTopicForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

