// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon, label, path, isActive }) => {
  return (
    <Link 
      to={path} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
        isActive 
          ? 'bg-orange-50 text-orange-500' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: '🎛️', label: 'Dashboard', path: '/student/dashboard' },
    { icon: '👥', label: 'Alumni', path: '/student/alumni' },
    { icon: '💬', label: 'Messages', path: '/student/messages' },
    { icon: '💼', label: 'Jobs', path: '/student/jobs' },
    { icon: '📄', label: 'Applications', path: '/student/applications' },
    { icon: '📈', label: 'Activity', path: '/student/activity' },
    { icon: '🔔', label: 'Notifications', path: '/student/notifications' },
  ];

  const accountItems = [
    { icon: '👤', label: 'Profile', path: '/u/profile' },
    { icon: '⚙️', label: 'Settings', path: '/u/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0">
      
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-tight tracking-tight">Global Connect</span>
            <span className="text-[9px] font-bold text-orange-500 tracking-widest uppercase mt-0.5">Coral Theme</span>
          </div>
        </div>
      </div>

      {/* Navigation Links (Scrollable if screen is small) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
        
        {/* Main Nav */}
        <div className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.label} 
              {...item} 
              isActive={location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard')} 
            />
          ))}
        </div>

        {/* Account Nav */}
        <div className="space-y-1 pt-2">
          <p className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Account</p>
          {accountItems.map((item) => (
            <SidebarItem key={item.label} {...item} isActive={location.pathname === item.path} />
          ))}
        </div>
      </div>

      {/* Upgrade Card at Bottom */}
      {/* <div className="p-5 mx-4 mb-6 bg-orange-50 rounded-2xl border border-orange-100/50 shrink-0">
        <h4 className="text-xs font-bold text-slate-900">Upgrade to Pro</h4>
        <p className="text-[11px] text-slate-500 mt-1.5 mb-4 leading-relaxed">
          Get advanced networking tools and more connections.
        </p>
        <button className="w-full bg-orange-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
          View Plans
        </button>
      </div> */}
    </aside>
  );
};

export default Sidebar;