import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { useSocket } from '../../context/SocketContext'; 

const Header = () => {
  const { user, logout } = useUser(); 
  const { notifications } = useSocket(); 
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close profile dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Role Logic
  const role = user?.activeMembership?.role;
  const isStudentOrAlumni = role === 'student' || role === 'alumni';

  const getBasePath = () => {
    if (role === 'admin' || role === 'super_admin') return '/admin';
    if (role === 'recruiter') return '/recruiter';
    return '/student'; 
  };

  const basePath = getBasePath();

  const formatRole = (role) => {
    if (!role) return "Community Member";
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const displayName = user?.fullName || user?.name || "Guest User";
  const hasUnreadNotifications = user?.unreadNotifications && user.unreadNotifications.length > 0;
  
  const unreadMessageCount = notifications?.length || 0;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post('/api/user/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error("Server-side logout failed:", error);
    } finally {
      if (logout) logout();
      localStorage.removeItem("selectedRole");
      localStorage.removeItem("onboardingDetails");
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 shrink-0 relative z-20">
      
      {/* Left: 'ACTIVE NETWORK' INDICATOR */}
      <div className="flex-1 max-w-2xl flex items-center gap-4">
        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center border border-orange-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Network</p>
          <p className="text-sm font-bold text-slate-900 leading-none">
            {user?.activeMembership?.college?.name || "Global Connect Campus"}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-4 sm:gap-6 ml-4 shrink-0">
        
        {/* 🔥 UPDATED: Messages Link - Only visible to Students and Alumni */}
        {isStudentOrAlumni && (
          <Link 
            to="/messages" 
            className="text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all relative p-2 rounded-xl"
            title="Messages"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            {unreadMessageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </Link>
        )}
        
        {/* Notifications Link */}
        <Link 
          to={`${basePath}/notifications`}
          className="text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all relative p-2 rounded-xl"
          title="Notifications"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          {hasUnreadNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
          )}
        </Link>
        
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 p-1.5 rounded-xl transition-all ${isProfileOpen ? 'bg-slate-50 ring-2 ring-orange-500/20' : 'hover:bg-slate-50'}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{formatRole(role)}</p>
            </div>
            
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fdba74&color=c2410c`} 
              alt={displayName} 
              className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white" 
            />
            
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-50 sm:hidden">
                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{formatRole(role)}</p>
              </div>
              
              <Link 
                to={`${basePath}/profile`}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                My Profile
              </Link>
              
              <Link 
                to={`${basePath}/settings`}
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Account Settings
              </Link>
              
              <div className="h-px bg-slate-100 my-1"></div>
              
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <svg className="animate-spin w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                )}
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;