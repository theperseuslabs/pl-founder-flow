import React from "react";
import { Button } from "./Button";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Logo Section - 30% */}
          <div className="w-[30%]">
            <div className="flex items-center h-full">
              <img
                src="/footer-logo.png"
                alt="EMA Logo"
                className="w-full h-auto max-h-16 object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          </div>

          {/* First 3 Links - 35% */}
          <div className="w-[35%]">
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Second 3 Links - 35% */}
          <div className="w-[35%]">
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Easy Marketing Automation.
          </p>
        </div>
      </div>
    </footer>
  );
};
