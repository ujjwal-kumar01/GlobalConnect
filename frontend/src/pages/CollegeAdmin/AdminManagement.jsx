import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

const AdminManagement = () => {
  const { user } = useUser();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // View State
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'verified'
  const [processingId, setProcessingId] = useState(null);

  // 🔍 NEW: State to hold the search text
  const [searchQuery, setSearchQuery] = useState('');

  // Get the Admin's current college scope
  const adminCollegeId = typeof user?.activeMembership?.college === 'object' 
    ? user?.activeMembership?.college?._id 
    : user?.activeMembership?.college;

  // Fetch Admins Only
  const fetchAdmins = async () => {
    if (!adminCollegeId) return;
    
    setIsLoading(true);
    setError('');
    try {
      const isVerifiedStatus = activeTab === 'verified';
      
      const response = await axios.get(`/api/admin/members`, {
        params: { isVerified: isVerifiedStatus, role: 'admin' },
        withCredentials: true
      });
      setAdmins(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch admins:", err.response?.data);
      setError("Failed to load admin requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when tabs change
  useEffect(() => {
    fetchAdmins();
    // 🔍 NEW: Clear the search query when switching tabs
    setSearchQuery('');
  }, [activeTab, adminCollegeId]);

  // Handle Approve
  const handleApprove = async (userId, userName) => {
    setProcessingId(userId);
    try {
      await axios.put(`/api/admin/memberships/${userId}/verify`, {}, { withCredentials: true });
      setAdmins(prev => prev.filter(m => m._id !== userId));
    } catch (err) {
      alert(`Failed to approve ${userName}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject / Remove
  const handleReject = async (userId, userName) => {
    const action = activeTab === 'pending' ? 'reject' : 'remove';
    if (!window.confirm(`Are you sure you want to ${action} ${userName} as an admin?`)) return;

    setProcessingId(userId);
    try {
      await axios.delete(`/api/admin/memberships/${userId}`, { withCredentials: true });
      setAdmins(prev => prev.filter(m => m._id !== userId));
    } catch (err) {
      alert(`Failed to ${action} ${userName}`);
    } finally {
      setProcessingId(null);
    }
  };

  // 🔍 NEW: Derived state for filtering the list based on search
  const filteredAdmins = admins.filter(admin => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      admin.name.toLowerCase().includes(query) || 
      admin.email.toLowerCase().includes(query)
    );
  });

  if (!adminCollegeId) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl m-8 font-medium">
        No active college network found for your account.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Management
        </h1>
        <p className="text-slate-500 mt-1">
          Review and manage co-administrator access for your institution.
        </p>
      </div>

      {/* 🔍 NEW: Unified Controls Bar (Tabs + Search) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        
        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'pending' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'verified' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active Admins
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all shadow-sm"
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

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        
        {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-medium border-b border-red-100">{error}</div>}

        {isLoading ? (
          <div className="py-32 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        ) : admins.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No admins found</h3>
            <p className="text-sm text-slate-500">There are no {activeTab} admin requests to show right now.</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          /* 🔍 NEW: Empty state for when the search finds no matches */
          <div className="py-32 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No matches found</h3>
            <p className="text-sm text-slate-500">We couldn't find anyone matching "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="mt-4 text-sm font-bold text-orange-600 hover:text-orange-700">Clear Search</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Admin Details</th>
                  <th className="px-6 py-4">Network Role</th>
                  <th className="px-6 py-4">Professional Title</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 🔍 NEW: Map over filteredAdmins instead of admins */}
                {filteredAdmins.map((admin) => {
                  
                  // Safely extract their actual role for this specific college
                  const membershipData = admin.memberships?.find(m => 
                    (typeof m.college === 'object' ? m.college._id : m.college) === adminCollegeId
                  );
                  const isSuperAdmin = membershipData?.role === 'super_admin';
                  
                  // Self-Guard: Check if this row is the currently logged-in user
                  const isSelf = admin._id === user._id;

                  return (
                    <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Avatar & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold uppercase overflow-hidden shrink-0">
                            {admin.avatar ? <img src={admin.avatar} className="w-full h-full object-cover" alt="" /> : admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {admin.name} {isSelf && <span className="text-slate-400 font-normal ml-1">(You)</span>}
                            </p>
                            <p className="text-xs text-slate-500">{admin.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Dynamic Role Badge */}
                      <td className="px-6 py-4">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white border border-slate-800">
                            Admin
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 font-medium">
                          {admin.position || <span className="text-slate-400 italic">Not specified</span>}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Only show Approve if in Pending tab */}
                          {activeTab === 'pending' && (
                            <button
                              onClick={() => handleApprove(admin._id, admin.name)}
                              disabled={processingId === admin._id}
                              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              {processingId === admin._id ? '...' : 'Approve'}
                            </button>
                          )}

                          {/* Render Reject/Remove button, UNLESS it's the current user */}
                          {!isSelf ? (
                            <button
                              onClick={() => handleReject(admin._id, admin.name)}
                              disabled={processingId === admin._id || isSuperAdmin} 
                              title={isSuperAdmin ? "Super Admins cannot be removed" : ""}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                activeTab === 'pending' 
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                              }`}
                            >
                              {processingId === admin._id ? '...' : (activeTab === 'pending' ? 'Reject' : 'Remove')}
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 italic px-2">Active Session</span>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;