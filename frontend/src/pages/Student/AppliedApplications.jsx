import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';

const StudentApplications = () => {
  const { user } = useUser();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchMyApplications = async () => {
      setIsLoading(true);
      try {
        // Fetch applications populated with job details
        const response = await axios.get('/api/jobs/my-applications', { withCredentials: true });
        setApplications(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
        setError("Failed to load your applications. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyApplications();
  }, []);

  // Filter applications based on selected status tab
  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  // Helper for Badge Colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200'; // pending
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Applications
        </h1>
        <p className="text-slate-500 mt-1">
          Track the status of the campus jobs you've applied for.
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>}

      {/* Custom Tabs for Filtering */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar">
        {['all', 'pending', 'shortlisted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`pb-4 px-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap capitalize ${
              statusFilter === status 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {status === 'all' ? 'All Applications' : status}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No applications yet</h3>
          <p className="text-slate-500 mb-6">You haven't applied to any campus jobs yet.</p>
          <Link to="/student/jobs" className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            Browse Jobs
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-slate-500 font-medium">No applications found with the status "{statusFilter}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div key={app._id} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Job Details */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-extrabold text-lg text-slate-600 uppercase shrink-0 border border-slate-100">
                  {app.job?.company ? app.job.company.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{app.job?.title || 'Job Unavailable'}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    <span className="text-slate-700 font-bold">{app.job?.company || 'Unknown Company'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{app.job?.location || 'Remote'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(app.status)}`}>
                  {app.status || 'Pending'}
                </span>
                
                {app.resume && (
                  <a 
                    href={app.resume} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    View Submitted Resume
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentApplications;