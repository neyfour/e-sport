import { Truck, Clock, Globe, DollarSign } from "lucide-react"

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Truck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Shipping Policy</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Everything you need to know about our shipping methods and delivery times
          </p>
        </div>

        {/* Shipping Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shipping Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Standard Shipping</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Delivery in 3-5 business days</li>
                <li>• Free for orders over $100</li>
                <li>• $7.99 for orders under $100</li>
                <li>• Available in continental US</li>
              </ul>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Express Shipping</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Delivery in 1-2 business days</li>
                <li>• $14.99 flat rate</li>
                <li>• Order by 2 PM for same-day dispatch</li>
                <li>• Available in continental US</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Delivery Times */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Estimated Delivery Times</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Processing Time</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Orders are typically processed within 24 hours of being placed. Orders placed on weekends or holidays
                  will be processed the next business day.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">International Shipping</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  International delivery times vary by location. Estimated delivery times will be provided at checkout.
                  Please note that import duties and taxes may apply.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Free Shipping Eligibility</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Free standard shipping is available on orders over $100 within the continental United States. Some
                  oversized or heavy items may incur additional shipping charges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Additional Information</h2>
          <div className="prose dark:text-gray-300 max-w-none">
            <h3>Order Tracking</h3>
            <p>
              Once your order ships, you'll receive a confirmation email with tracking information. You can also track
              your order through your account dashboard or our Track Order page.
            </p>

            <h3>Shipping Restrictions</h3>
            <p>
              Some items may have shipping restrictions due to size, weight, or destination. These restrictions will be
              clearly noted on the product page.
            </p>

            <h3>Lost or Damaged Packages</h3>
            <p>
              If your package is lost or damaged during transit, please contact our customer support team within 48
              hours of the scheduled delivery date.
            </p>

            <h3>Address Changes</h3>
            <p>
              To change your shipping address after placing an order, please contact customer support within 1 hour of
              placing your order. We cannot guarantee address changes after this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

