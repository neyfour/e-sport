import { RefreshCw, ShieldCheck, Package, Clock } from "lucide-react"

export default function Returns() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Returns & Refunds</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Our hassle-free return policy and refund process</p>
        </div>

        {/* Return Policy Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Return Policy Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">30-Day Returns</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Return any item within 30 days of delivery for a full refund
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Money-Back Guarantee</h3>
              <p className="text-gray-600 dark:text-gray-300">100% refund on eligible items, no questions asked</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Free Returns</h3>
              <p className="text-gray-600 dark:text-gray-300">Free return shipping on all eligible items</p>
            </div>
          </div>
        </div>

        {/* Return Process */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Return Process</h2>
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">1</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Initiate Your Return</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Log into your account and select the item you wish to return. Follow the prompts to generate a return
                  label.
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">2</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Package Your Return</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Pack the item securely in its original packaging if possible. Attach the return label to the outside
                  of the package.
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">3</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ship Your Return</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Drop off your package at any authorized shipping location. Keep your tracking number for reference.
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">4</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receive Your Refund</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Once we receive and process your return, we'll issue your refund within 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Return Conditions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Return Conditions</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p>To be eligible for a return, your item must be:</p>
            <ul>
              <li>Unused and in the same condition that you received it</li>
              <li>In the original packaging</li>
              <li>Returned within 30 days of delivery</li>
              <li>Accompanied by the receipt or proof of purchase</li>
            </ul>

            <h3>Non-Returnable Items</h3>
            <p>The following items cannot be returned:</p>
            <ul>
              <li>Personal care items</li>
              <li>Customized or personalized products</li>
              <li>Downloadable software products</li>
              <li>Gift cards</li>
            </ul>

            <h3>Damaged or Defective Items</h3>
            <p>
              If you receive a damaged or defective item, please contact our customer support team immediately. We'll
              provide a prepaid return label and process your replacement or refund as soon as possible.
            </p>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need Help with Your Return?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our customer support team is available 24/7 to assist you with your return.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/contact"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/faq"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View FAQs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

