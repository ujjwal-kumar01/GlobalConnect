// src/components/layout/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-12 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        
        {/* Logo and Copyright */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-indigo-700 flex-shrink-0"></div>
          <span className="text-xl font-semibold text-indigo-900">Global Connect</span>
          <p className="text-xs text-gray-500 ml-3">© 2024 Global Connect. Designed for Fluid Architecture.</p>
        </div>

        {/* Footer Links */}
        <div className="md:justify-self-end flex items-center gap-8 text-xs text-gray-600 font-medium">
          <a href="#" className="hover:text-sky-600">Features</a>
          <a href="#" className="hover:text-sky-600">Solutions</a>
          <a href="#" className="hover:text-sky-600">Privacy Policy</a>
          <a href="#" className="hover:text-sky-600">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;