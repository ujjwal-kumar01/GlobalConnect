import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const JoinCollege = () => {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [switchingId, setSwitchingId] = useState(null); // 🔥 NEW: Track switching state
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
        setError("Failed to load institutions.");
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchColleges();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle Joining
  const handleJoinCollege = async (collegeId, collegeName) => {
    setJoiningId(collegeId);
    setError('');
    try {
      await axios.post('/api/user/memberships/request', {
        collegeId: collegeId,
        role: user?.activeMembership?.role || 'recruiter' 
      }, { withCredentials: true });
      
      await refreshUser(true);
      setSuccessMessage(`Successfully requested access to ${collegeName}!`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to join ${collegeName}.`);
    } finally {
      setJoiningId(null);
    }
  };

  // 🔥 NEW: Handle Switching Active College
  const handleSwitchCollege = async (collegeId, role) => {
    setSwitchingId(collegeId);
    setError('');
    try {
      // Backend should update the 'activeMembership' field in User model
      await axios.put('/api/user/memberships/active', { collegeId, role }, { withCredentials: true });
      
      await refreshUser(true);
      setSuccessMessage("Switched active network successfully!");
      
      // Optional: Redirect to dashboard after switching
      setTimeout(() => navigate('/recruiter/dashboard'), 1500);
    } catch (err) {
      setError("Failed to switch active network.");
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemoveCollege = async (collegeId, collegeName, isVerified) => {
    const actionText = isVerified ? "leave" : "cancel your request for";
    if (!window.confirm(`Are you sure you want to ${actionText} ${collegeName}?`)) return;

    setRemovingId(collegeId);
    try {
      await axios.delete(`/api/user/memberships/${collegeId}`, { withCredentials: true });
      await refreshUser(true);
      setSuccessMessage(`Successfully removed ${collegeName}.`);
    } catch (err) {
      setError("Failed to remove network.");
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
    const isActive = user?.activeMembership?.college?._id === college._id || user?.activeMembership?.college === college._id;
    
    if (membership) {
      connectedColleges.push({ 
        ...college, 
        isVerified: membership.isVerified,
        role: membership.role,
        isActive: isActive 
      });
    } else {
      availableColleges.push(college);
    }
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans text-left">
      
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Manage Networks</h1>
        <p className="text-slate-500 text-lg">Connect with different institutions to discover fresh talent and alumni.</p>
      </div>

      <div className="relative max-w-2xl mb-10">
        <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input type="text" placeholder="Search by university name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-lg font-medium" />
      </div>

      {(error || successMessage) && (
        <div className={`mb-8 p-4 rounded-xl border font-medium flex items-center gap-3 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {error || successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><svg className="animate-spin h-10 w-10 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
      ) : (
        <div className="space-y-12">
          
          {connectedColleges.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Your Networks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedColleges.map((college) => (
                  <div key={college._id} className={`bg-white rounded-[1.5rem] p-6 border flex flex-col h-full transition-all ${college.isActive ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-200 opacity-90'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{college.name}</h3>
                            <p className="text-sm font-medium text-slate-500">{college.location || "Global Network"}</p>
                        </div>
                        {college.isActive && <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-lg">Active</span>}
                    </div>

                    <div className="pt-5 border-t border-slate-100 mt-auto flex flex-col gap-3">
                      {/* Status / Switch Action */}
                      {college.isVerified ? (
                        !college.isActive ? (
                            <button
                                onClick={() => handleSwitchCollege(college._id, college.role)}
                                disabled={switchingId === college._id}
                                className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-orange-600 transition-colors"
                            >
                                {switchingId === college._id ? 'Switching...' : 'Switch to this Campus'}
                            </button>
                        ) : (
                            <div className="w-full py-2.5 bg-green-100 text-green-700 text-sm font-bold rounded-xl flex justify-center items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                Currently Managing
                            </div>
                        )
                      ) : (
                        <div className="w-full py-2.5 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl flex justify-center items-center gap-2 italic">
                          Pending Approval
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRemoveCollege(college._id, college.name, college.isVerified)}
                        disabled={removingId === college._id}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors self-center pt-1"
                      >
                        {college.isVerified ? 'Leave Network' : 'Cancel Request'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableColleges.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Discover Campuses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableColleges.map((college) => (
                  <div key={college._id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-5 shrink-0 border border-orange-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{college.name}</h3>
                      <p className="text-sm font-medium text-slate-500 mb-4">{college.location || "Global"}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                      <button
                        onClick={() => handleJoinCollege(college._id, college.name)}
                        disabled={joiningId === college._id}
                        className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-orange-500 transition-colors"
                      >
                        {joiningId === college._id ? 'Requesting...' : 'Request Access'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JoinCollege;