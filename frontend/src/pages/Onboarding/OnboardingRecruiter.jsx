// src/pages/OnboardingRecruiter.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useUser } from "../../context/UserContext";

const OnboardingRecruiter = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      college: "",
      company: "",
      position: "",
      location: "",
    }
  });

  // Search and College State
  const [colleges, setColleges] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [serverError, setServerError] = useState('');
  const dropdownRef = useRef(null);

  // Watch the college input to trigger the API search
  const watchedCollege = watch("college");

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch colleges dynamically based on what React Hook Form is watching
  useEffect(() => {
    if (!showDropdown) return;

    const fetchColleges = async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(`/api/colleges?search=${watchedCollege}`);
        const data = response.data.data || response.data || [];
        setColleges(data);
      } catch (error) {
        console.warn("Backend failed to load colleges. Using fallback data.");
        setColleges([
          // { _id: '1', name: "Stanford University" },
          // { _id: '2', name: "Massachusetts Institute of Technology (MIT)" },
          // { _id: '3', name: "Harvard University" },
          // { _id: '4', name: "University of California, Berkeley" }
        ]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchColleges();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [watchedCollege, showDropdown]);

  const handleSelectCollege = (collegeName) => {
    setValue("college", collegeName, { shouldValidate: true });
    setShowDropdown(false);
    setServerError('');
  };

  const onSubmit = async (data) => {
    setServerError('');

    try {
      const selectedRole = localStorage.getItem("selectedRole");
      const role = selectedRole || "recruiter"; 

      const payload = {
        ...data,
        role: role
      };

      const response = await axios.post("/api/user/onboarding/recruiter", 
        payload, 
        { withCredentials: true }
      );

      console.log("Recruiter details saved:", response.data);
      
      // 🛡️ Safety check before updating global context
      if (response.data.user) {
        login(response.data.user);
      }

      localStorage.setItem("onboardingDetails", JSON.stringify(payload));
      navigate("/recruiter/dashboard", { replace: true });
      
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to save details. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center py-12 px-4 sm:px-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-md mb-8">
        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
          Onboarding Journey
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Your professional details.
        </h1>
        
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Step 02 of 02</p>
            <p className="text-sm font-bold text-orange-500">Recruiter Profile</p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-orange-500" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="absolute text-xs font-bold text-slate-900">2/2</span>
          </div>
        </div>
      </div>

      {/* MAIN FORM CARD */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 sm:p-8 mb-6 border border-slate-100">
        
        {serverError && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium text-center">
            {serverError}
          </div>
        )}

        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Help us connect you with the right talent by selecting an institution and providing your organization details.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Smart Search Field for College */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Target Institution</label>
            <div className="relative" ref={dropdownRef}>
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
              
              <input
                type="text"
                placeholder="Search existing network..."
                autoComplete="off"
                {...register("college", { required: "Please select a target institution." })}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  register("college").onChange(e); 
                  setShowDropdown(true);
                }}
                className={`w-full pl-12 pr-10 py-3.5 bg-slate-50/50 rounded-xl border ${errors.college ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:bg-white focus:ring-orange-500/20 focus:border-orange-500'} focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400`}
              />
              
              {isSearching && (
                <svg className="animate-spin w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              )}

              {showDropdown && colleges.length > 0 && (
                <ul className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar overflow-hidden">
                  {colleges.map((college, idx) => {
                    const collegeName = typeof college === 'string' ? college : college.name;
                    return (
                      <li
                        key={idx}
                        onClick={() => handleSelectCollege(collegeName)}
                        className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm font-medium text-slate-700 hover:text-orange-600 border-b border-slate-50 last:border-0 transition-colors"
                      >
                        {collegeName}
                      </li>
                    );
                  })}
                </ul>
              )}
              {showDropdown && !isSearching && watchedCollege && colleges.length === 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-500 text-center">
                  No colleges found in the network yet.
                </div>
              )}
            </div>
            {errors.college && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.college.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Company Name</label>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                {...register("company", { required: "Company name is required." })}
                className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border ${errors.company ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:bg-white focus:ring-orange-500/20 focus:border-orange-500'} focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400`}
              />
            </div>
            {errors.company && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.company.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Your Role</label>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
              <input
                type="text"
                placeholder="e.g. Technical Recruiter"
                {...register("position", { required: "Your position is required." })}
                className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border ${errors.position ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:bg-white focus:ring-orange-500/20 focus:border-orange-500'} focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400`}
              />
            </div>
            {errors.position && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{errors.position.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Location</label>
              <span className="text-[10px] text-slate-400 italic">Optional</span>
            </div>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <input
                type="text"
                placeholder="City, Country or Remote"
                {...register("location")}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Saving...' : 'Finish Setup'}
              {!isSubmitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
            </button>
          </div>
        </form>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wide">VERIFIED TALENT</h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">Gain direct access to verified alumni and graduating students from top universities.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OnboardingRecruiter;