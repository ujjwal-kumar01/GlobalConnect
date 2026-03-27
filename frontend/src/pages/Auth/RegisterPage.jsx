// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import table from '../../assets/table.jpg';
import { useUser } from '../../context/UserContext'; // Import this if you want to auto-login after register

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { login } = useUser(); // Grab login if auto-logging in

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();


  const onSubmit = async (data) => {
    setServerError('');
    try {
      const response = await axios.post('/api/user/registerUser', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      console.log('Registration successful:', response.data);

      // If your backend returns the user data and token on register, you can log them in immediately:
      // ✅ FIX: extract user properly
      const user = response.data.data.user;

      // ✅ login with correct user
      login(user);

      // 🔥 Correct flow based on NEW MODEL
      if (!user.isEmailVerified) {
        navigate('/verify', { replace: true });
      } else if (!user.memberships || user.memberships.length === 0) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.log(err)
      setServerError(err.response?.data?.message || 'Failed to connect to the server.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google Register Credential:', credentialResponse);
    try {
      const response = await axios.post('/api/user/google-login', {
        credentialResponse, // 🔥 THIS is the ID token
      });
      login(response.data.user)
      //TODO: route based on role
      const user = response.data.user;

      // 🔥 Correct flow based on NEW MODEL
      if (!user.isEmailVerified) {
        navigate('/verify', { replace: true });
      } else if (!user.memberships || user.memberships.length === 0) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      let message = "Something went wrong";

      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Google login failed";
      }
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">

      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200/60 relative">

        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        {/* LEFT COLUMN */}
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
              Start building your professional <span className="text-orange-500 font-extrabold">universe</span> today.
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              Join thousands of students and alumni building their future with exclusive referrals and real-time mentorship.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white relative z-10">
            <img src={table} alt="Campus Collaboration" className="w-full h-40 sm:h-48 md:h-64 lg:h-80 object-cover" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white relative z-10">

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1">Sign up to start connecting with the world.</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* ROLE SELECTION UI */}
            <div className="space-y-2">
              <div className="block text-xs font-bold text-slate-600 uppercase tracking-wider">I am ...</div>
            </div>

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Jane Doe)"
                  {...register("name", { required: "Full Name is required" })}
                  className={`w-full pl-4 pr-10 py-3 bg-slate-50 rounded-xl border ${errors.name ? 'border-red-400 focus:ring-red-500/20' : 'border-transparent focus:ring-orange-500/20'} focus:bg-white focus:outline-none focus:ring-2 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400`}
                />
                <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email Address"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className={`w-full pl-4 pr-10 py-3 bg-slate-50 rounded-xl border ${errors.email ? 'border-red-400 focus:ring-red-500/20' : 'border-transparent focus:ring-orange-500/20'} focus:bg-white focus:outline-none focus:ring-2 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400`}
                />
                <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (Min. 6 characters)"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" }
                  })}
                  className={`w-full pl-4 pr-12 py-3 bg-slate-50 rounded-xl border ${errors.password ? 'border-red-400 focus:ring-red-500/20' : 'border-transparent focus:ring-orange-500/20'} focus:bg-white focus:outline-none focus:ring-2 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium tracking-widest`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-5 relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-slate-400 font-medium tracking-widest uppercase">OR</span>
            </div>
          </div>

          <div className="w-full flex justify-center relative z-10">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setServerError('Google authentication failed. Please try again.')}
              theme="outline"
              size="large"
              width="100%"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          <div className="mt-5 text-center space-y-2 relative z-10">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700">Log in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;