import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

const RecruiterManagement = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'verified'
  const [recruiters, setRecruiters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // 🔍 NEW: State to hold the search text
  const [searchQuery, setSearchQuery] = useState('');

  // Extract active college info to ensure Admin has context
  const activeCollegeId = user?.activeMembership?.college?._id || user?.activeMembership?.college;

  // Fetch Recruiters based on tab
  useEffect(() => {
    const fetchRecruiters = async () => {
      if (!activeCollegeId) return;

      setIsLoading(true);
      setError('');
      try {
        const isVerifiedStatus = activeTab === 'verified';
        
        // Using the Unified API Route with dynamic role parameter
        const response = await axios.get(`/api/admin/members`, {
          params: { isVerified: isVerifiedStatus, role: 'recruiter' },
          withCredentials: true
        });
        setRecruiters(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch recruiters:", err.response?.data);
        setError("Failed to load recruiter requests. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecruiters();
    // 🔍 NEW: Clear the search query when switching tabs
    setSearchQuery('');
  }, [activeTab, activeCollegeId]);

  // Handle Approving a Recruiter
  const handleApprove = async (userId, userName) => {
    setProcessingId(userId);
    try {
      await axios.put(`/api/admin/memberships/${userId}/verify`, {}, { withCredentials: true });
      setSuccessMsg(`${userName} has been approved to post jobs!`);
      setRecruiters(recruiters.filter(r => r._id !== userId));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(`Failed to approve ${userName}.`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Rejecting a Request
  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to reject ${userName}'s request?`)) return;
    setProcessingId(userId);
    try {
      await axios.delete(`/api/admin/memberships/${userId}`, { withCredentials: true });
      setRecruiters(recruiters.filter(r => r._id !== userId));
    } catch (err) {
      setError(`Failed to reject ${userName}.`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Revoking an already verified recruiter
  const handleRevoke = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to revoke ${userName}'s access? They will no longer be able to post jobs to your college.`)) return;
    setProcessingId(userId);
    try {
      await axios.delete(`/api/admin/memberships/${userId}`, { withCredentials: true });
      setSuccessMsg(`${userName}'s access has been revoked.`);
      setRecruiters(recruiters.filter(r => r._id !== userId));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(`Failed to revoke access for ${userName}.`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  // 🔍 NEW: Derived state for filtering the list based on search
  const filteredRecruiters = recruiters.filter(targetUser => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      targetUser.name.toLowerCase().includes(query) || 
      targetUser.email.toLowerCase().includes(query) ||
      (targetUser.company && targetUser.company.toLowerCase().includes(query)) // Search by company too!
    );
  });

  if (!activeCollegeId) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl m-8 font-medium">
        No active college network found for your account.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Corporate Partners
        </h1>
        <p className="text-slate-500 text-sm">
          Review pending corporate access requests and manage active recruiters connected to your university.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 font-medium">
          {successMsg}
        </div>
      )}

      {/* 🔍 NEW: Unified Controls Bar (Tabs + Search) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 mb-6 gap-4 pb-2 sm:pb-0">
        
        {/* Custom Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 -mb-[1px] ${activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 -mb-[1px] ${activeTab === 'verified' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Active Recruiters
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 mb-2 sm:mb-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : recruiters.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No recruiters found</h3>
          <p className="text-sm text-slate-500">There are currently no {activeTab} recruiter requests.</p>
        </div>
      ) : filteredRecruiters.length === 0 ? (
        /* 🔍 NEW: Empty state for when the search finds no matches */
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No matches found</h3>
          <p className="text-sm text-slate-500">We couldn't find anyone matching "{searchQuery}"</p>
          <button onClick={() => setSearchQuery('')} className="mt-4 text-sm font-bold text-orange-600 hover:text-orange-700">Clear Search</button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 🔍 NEW: Map over filteredRecruiters instead of recruiters */}
          {filteredRecruiters.map((targetUser) => (
            <div key={targetUser._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
              
              {/* Recruiter Info */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold uppercase shrink-0 border border-orange-100 overflow-hidden">
                  {targetUser.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" alt="" /> : (targetUser.company ? targetUser.company.charAt(0) : targetUser.name.charAt(0))}
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-base flex items-center gap-2">
                    {targetUser.name}
                    {activeTab === 'verified' && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{targetUser.position || 'Recruiter'}</span>
                    <span>@</span>
                    <span className="font-bold text-slate-800">{targetUser.company || 'Unknown Company'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{targetUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Area based on Tab */}
              {activeTab === 'pending' ? (
                <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
                  <button
                    onClick={() => handleReject(targetUser._id, targetUser.name)}
                    disabled={processingId === targetUser._id}
                    className="flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {processingId === targetUser._id ? '...' : 'Deny'}
                  </button>
                  <button
                    onClick={() => handleApprove(targetUser._id, targetUser.name)}
                    disabled={processingId === targetUser._id}
                    className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-orange-500 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {processingId === targetUser._id ? '...' : 'Verify Company'}
                  </button>
                </div>
              ) : (
                /* Action for Verified Recruiters */
                <div className="flex items-center mt-2 md:mt-0 w-full md:w-auto">
                  <button
                    onClick={() => handleRevoke(targetUser._id, targetUser.name)}
                    disabled={processingId === targetUser._id}
                    className="w-full md:w-auto px-5 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {processingId === targetUser._id ? '...' : 'Revoke Access'}
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterManagement;