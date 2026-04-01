// src/pages/Shared/PostJob.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useUser } from "../../context/UserContext";

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      company: user?.company || "", 
      location: "",
      salary: "",
      experience: "",
      skillsRequired: "",
      description: "",
      targetColleges: [], // We will manually control this via setValue
    },
  });

  // --- MULTI-SELECT COLLEGE STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Pre-fill user's active college if they have one (useful for Admins)
  useEffect(() => {
    if (user?.activeMembership?.college && selectedColleges.length === 0) {
      const activeCol = user.activeMembership.college;
      if (activeCol._id && activeCol.name) {
        handleAddCollege(activeCol);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch colleges dynamically based on searchQuery (Even when empty!)
  useEffect(() => {
    // Only pause the fetch if the dropdown is completely closed
    if (!showDropdown) return;

    const fetchColleges = async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(`/api/colleges?search=${searchQuery}`);
        const data = response.data.data || response.data || [];
        setSearchResults(data);
      } catch (error) {
        console.warn("Backend search failed.");
        setSearchResults([
          { _id: '1', name: "Stanford University" },
          { _id: '2', name: "Massachusetts Institute of Technology (MIT)" },
          { _id: '3', name: "Harvard University" },
          { _id: '4', name: "University of California, Berkeley" }
        ]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchColleges();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showDropdown]);

  // Handle selecting a college from the dropdown
  const handleAddCollege = (college) => {
    // Prevent duplicates
    if (!selectedColleges.some((c) => c._id === college._id)) {
      const updatedSelection = [...selectedColleges, college];
      setSelectedColleges(updatedSelection);
      // Sync with React Hook Form! Extract just the ObjectIds for the backend
      setValue("targetColleges", updatedSelection.map(c => c._id), { shouldValidate: true });
    }
    
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Handle removing a college tag
  const handleRemoveCollege = (collegeIdToRemove) => {
    const updatedSelection = selectedColleges.filter(c => c._id !== collegeIdToRemove);
    setSelectedColleges(updatedSelection);
    // Sync with React Hook Form
    setValue("targetColleges", updatedSelection.map(c => c._id), { shouldValidate: true });
  };

  // --- FORM SUBMISSION ---
  const onSubmit = async (data) => {
    setServerError("");
    setSuccessMessage("");

    if (selectedColleges.length === 0) {
      setServerError("Please select at least one target institution.");
      return;
    }

    try {
      // 1. Transform skills string into an array of strings
      const formattedSkills = data.skillsRequired
        ? data.skillsRequired.split(",").map((skill) => skill.trim()).filter(Boolean)
        : [];

      // 2. Build payload matching the Mongoose Schema
      const payload = {
        title: data.title,
        company: data.company,
        location: data.location,
        salary: data.salary,
        experience: data.experience,
        description: data.description,
        skillsRequired: formattedSkills,
        targetColleges: data.targetColleges, // Already an array of ObjectIds!
      };

      // 3. Send to backend
      const response = await axios.post("/api/jobs/post", payload, {
        withCredentials: true,
      });

      console.log("Job posted:", response.data);
      setSuccessMessage("Job posted successfully! It is now visible to the selected networks.");
      
      // Clear form on success
      reset();
      setSelectedColleges([]);
      
      setTimeout(() => {
        navigate(-1); // Go back to dashboard/jobs list
      }, 2000);

    } catch (err) {
      console.log(err.response)
      setServerError(err.response?.data?.message || "Failed to post job. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Post a New Opportunity
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Target specific university networks and find the perfect candidate.
        </p>
      </div>

      {/* Notifications */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {serverError}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 font-medium flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {successMessage}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Target Colleges Multi-Select */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Institutions <span className="text-orange-500">*</span>
              </label>
              <p className="text-[10px] text-slate-400">Search and select the colleges where this job should be visible.</p>
            </div>

            {/* Render Selected College Tags */}
            {selectedColleges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedColleges.map((col) => (
                  <span key={col._id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg text-sm font-semibold">
                    {col.name}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveCollege(col._id)}
                      className="text-orange-400 hover:text-orange-800 transition-colors focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative" ref={dropdownRef}>
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
              
              <input
                type="text"
                placeholder="Search colleges to add..."
                autoComplete="off"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full pl-12 pr-10 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              
              {isSearching && (
                <svg className="animate-spin w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              )}

              {/* 🔥 FIX: Dropdown Results now show even if searchQuery is empty! */}
              {showDropdown && searchResults.length > 0 && (
                <ul className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar overflow-hidden">
                  {searchResults.map((col) => (
                    <li
                      key={col._id}
                      onClick={() => handleAddCollege(col)}
                      className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm font-medium text-slate-700 hover:text-orange-600 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      {col.name}
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && !isSearching && searchResults.length === 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-500 text-center">
                  {searchQuery ? `No colleges found matching "${searchQuery}"` : "No colleges available"}
                </div>
              )}
            </div>
            {/* Hidden input to hold validation for react-hook-form */}
            <input type="hidden" {...register("targetColleges", { validate: value => value.length > 0 || "Target college is required" })} />
            {errors.targetColleges && <p className="text-[10px] font-bold text-red-500">{errors.targetColleges.message}</p>}
          </div>

          {/* Core Info - 2 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Job Title <span className="text-orange-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer Internship"
                {...register("title", { required: "Job title is required" })}
                className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.title ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500'} focus:bg-white focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400`}
              />
              {errors.title && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Company <span className="text-orange-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                {...register("company", { required: "Company name is required" })}
                className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.company ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500'} focus:bg-white focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400`}
              />
              {errors.company && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.company.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA (or Remote)"
                {...register("location")}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Salary Range</label>
              <input
                type="text"
                placeholder="e.g. $80k - $100k or Competitive"
                {...register("salary")}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Experience Level</label>
              <div className="relative">
                <select
                  {...register("experience")}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 appearance-none"
                >
                  <option value="">Select Level</option>
                  <option value="Internship">Internship</option>
                  <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                  <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                  <option value="Senior Level (5+ years)">Senior Level (5+ years)</option>
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Required Skills</label>
              <input
                type="text"
                placeholder="e.g. React, Node.js, MongoDB"
                {...register("skillsRequired")}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 ml-1">Separate skills with commas</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Job Description <span className="text-orange-500">*</span></label>
            <textarea
              rows="6"
              placeholder="Describe the role, responsibilities, and ideal candidate..."
              {...register("description", { required: "Description is required" })}
              className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.description ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500'} focus:bg-white focus:outline-none focus:ring-2 transition-all text-slate-900 placeholder:text-slate-400 custom-scrollbar resize-none`}
            ></textarea>
            {errors.description && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.description.message}</p>}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Posting...
                </>
              ) : 'Publish Job'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PostJob;