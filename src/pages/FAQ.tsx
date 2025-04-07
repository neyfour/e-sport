import { ChevronDown, HelpCircle } from "lucide-react"

export default function FAQ() {
  const faqs = [
    {
      question: "How do I track my order?",
      answer:
        "You can track your order by visiting the Track Order page and entering your order number and email address. You'll receive real-time updates on your shipment's status.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Standard shipping typically takes 3-5 business days within the continental US. Express shipping (1-2 business days) is available for an additional fee. International shipping times vary by location.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy for most items. Products must be unused and in their original packaging. Please visit our Returns & Refunds page for detailed information.",
    },
    {
      question: "Do you offer international shipping?",
      answer:
        "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. Import duties and taxes may apply.",
    },
    {
      question: "How can I contact customer support?",
      answer:
        "Our customer support team is available 24/7. You can reach us through email at support@matrixcommerce.com, phone at 1-800-MATRIX, or use our live chat feature.",
    },
    {
      question: "Do you offer warranties on products?",
      answer:
        "Most products come with a manufacturer's warranty. The warranty period varies by product and brand. Extended warranty options are available for select items.",
    },
    {
      question: "Can I modify or cancel my order?",
      answer:
        "Orders can be modified or cancelled within 1 hour of placement. After this window, please contact customer support for assistance.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-6">{faq.question}</h3>
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 transform group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Still have questions?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our support team is always here to help you with any questions or concerns.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

