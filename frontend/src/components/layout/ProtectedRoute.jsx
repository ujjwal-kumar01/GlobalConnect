// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useUser();

  // 1. Wait for context to finish loading from localStorage/API
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  // 2. If nobody is logged in, kick them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Grab their active role (defaulting to student if something is weird)
  const currentRole = user?.activeMembership?.role || 'student';

  // 4. If their role is NOT in the allowed list, bounce them to their own dashboard
  if (!allowedRoles.includes(currentRole)) {
    if (currentRole === 'admin' || currentRole === 'super_admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentRole === 'recruiter') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  // 5. If they pass all checks, render the requested page!
  return <Outlet />;
};

export default ProtectedRoute;