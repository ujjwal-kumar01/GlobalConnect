import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const PublicRoute = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // If user is logged in, redirect them based on their role
  if (user) {
    // 1. Platform Admin
    if (user.isPlatformAdmin) return <Navigate to="/platform-admin" replace />;

    // 2. Email Verification Check
    if (!user.isEmailVerified) return <Navigate to="/verify" replace />;

    // 3. Onboarding Check
    if (!user.memberships || user.memberships.length === 0) {
      return <Navigate to="/onboarding" replace />;
    }

    // 4. Role-Based Dashboard Redirect
    const activeRole = user.activeMembership?.role;
    
    switch (activeRole) {
      case 'admin':
      case 'super_admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'recruiter':
        return <Navigate to="/recruiter/dashboard" replace />;
      case 'student':
      case 'alumni':
      default:
        return <Navigate to="/student/dashboard" replace />;
    }
  }

  // If not logged in, allow them to see the Login/Register page
  return <Outlet />;
};

export default PublicRoute;