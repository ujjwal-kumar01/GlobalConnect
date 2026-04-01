import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

const Jobs = () => {
  const { user } = useUser();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedJobs, setAppliedJobs] = useState(new Set()); 

  // Modal & Application States
  const [selectedJobToApply, setSelectedJobToApply] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [modalError, setModalError] = useState('');
  const fileInputRef = useRef(null);

  const activeCollegeId = user?.activeMembership?.college?._id || user?.activeMembership?.college;
  const userRole = user?.activeMembership?.role;

  useEffect(() => {
    const fetchCampusJobs = async () => {
      if (!activeCollegeId) return;
      setIsLoading(true);
      try {
        const response = await axios.get('/api/jobs/campus', { withCredentials: true });
        setJobs(response.data.data.jobs || []);
        
        const appliedSet = new Set(response.data.data.appliedJobIds.map(id => id.toString()));
        setAppliedJobs(appliedSet);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        setError("Failed to load campus jobs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampusJobs();
  }, [activeCollegeId]);

  // Open Modal
  const openApplyModal = (job) => {
    if (userRole !== 'student') {
      alert("Only active students can apply for campus placements.");
      return;
    }
    setSelectedJobToApply(job);
    setResumeFile(null);
    setModalError('');
  };

  // Close Modal
  const closeApplyModal = () => {
    setSelectedJobToApply(null);
    setResumeFile(null);
    setModalError('');
  };

  // Submit Application with Resume
  const submitApplication = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setModalError("Please upload a resume to apply.");
      return;
    }

    setIsApplying(true);
    setModalError('');

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      await axios.post(`/api/jobs/${selectedJobToApply._id}/apply`, formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg(`Successfully applied for ${selectedJobToApply.title}!`);
      setAppliedJobs(prev => new Set(prev).add(selectedJobToApply._id.toString()));
      closeApplyModal();
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err.response?.data?.message || `Failed to apply. Please try again.`);
    } finally {
      setIsApplying(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) || 
      job.company.toLowerCase().includes(query) ||
      (job.skillsRequired && job.skillsRequired.some(skill => skill.toLowerCase().includes(query)))
    );
  });

  if (!activeCollegeId) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl m-8 font-medium">
        You must be enrolled in a college network to view campus jobs.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans relative">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Placements
        </h1>
        <p className="text-slate-500 mt-1">
          Discover and apply for opportunities exclusively available to your college.
        </p>
      </div>

      {/* Notifications */}
      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
      {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl font-medium">{successMsg}</div>}

      {/* Search Bar */}
      <div className="mb-8 relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          type="text"
          placeholder="Search by role, company, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
        />
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
      ) : jobs.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs posted yet</h3>
          <p className="text-slate-500">Recruiters haven't posted any opportunities for your college yet. Check back soon!</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-20 text-center"><p className="text-slate-500">No jobs match your search criteria.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map(job => {
            const hasApplied = appliedJobs.has(job._id.toString());
            
            return (
              <div key={job._id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                {/* ... Job Card Content ... */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-extrabold text-xl uppercase shrink-0 border border-orange-100">
                      {job.company.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{job.title}</h2>
                      <p className="text-sm font-bold text-slate-600 mt-1">{job.company}</p>
                    </div>
                  </div>
                  {hasApplied && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      Applied
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {job.location || 'Remote'}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {job.salary}
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 line-clamp-3 mb-6 leading-relaxed flex-1">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {job.skillsRequired?.slice(0, 4).map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{skill}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                  <span className="text-xs font-bold text-slate-400">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  
                  {/* Changed from handleApply to openApplyModal */}
                  <button
                    onClick={() => openApplyModal(job)}
                    disabled={hasApplied || userRole !== 'student'}
                    title={userRole !== 'student' ? "Only active students can apply" : ""}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
                      hasApplied || userRole !== 'student'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-orange-600 hover:shadow-orange-500/20'
                    }`}
                  >
                    {hasApplied ? 'Application Sent' : 'Apply Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- APPLICATION MODAL --- */}
      {selectedJobToApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Submit Application</h3>
              <button onClick={closeApplyModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={submitApplication} className="p-6">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Applying for</p>
                <p className="text-lg font-bold text-slate-900">{selectedJobToApply.title}</p>
                <p className="text-sm font-medium text-slate-600">at {selectedJobToApply.company}</p>
              </div>

              {modalError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100">
                  {modalError}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Upload Resume (PDF)*</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-orange-300 transition-all"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-2 text-orange-600 font-medium text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        {resumeFile.name}
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-sm text-slate-500 font-medium">Click to browse files</p>
                        <p className="text-xs text-slate-400 mt-1">PDF or DOCX up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={closeApplyModal} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isApplying || !resumeFile} className="flex-1 py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isApplying ? 'Uploading...' : 'Confirm Apply'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Jobs;