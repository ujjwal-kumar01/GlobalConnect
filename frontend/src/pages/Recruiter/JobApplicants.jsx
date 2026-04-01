import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

// 🔥 NEW: Custom Dropdown Component to match your design
// 🔥 Pixel-Perfect Custom Dropdown
const StatusDropdown = ({ currentStatus, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'pending', label: 'Mark Pending' },
    { value: 'shortlisted', label: 'Shortlist' },
    { value: 'rejected', label: 'Reject' }
  ];

  const currentLabel = options.find(o => o.value === currentStatus)?.label || 'Mark Pending';

  return (
    <div className="relative mt-1" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-end w-full gap-1 text-[14px] font-semibold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
      >
        {currentLabel}
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-300 shadow-sm z-50 flex flex-col">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              // 🔥 TWEAKED: Adjusted padding, font weights, and background colors to match the image perfectly
              className={`block w-full text-right px-3 py-2 text-[14px] focus:outline-none transition-none ${
                currentStatus === opt.value
                  ? 'bg-[#4062bc] text-white font-bold' // Exact blue shade with BOLD text
                  : 'bg-[#f8f9fa] text-slate-700 hover:bg-slate-100 hover:text-slate-900' // Off-white background with dark slate text
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const JobApplicants = () => {
  const { user } = useUser();
  
  // States
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch the jobs posted by this recruiter on component mount
  useEffect(() => {
    const fetchMyJobs = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/jobs/me', { withCredentials: true });
        setJobs(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        setError("Failed to load your posted jobs.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  // 2. Fetch applications when a specific job is clicked
  const handleViewJob = async (job) => {
    setSelectedJob(job);
    setIsAppsLoading(true);
    setSearchQuery(''); // Reset search when switching jobs
    try {
      const response = await axios.get(`/api/jobs/${job._id}/applications`, { withCredentials: true });
      setApplications(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load applicants for this job.");
    } finally {
      setIsAppsLoading(false);
    }
  };

  // 3. Handle updating the application status
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await axios.put(`/api/jobs/applications/${applicationId}/status`, 
        { status: newStatus }, 
        { withCredentials: true }
      );
      // Optimistically update UI
      setApplications(prev => prev.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      alert("Failed to update applicant status.");
    }
  };

  // 🔍 Filter applications for the Detail View
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const applicantName = app.applicant?.name?.toLowerCase() || '';
    const applicantEmail = app.applicant?.email?.toLowerCase() || '';
    return applicantName.includes(query) || applicantEmail.includes(query);
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'shortlisted': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200'; // pending
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* ------------------------------------------------------------------ */}
      {/* VIEW 1: JOB LISTING (Master View)                                  */}
      {/* ------------------------------------------------------------------ */}
      {!selectedJob ? (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Your Posted Jobs</h1>
            <p className="text-slate-500 mt-1">Select a job below to view and manage its applicants.</p>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>}

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1">No jobs posted yet</h3>
              <p className="text-sm text-slate-500">Post a job to start receiving applications.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <div key={job._id} onClick={() => handleViewJob(job)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {job.location || 'Remote'}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
                      View Applicants <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (

      /* ------------------------------------------------------------------ */
      /* VIEW 2: APPLICANT LIST (Detail View)                               */
      /* ------------------------------------------------------------------ */
        <>
          <div className="mb-6">
            <button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Jobs
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Applicants for {selectedJob.title}
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible min-h-[400px]">
            {/* Table Header & Search */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 rounded-t-2xl">
              <span className="text-sm font-bold text-slate-700">{applications.length} Total Applicants</span>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search candidate name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            {isAppsLoading ? (
              <div className="py-20 flex justify-center"><svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm text-slate-500">No applicants found for this role yet.</p>
              </div>
            ) : (
              <div className="overflow-x-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-white">
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Applied Date</th>
                      <th className="px-6 py-4 text-center">Documents</th>
                      <th className="px-6 py-4 text-right w-48">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Candidate */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold uppercase shrink-0">
                              {app.applicant?.avatar ? <img src={app.applicant.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : app.applicant?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{app.applicant?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{app.applicant?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>

                        {/* Resume & Cover Letter */}
                        <td className="px-6 py-4 text-center space-x-2">
                          {app.resume ? (
                            <a href={app.resume} target="_blank" rel="noopener noreferrer" className="inline-flex px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold transition-colors">
                              Resume
                            </a>
                          ) : <span className="text-xs text-slate-400 italic">No Resume</span>}
                          
                          {app.coverLetter && (
                             <a href={app.coverLetter} target="_blank" rel="noopener noreferrer" className="inline-flex px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">
                             Cover Letter
                           </a>
                          )}
                        </td>

                        {/* Status Actions */}
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex flex-col items-end gap-1.5 w-full">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(app.status)}`}>
                              {app.status || 'Pending'}
                            </span>
                            
                            {/* 🔥 Replaced native <select> with Custom Component */}
                            <div className="w-full max-w-[120px]">
                              <StatusDropdown 
                                currentStatus={app.status || 'pending'} 
                                onChange={(newVal) => handleStatusChange(app._id, newVal)} 
                              />
                            </div>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default JobApplicants;