import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const JoinCollege = () => {
  const { user, refreshUser } = useUser(); // Ensure refreshUser is extracted!
  const navigate = useNavigate();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [removingId, setRemovingId] = useState(null); // 🔥 NEW: Track removal loading state
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/colleges?search=${searchQuery}`);
        setColleges(response.data.data || response.data || []);
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
        setError("Failed to load institutions. Please try again later.");
        
        // Fallback dummy data
        setColleges([
          { _id: '1', name: 'Stanford University', location: 'Stanford, CA', alumniCount: 12400 },
          { _id: '2', name: 'Massachusetts Institute of Technology', location: 'Cambridge, MA', alumniCount: 9800 },
          { _id: '3', name: 'Harvard University', location: 'Cambridge, MA', alumniCount: 15200 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchColleges();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle Joining a College
  const handleJoinCollege = async (collegeId, collegeName) => {
    setJoiningId(collegeId);
    setError('');
    setSuccessMessage('');

    try {
      await axios.post('/api/user/memberships/request', {
        collegeId: collegeId,
        role: user?.activeMembership?.role || 'recruiter' 
      }, { withCredentials: true });
      
      await refreshUser(true); // Force context sync
      setSuccessMessage(`Successfully requested access to ${collegeName}!`);
      
    } catch (err) {
      setError(err.response?.data?.message || `Failed to join ${collegeName}.`);
    } finally {
      setJoiningId(null);
    }
  };

  // 🔥 NEW: Handle Removing a College
  const handleRemoveCollege = async (collegeId, collegeName, isVerified) => {
    const actionText = isVerified ? "leave" : "cancel your request for";
    if (!window.confirm(`Are you sure you want to ${actionText} ${collegeName}?`)) return;

    setRemovingId(collegeId);
    setError('');
    setSuccessMessage('');

    try {
      // Create a backend route to let a user delete their OWN membership
      await axios.delete(`/api/user/memberships/${collegeId}`, { withCredentials: true });
      
      await refreshUser(true); // Sync Context! The college will instantly jump back to "Discover"
      setSuccessMessage(`Successfully removed ${collegeName} from your networks.`);
      
    } catch (err) {
      setError(err.response?.data?.message || `Failed to remove ${collegeName}.`);
    } finally {
      setRemovingId(null);
    }
  };

  // --- SMART FILTERING LOGIC ---
  const getUserMembershipStatus = (collegeId) => {
    return user?.memberships?.find(m => {
      const id = typeof m.college === 'object' ? m.college._id : m.college;
      return id === collegeId;
    });
  };

  const availableColleges = [];
  const connectedColleges = [];

  colleges.forEach(college => {
    const membership = getUserMembershipStatus(college._id);
    if (membership || college.justRequested) {
      connectedColleges.push({ 
        ...college, 
        isVerified: membership?.isVerified || false,
        role: membership?.role || 'pending'
      });
    } else {
      availableColleges.push(college);
    }
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Find Your Campus
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          Search for your institution to connect with verified alumni, access exclusive job boards, and grow your network.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mb-10">
        <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          type="text"
          placeholder="Search by university name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 placeholder:text-slate-400 text-lg font-medium"
        />
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-8 p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 font-medium flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-orange-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* SECTION 1: Already Connected / Pending */}
          {connectedColleges.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                Your Networks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedColleges.map((college) => (
                  <div key={college._id} className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-200 flex flex-col h-full opacity-90 relative group">
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                        {college.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                        {college.location || "Global Network"}
                      </div>
                    </div>

                    {/* 🔥 UPDATED FOOTER WITH REMOVE BUTTON */}
                    <div className="pt-5 border-t border-slate-200 mt-auto flex flex-col gap-3">
                      {college.isVerified ? (
                        <div className="w-full py-2.5 bg-green-100 text-green-700 text-sm font-bold rounded-xl flex justify-center items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                          Verified Member
                        </div>
                      ) : (
                        <div className="w-full py-2.5 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl flex justify-center items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Pending Approval
                        </div>
                      )}
                      
                      {/* Self-Remove Button */}
                      <button
                        onClick={() => handleRemoveCollege(college._id, college.name, college.isVerified)}
                        disabled={removingId === college._id}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors self-center pt-1 disabled:opacity-50"
                      >
                        {removingId === college._id ? 'Processing...' : (college.isVerified ? 'Leave Network' : 'Cancel Request')}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: Available to Join */}
          {availableColleges.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Discover Campuses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableColleges.map((college) => (
                  <div key={college._id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                    
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-5 shrink-0 border border-orange-100">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                        {college.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {college.location || "Global"}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {college.alumniCount ? `${college.alumniCount.toLocaleString()} Members` : 'Growing Network'}
                      </span>
                      <button
                        onClick={() => handleJoinCollege(college._id, college.name)}
                        disabled={joiningId === college._id}
                        className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-70 flex items-center gap-2"
                      >
                        {joiningId === college._id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Requesting...
                          </>
                        ) : 'Request Access'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Only show empty state if NO colleges exist in BOTH arrays
            connectedColleges.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No new colleges found</h3>
                <p className="text-sm text-slate-500">Try adjusting your search terms or checking your spelling.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default JoinCollege;