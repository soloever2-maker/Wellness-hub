'use client'

import { MapPin, Phone, Mail, Heart, Share2, MessageSquare } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#1A2E33] text-white py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
              Align with Enjy
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Your sanctuary for yoga, fitness, and wellness exclusively designed for women.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Classes
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Schedule
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Cairo, Egypt</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+20 (0) XXX XXX XXXX</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@wellnesshub.com</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-lg mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#006D77] hover:to-[#E86500] flex items-center justify-center transition-all"
              >
                <Heart className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#006D77] hover:to-[#E86500] flex items-center justify-center transition-all"
              >
                <Share2 className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-[#006D77] hover:to-[#E86500] flex items-center justify-center transition-all"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/70">
            <p>&copy; 2026 Align with Enjy. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
