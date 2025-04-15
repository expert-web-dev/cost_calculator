import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-white text-3xl mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <h2 className="text-xl font-semibold">MoveEase</h2>
            </div>
            <p className="text-gray-400 text-sm">Making your moving decisions easier with transparent pricing and reliable service options.</p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="#calculator" className="text-gray-400 hover:text-white text-sm">Moving Cost Calculator</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Find Moving Companies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Packing Services</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Storage Solutions</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Moving Insurance</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Moving Guides</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Packing Tips</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Moving Checklist</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Mail className="text-gray-400 mr-2 h-4 w-4 mt-1" />
                <a href="mailto:info@moveease.com" className="text-gray-400 hover:text-white text-sm">info@moveease.com</a>
              </li>
              <li className="flex items-start">
                <Phone className="text-gray-400 mr-2 h-4 w-4 mt-1" />
                <a href="tel:+18005551234" className="text-gray-400 hover:text-white text-sm">(800) 555-1234</a>
              </li>
              <li className="flex items-start">
                <MapPin className="text-gray-400 mr-2 h-4 w-4 mt-1" />
                <span className="text-gray-400 text-sm">1234 Moving St, Suite 500<br />Los Angeles, CA 90001</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} MoveEase. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
