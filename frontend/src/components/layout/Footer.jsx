// src/components/layout/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-8 px-6 lg:px-10 shrink-0 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Logo and Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            {/* Standardized Orange Logo */}
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Global Connect</span>
          </div>
          
          {/* Divider dot/line for larger screens */}
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-200"></div>
          
          <p className="text-sm font-medium text-slate-500">
            © 2026 Global Connect. All rights reserved.
          </p>
        </div>

        {/* Right: Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-orange-500 transition-colors">Features</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Community Guidelines</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;