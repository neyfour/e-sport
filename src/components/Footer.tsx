import { Link } from "react-router-dom"
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  CreditCard,
  Shield,
  Truck,
  HelpCircle,
} from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <img 
                           src="/logo.png"
                           alt="Matrix Commerce Logo" 
                           className="w-auto h-16 opacity-100 dark:opacity-90" 
                           />
                       <span className="text-2xl font-bold dark:text-gray-200 text-purple-800">
                       E-SPORTS
                       </span>
            </div>
            <p className="text-gray-400 mb-6">
              Your premier destination for high-quality sports equipment and gear. Empowering athletes and sports
              enthusiasts since 2023.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <span className="text-gray-300">e.sportscompany.contact@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-indigo-400" />
                <span className="text-gray-300">+212 5 37 77 77 77</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span className="text-gray-300">Avenue Mohamed V, Rabat, Maroc</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 border-b border-gray-700 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Categories
                </Link>
              </li>
             
              <li>
                <Link to="/become-seller" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Contact Us
                </Link>
              </li>
             
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-6 border-b border-gray-700 pb-2">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/affiliate" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6 border-b border-gray-700 pb-2">Stay Updated</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest products, offers, and sports tips.
            </p>
            <form className="mb-6">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="px-4 py-2 w-full rounded-l-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>
            <h4 className="text-md font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-indigo-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-indigo-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-indigo-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-indigo-600 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-gray-800 pt-8 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <CreditCard className="w-8 h-8 text-indigo-400 mb-2" />
              <h4 className="text-sm font-medium">Secure Payment</h4>
              <p className="text-xs text-gray-500">All major cards accepted</p> <br />
              <div className="flex space-x-6">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/11647/11647799.png"
                  alt="CashOnDelivery"
                  className="h-6"
                />
                <img
                  src="https://cdn.pixabay.com/photo/2021/12/06/13/48/visa-6850402_1280.png"
                  alt="Visa"
                  className="h-6"
                />
                <img src="https://cdn-icons-png.flaticon.com/512/11378/11378185.png" alt="Mastercard" className="h-6" />
               
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 text-indigo-400 mb-2" />
              <h4 className="text-sm font-medium">Buyer Protection</h4>
              <p className="text-xs text-gray-500">100% secure checkout</p>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-8 h-8 text-indigo-400 mb-2" />
              <h4 className="text-sm font-medium">Fast Shipping</h4>
              <p className="text-xs text-gray-500">Worldwide delivery</p>
            </div>
            <div className="flex flex-col items-center">
              <HelpCircle className="w-8 h-8 text-indigo-400 mb-2" />
              <h4 className="text-sm font-medium">24/7 Support</h4>
              <p className="text-xs text-gray-500">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-center items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} E-SPORTS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

