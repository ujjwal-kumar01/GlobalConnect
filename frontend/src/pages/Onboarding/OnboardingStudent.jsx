// src/pages/OnboardingStudent.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OnboardingStudent = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const [form, setForm] = useState({
    college: "",
    graduationYear: "",
    position: "",
    company: "",
  });

  // Fetch colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await axios.get("/api/colleges/all");
        setColleges(response.data);
      } catch (error) {
        console.warn("Backend failed to load colleges. Using fallback data.");
        // Fallback data if backend is down
        setColleges([
          "Stanford University",
          "Massachusetts Institute of Technology (MIT)",
          "Harvard University",
          "University of California, Berkeley"
        ]);
      }
    };
    fetchColleges();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    setServerError('');
    
    // Basic validation
    if (!form.college || !form.graduationYear) {
      setServerError("College and Graduation Year are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Retrieve the role we saved during the Register step
      const selectedRole = localStorage.getItem("selectedRole");
      console.log(selectedRole)
      const role = selectedRole || "student"; // Default to student if missing

      // Combine form data with the role
      const payload = {
        ...form,
        role: role
      };

      // Send to backend
      const response = await axios.post("/api/user/onboarding/academic",
        payload, 
        {withCredentials:true}
      );

      console.log("Onboarding data saved:", response.data);
      
      // Save locally just in case next steps need it, then navigate
      localStorage.setItem("onboardingDetails", JSON.stringify(payload));
      navigate("/student/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate an array of years for the dropdown (from current year + 4 back to 1980)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 5 - 1980 }, (_, i) => currentYear + 4 - i);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center py-12 px-4 sm:px-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-md mb-8">
        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
          Onboarding Journey
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Tell us about your background.
        </h1>
        
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Step 02 of 02</p>
            <p className="text-sm font-bold text-orange-500">Academic & Professional</p>
          </div>
          {/* Progress Ring */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-orange-500" strokeDasharray="99, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
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

        <div className="space-y-6">
          
          {/* College Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">College / University</label>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
              <select
                name="college"
                value={form.college}
                onChange={handleChange}
                className={`w-full pl-12 pr-10 py-3.5 bg-slate-50/50 rounded-xl border ${form.college === "" ? 'text-slate-500' : 'text-slate-900'} border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none`}
              >
                <option value="" disabled>Search your alma mater...</option>
                {colleges.map((college, idx) => (
                  <option key={idx} value={college} className="text-slate-900">{college}</option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            <p className="text-[10px] text-slate-400 ml-1">Type to search from 5,000+ global institutions</p>
          </div>

          {/* Graduation Year */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Graduation Year</label>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <select
                name="graduationYear"
                value={form.graduationYear}
                onChange={handleChange}
                className={`w-full pl-12 pr-10 py-3.5 bg-slate-50/50 rounded-xl border ${form.graduationYear === "" ? 'text-slate-500' : 'text-slate-900'} border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none`}
              >
                <option value="" disabled>Select Year</option>
                {years.map(year => (
                  <option key={year} value={year} className="text-slate-900">{year}</option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
            </div>
          </div>

          {/* Current Position */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Current Position</label>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
              <input
                type="text"
                name="position"
                placeholder="e.g. Senior Architect"
                value={form.position}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Current Company */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Current Company</label>
              <span className="text-[10px] text-slate-400 italic">Optional</span>
            </div>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              <input
                type="text"
                name="company"
                placeholder="Where are you making an impact?"
                value={form.company}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

        </div>

        {/* ACTIONS */}
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
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Dashboard'}
            {!isSubmitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
          </button>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="w-full max-w-md space-y-4">
        
        {/* Privacy First */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wide">PRIVACY FIRST</h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">Your professional details are only shared with verified alumni connections.</p>
          </div>
        </div>

        {/* Smart Matching */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/></svg>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wide">SMART MATCHING</h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">We use this to suggest mentors and networking events in your field.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default OnboardingStudent;