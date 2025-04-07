"use client"

import { useState } from "react"
import {
  Users,
  DollarSign,
  Link as LinkIcon,
  Share2,
  BarChart3,
  Award,
  CheckCircle,
  Copy,
  ArrowRight,
} from "lucide-react"
import { useStore } from "../store"
import toast from "react-hot-toast"

export default function Affiliate() {
  const user = useStore((state) => state.user)
  const [isJoined, setIsJoined] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Sample affiliate data
  const affiliateData = {
    referralLink: "https://matrixcommerce.com/ref/user123",
    referralCode: "USER123",
    commission: "10%",
    earnings: {
      total: 0,
      pending: 0,
      available: 0,
    },
    referrals: [],
    tiers: [
      {
        name: "Bronze",
        requirements: "0-9 referrals",
        commission: "10%",
        benefits: ["Basic commission rate", "Monthly payment"],
      },
      {
        name: "Silver",
        requirements: "10-49 referrals",
        commission: "12%",
        benefits: ["Increased commission rate", "Bi-weekly payment", "Exclusive promotions"],
      },
      {
        name: "Gold",
        requirements: "50+ referrals",
        commission: "15%",
        benefits: ["Premium commission rate", "Weekly payment", "Exclusive promotions", "Priority support"],
      },
    ],
  }

  const handleJoinProgram = () => {
    if (!user) {
      toast.error("Please sign in to join the affiliate program")
      return
    }

    setIsJoined(true)
    toast.success("You have successfully joined the affiliate program!")
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast.success(message)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Affiliate Program</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Earn commissions by referring friends and customers to Matrix Commerce
          </p>
        </div>

        {!isJoined ? (
          <>
            {/* Program Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 md:p-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    Earn Money by Sharing What You Love
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Join our affiliate program and earn a {affiliateData.commission} commission on every purchase made
                    through your referral link. It's easy to get started and there's no limit to how much you can earn!
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Generous Commission</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Earn up to 15% commission on every sale you refer
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Easy Tracking</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monitor your referrals and earnings in real-time
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Regular Payments</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get paid monthly via PayPal, bank transfer, or store credit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Marketing Resources</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Access to banners, product images, and promotional content
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleJoinProgram}
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Join Affiliate Program
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>

                <div className="bg-indigo-600 p-8 md:p-12 text-white">
                  <h3 className="text-2xl font-bold mb-6">How It Works</h3>

                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">
                          1
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium">Join the Program</h4>
                        <p className="text-indigo-200">Sign up for our affiliate program for free</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">
                          2
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium">Share Your Link</h4>
                        <p className="text-indigo-200">
                          Promote Matrix Commerce products using your unique referral link
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">
                          3
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium">Earn Commissions</h4>
                        <p className="text-indigo-200">Earn money when people make purchases through your link</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">
                          4
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium">Get Paid</h4>
                        <p className="text-indigo-200">Receive your earnings through your preferred payment method</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Tiers */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Commission Tiers</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {affiliateData.tiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 ${
                      index === 2 ? "border-2 border-indigo-600 dark:border-indigo-400 relative" : ""
                    }`}
                  >
                    {index === 2 && (
                      <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          BEST VALUE
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mb-4">
                      <Award
                        className={`w-6 h-6 ${
                          index === 0 ? "text-yellow-700" : index === 1 ? "text-gray-400" : "text-yellow-500"
                        }`}
                      />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-2">{tier.name}</h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{tier.commission}</span>
                      <span className="text-gray-600 dark:text-gray-400"> commission</span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Requirements: {tier.requirements}</p>

                    <ul className="space-y-2 mb-6">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    How do I join the affiliate program?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Simply click the "Join Affiliate Program" button above. If you're already signed in, you'll be
                    enrolled immediately. If not, you'll need to create an account first.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">How do commissions work?</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You earn a commission on every purchase made through your referral link. The commission rate starts
                    at 10% and can increase up to 15% based on your performance tier.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    When and how do I get paid?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Payments are processed monthly for all earnings over $50. You can choose to receive your payments
                    via PayPal, bank transfer, or as store credit with a 5% bonus.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    How long do referral cookies last?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our referral cookies last for 30 days. This means if someone clicks your link and makes a purchase
                    within 30 days, you'll receive the commission.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Can I promote products on social media?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Yes! You can share your referral link on social media, your blog, YouTube, or any other platform. We
                    also provide marketing materials to help you promote our products effectively.
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Success Stories</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
                      alt="Sarah J."
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Sarah J.</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fitness Blogger</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    "I've been part of many affiliate programs, but Matrix Commerce offers the best commission rates and
                    support. I've earned over $2,000 in just three months!"
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                      alt="Michael T."
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Michael T.</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sports Coach</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    "As a coach, I often recommend equipment to my clients. The affiliate program allows me to earn
                    while helping them get quality gear. It's a win-win!"
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                      alt="Emma R."
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Emma R.</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">YouTuber</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    "The tracking dashboard is amazing! I can see exactly which products are performing best in my
                    videos and optimize my content accordingly."
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Affiliate Dashboard */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex">
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "overview"
                        ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "referrals"
                        ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    onClick={() => setActiveTab("referrals")}
                  >
                    Referrals
                  </button>
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "earnings"
                        ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    onClick={() => setActiveTab("earnings")}
                  >
                    Earnings
                  </button>
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "resources"
                        ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                    onClick={() => setActiveTab("resources")}
                  >
                    Marketing Resources
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</h3>
                          <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${affiliateData.earnings.total.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Earnings</h3>
                          <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${affiliateData.earnings.pending.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Available for Withdrawal
                          </h3>
                          <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${affiliateData.earnings.available.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Referral Links</h3>

                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center mb-2 md:mb-0">
                            <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              {affiliateData.referralLink}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(affiliateData.referralLink, "Referral link copied to clipboard!")
                            }
                            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </button>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center mb-2 md:mb-0">
                            <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              Referral Code: {affiliateData.referralCode}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(affiliateData.referralCode, "Referral code copied to clipboard!")
                            }
                            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Code
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-300 mb-4">
                        Quick Tips to Maximize Your Earnings
                      </h3>

                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-2" />
                          <span className="text-indigo-700 dark:text-indigo-300">
                            Share your referral link on social media platforms
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-2" />
                          <span className="text-indigo-700 dark:text-indigo-300">
                            Write product reviews on your blog or YouTube channel
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-2" />
                          <span className="text-indigo-700 dark:text-indigo-300">
                            Create comparison content between different sports products
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-2" />
                          <span className="text-indigo-700 dark:text-indigo-300">
                            Use our marketing materials in your promotions
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "referrals" && (
                  <div>
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No referrals yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Start sharing your referral link to earn commissions
                      </p>
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            copyToClipboard(affiliateData.referralLink, "Referral link copied to clipboard!")
                          }
                          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Your Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "earnings" && (
                  <div>
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No earnings yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your earnings will appear here once you start generating sales
                      </p>{" "}
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your earnings will appear here once you start generating sales
                      </p>
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            copyToClipboard(affiliateData.referralLink, "Referral link copied to clipboard!")
                          }
                          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Start Promoting
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "resources" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Marketing Resources</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Banners & Graphics</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Download high-quality banners and graphics to use in your promotions.
                        </p>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          Download Assets
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Product Descriptions</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Copy-and-paste product descriptions for your blog or social media.
                        </p>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          View Descriptions
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Email Templates</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Ready-to-use email templates for promoting our products.
                        </p>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          Get Templates
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Social Media Kit</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Images and captions optimized for different social platforms.
                        </p>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          Download Kit
                        </button>
                      </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
                      <h4 className="font-medium text-indigo-800 dark:text-indigo-300 mb-4">Need Custom Materials?</h4>
                      <p className="text-indigo-700 dark:text-indigo-300 mb-4">
                        If you need custom marketing materials or have specific requests, our affiliate support team is
                        here to help.
                      </p>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Contact Support
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

