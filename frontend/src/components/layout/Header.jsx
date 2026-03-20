// src/components/layout/Header.jsx
import React from 'react';
import { useUser } from '../../context/UserContext'; // Import your new hook

const Header = () => {
  // Grab the user data directly from the global Context
  const { user } = useUser(); 

  // Helper function to capitalize the role nicely (e.g., "student" -> "Student")
  const formatRole = (role) => {
    if (!role) return "Community Member";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Safely grab the user's name (handles if your backend uses 'fullName' or just 'name')
  const displayName = user?.fullName || user?.name || "Guest User";

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 shrink-0">
      
      {/* Left: Global Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search for alumni, jobs, or messages..." 
            className="w-full bg-slate-50/50 pl-11 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white border border-transparent focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-4 sm:gap-6 ml-4 shrink-0">
        
        {/* Messages Icon */}
        <button className="text-slate-400 hover:text-slate-700 transition-colors relative p-1">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </button>
        
        {/* Notifications Icon with active dot */}
        <button className="text-slate-400 hover:text-slate-700 transition-colors relative p-1">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
        </button>
        
        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile Dropdown Toggle */}
        <button className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-colors">
          <div className="text-right hidden sm:block">
            {/* Dynamic User Data Injected Here */}
            <p className="text-sm font-bold text-slate-900 leading-tight">{displayName}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{formatRole(user?.role)}</p>
          </div>
          {/* Dynamic Avatar */}
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fdba74&color=c2410c`} 
            alt={displayName} 
            className="w-10 h-10 rounded-full border border-slate-100 object-cover bg-orange-50" 
          />
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

      </div>
    </header>
  );
};

export default Header;