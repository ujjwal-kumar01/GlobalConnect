// src/components/layout/Navbar.jsx
import React from 'react';
import Button from '../common/Button';

const Navbar = () => {
  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
            {/* Placeholder for your actual globe icon */}
            G
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 leading-tight">Global Connect</span>
            <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Your Campus</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 font-medium">
          <a href="#" className="hover:text-orange-500 transition-colors">Home</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Dahboard</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Jobs</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Community</a>
        </div>

        {/* CTA Button */}
        <Button variant="coral">
          Get Started
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;