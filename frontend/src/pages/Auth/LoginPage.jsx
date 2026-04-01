// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import meetingImage from '../../assets/business_meeting_office.jpg';
import { useUser } from '../../context/UserContext';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { login } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // 🔥 HELPER FUNCTION: The "Traffic Cop" for routing
  const handleRoleBasedRouting = (user) => {
    // 1. Check basic account status
    if (!user.isEmailVerified) return navigate('/verify');
    if (user.isPlatformAdmin) return navigate('/platform-admin');

    // 2. Check if they have even started onboarding
    if (!user.memberships || user.memberships.length === 0) {
      return navigate('/onboarding');
    }

    // 🔥 REMOVED the `hasVerifiedMembership` check here!
    // Now, unverified users will pass straight through to Step 3.

    // 3. Ensure they have an active context set
    if (!user.activeMembership || !user.activeMembership.role) {
      // If they somehow have a membership but no active role set
      return navigate('/onboarding');
    }

    // 4. Final Routing based on their active role
    const activeRole = user.activeMembership.role;

    switch (activeRole) {
      case 'admin':
      case 'super_admin':
        return navigate('/admin/dashboard');
      case 'recruiter':
        return navigate('/recruiter/dashboard');
      case 'student':
      case 'alumni':
      default:
        return navigate('/student/dashboard');
    }
  };

  const onSubmit = async (data) => {
    setServerError('');

    try {
      const response = await axios.post('/api/user/login', {
        email: data.email,
        password: data.password,
      });

      console.log('Login successful:', response.data);
      const user = response.data.data.user;

      // Update global context
      login(user);

      // Route the user
      handleRoleBasedRouting(user);

    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to connect to the server.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google Register Credential:', credentialResponse);
    try {
      const response = await axios.post('/api/user/google-login', {
        credentialResponse,
      });

      const user = response.data.user;

      // Update global context
      login(user);

      // Route the user 
      handleRoleBasedRouting(user);

    } catch (error) {
      let message = "Something went wrong";

      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Google login failed";
      }
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">

      {/* Main Split Layout Card */}
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200/60 relative">

        {/* Subtle decorative glow to match register page */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500 opacity-5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        {/* LEFT COLUMN: Branding & Image */}
        <div className="flex w-full md:w-1/2 bg-slate-50 p-8 sm:p-10 lg:p-16 flex-col justify-center md:justify-between border-b md:border-b-0 md:border-r border-slate-200">

          <div className="flex items-center gap-3 mb-6 md:mb-12">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight relative z-10">Global Connect</span>
          </div>

          <div className="max-w-md space-y-3 md:space-y-4 mb-8 md:mb-10 relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              The ultimate <span className="text-orange-500 font-extrabold">alumni network</span> for your campus.
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              Join over 10,000 students and professionals building the future of their careers with exclusive referrals and real-time mentorship.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white relative z-10">
            <img src={meetingImage} alt="Office Workspace" className="w-full h-40 sm:h-48 md:h-64 lg:h-80 object-cover" />
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 lg:p-16 flex flex-col justify-center bg-white relative z-10">

          <div className="mb-8 md:mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-2">Enter your credentials to access your workspace.</p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className={`w-full pl-4 pr-10 py-3 md:py-3.5 bg-slate-50 rounded-xl border ${errors.email ? 'border-red-400 focus:ring-red-500/20' : 'border-transparent focus:ring-orange-500/20'} focus:bg-white focus:outline-none focus:ring-2 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400`}
                />
                <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs font-bold text-orange-600 hover:text-orange-700">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  className={`w-full pl-4 pr-12 py-3 md:py-3.5 bg-slate-50 rounded-xl border ${errors.password ? 'border-red-400 focus:ring-red-500/20' : 'border-transparent focus:ring-orange-500/20'} focus:bg-white focus:outline-none focus:ring-2 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium tracking-widest`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white font-semibold py-3 md:py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : 'Login to Dashboard'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-slate-400 font-medium tracking-widest uppercase">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Official Google Login Component */}
          <div className="w-full flex justify-center relative z-10">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setServerError('Google authentication failed. Please try again.');
              }}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          <p className="mt-8 md:mt-10 text-center text-sm text-slate-600 relative z-10">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700">
              Create an account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;