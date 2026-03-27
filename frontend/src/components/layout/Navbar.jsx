// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Button from '../common/Button';

const Navbar = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  // Helper to determine where to send logged-in users
  const getDashboardRoute = () => {
    const role = user?.activeMembership?.role;
    if (role === 'admin' || role === 'super_admin') return '/admin/dashboard';
    if (role === 'recruiter') return '/recruiter/dashboard';
    return '/student/dashboard'; // Default
  };

  const handleCTAAction = () => {
    if (user) {
      navigate(getDashboardRoute());
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 leading-tight tracking-tight">Global Connect</span>
            <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Your Campus</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 font-medium">
          <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
          
          {/* If they are logged in, show real links. If not, clicking prompts login */}
          <button onClick={() => navigate(user ? getDashboardRoute() : '/login')} className="hover:text-orange-500 transition-colors">
            Dashboard
          </button>
          <button onClick={() => navigate(user ? (user.activeMembership?.role === 'recruiter' ? '/recruiter/post-jobs' : '/student/jobs') : '/login')} className="hover:text-orange-500 transition-colors">
            Jobs
          </button>
          <button onClick={() => navigate(user ? '/student/alumni' : '/login')} className="hover:text-orange-500 transition-colors">
            Community
          </button>
        </div>

        {/* Dynamic CTA Button */}
        <div className="flex items-center gap-4">
          {!user && (
            <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors">
              Sign In
            </Link>
          )}
          <Button variant="coral" onClick={handleCTAAction}>
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;