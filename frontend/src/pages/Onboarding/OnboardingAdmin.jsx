// src/pages/OnboardingAdmin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OnboardingAdmin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("join"); // 'join' or 'create'
  const [colleges, setColleges] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Added 'domain' to our form state
  const [form, setForm] = useState({
    college: "",
    domain: "",
  });

  // Fetch colleges on component mount for the "Join" dropdown
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await axios.get("/api/colleges/all");
        setColleges(response.data);
      } catch (error) {
        console.warn("Backend failed to load colleges. Using fallback data.");
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

  // Updated to dynamically handle multiple inputs (college AND domain)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError('');
  };

  const handleNext = async () => {
    setServerError('');
    
    // Validation
    if (!form.college) {
      setServerError(mode === "join" ? "Please select a college to join." : "Please enter the new college name.");
      return;
    }

    // New Validation: Ensure domain is provided if creating a new college
    if (mode === "create" && !form.domain) {
      setServerError("Please enter a valid email domain for your students.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Retrieve role
      const selectedRole = localStorage.getItem("selectedRole");
      const role = selectedRole || "admin"; // Default to admin if missing

      // Dynamically build payload
      const payload = {
        mode, // Sending whether they are joining or creating
        college: form.college,
        role: role,
        // Only attach the domain to the payload if they are creating a new college
        ...(mode === "create" && { domain: form.domain.trim().toLowerCase() }) 
      };

      // API Call
      const response = await axios.post("/api/user/onboarding/admin", 
        payload,
        { withCredentials: true }
      );

      console.log("Admin details saved:", response.data);
      
      localStorage.setItem("onboardingDetails", JSON.stringify(payload));
      
      // Navigate to the admin layout/dashboard
      navigate("/admin/dashboard", { replace: true });
      
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to set up organization. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          Setup your organization.
        </h1>
        
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Step 02 of 02</p>
            <p className="text-sm font-bold text-orange-500">Platform Management</p>
          </div>
          {/* Progress Ring (100% Full) */}
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

        {/* Premium Segmented Control Toggle */}
        <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/50">
          <button
            onClick={() => { setMode("join"); setForm({ college: "", domain: "" }); setServerError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              mode === "join"
                ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Join College
          </button>
          <button
            onClick={() => { setMode("create"); setForm({ college: "", domain: "" }); setServerError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              mode === "create"
                ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Create New
          </button>
        </div>

        <div className="space-y-6">
          
          {/* College Name / Dropdown Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {mode === "join" ? "Select Institution" : "Institution Name"}
            </label>
            
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
              
              {mode === "join" ? (
                <>
                  {/* Join Mode: Dropdown */}
                  <select
                    name="college"
                    value={form.college}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-10 py-3.5 bg-slate-50/50 rounded-xl border ${form.college === "" ? 'text-slate-500' : 'text-slate-900'} border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none`}
                  >
                    <option value="" disabled>Search existing network...</option>
                    {colleges.map((college, idx) => (
                      <option key={idx} value={college} className="text-slate-900">{college}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </>
              ) : (
                /* Create Mode: Text Input */
                <input
                  type="text"
                  name="college"
                  placeholder="e.g. University of Example"
                  value={form.college}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
                />
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 ml-1">
              {mode === "join" 
                ? "Request admin access to an existing college network." 
                : "Register a brand new institution on Global Connect."}
            </p>
          </div>

          {/* DOMAIN FIELD: Only visible in "Create" mode */}
          {mode === "create" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Approved Email Domain
              </label>
              <div className="relative">
                {/* Globe Icon for Domain */}
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                <input
                  type="text"
                  name="domain"
                  placeholder="e.g. example.edu"
                  value={form.domain}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">
                Only students/alumni with this email domain will be verified.
              </p>
            </div>
          )}

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
            {isSubmitting ? 'Saving...' : 'Finish Setup'}
            {!isSubmitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
          </button>
        </div>
      </div>

      {/* INFO CARDS (Tailored for Admins) */}
      <div className="w-full max-w-md space-y-4">
        
        {/* Verification Notice */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wide">VERIFICATION REQUIRED</h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">Admin privileges will be granted after our team verifies your organizational credentials.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default OnboardingAdmin;