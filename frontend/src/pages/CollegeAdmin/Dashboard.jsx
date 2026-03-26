// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';

// --- Reusable Sub-Components ---

const StatCard = ({ icon, title, value, trend, isPositive, iconBg }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconBg}`}>
        {icon}
      </div>
      <span className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {trend} {isPositive ? '↗' : '↘'}
      </span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const ActivityItem = ({ title, desc, time, dotColor }) => (
  <div className="relative pl-6 pb-6 last:pb-0 group">
    <div className="absolute left-0 top-2 bottom-0 w-px bg-slate-200 group-last:bg-transparent"></div>
    <div className={`absolute left-[-4px] top-2 w-2 h-2 rounded-full ring-4 ring-white ${dotColor}`}></div>
    <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{desc}</p>
    <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">{time}</span>
  </div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  const [data, setData] = useState({ stats: [], recommendations: [], activities: [] });
  const [isLoading, setIsLoading] = useState(true);
  const {user}= useUser();
  const displayName = user?.fullName || user?.name || "Guest User";

  // Fallback Mock Data (matches your UI perfectly)
  const mockData = {
    stats: [
      { id: 1, icon: "👥", title: "Total Connections", value: "1,284", trend: "+12%", isPositive: true, iconBg: "bg-blue-50 text-blue-500" },
      { id: 2, icon: "📄", title: "Job Applications", value: "24", trend: "+3%", isPositive: true, iconBg: "bg-red-50 text-red-500" },
      { id: 3, icon: "💬", title: "Unread Messages", value: "12", trend: "-5%", isPositive: false, iconBg: "bg-orange-50 text-orange-500" },
      { id: 4, icon: "👁️", title: "Profile Views", value: "450", trend: "+18%", isPositive: true, iconBg: "bg-purple-50 text-purple-500" }
    ],
    recommendations: [
      { id: 1, initial: "GS", bg: "bg-orange-100 text-orange-600", role: "Senior Product Designer", company: "Global Solutions Inc. • San Francisco, CA", time: "2h ago", isNew: true },
      { id: 2, icon: "🚀", bg: "bg-blue-100 text-blue-600", role: "Frontend Engineer (React)", company: "Startup Lab • London, UK (Remote)", time: "5h ago", isNew: false },
      { id: 3, icon: "📁", bg: "bg-stone-100 text-stone-600", role: "Data Scientist", company: "DataViz Tech • New York, NY", time: "1d ago", isNew: false }
    ],
    activities: [
      { id: 1, dotColor: "bg-orange-500", title: "Job Application Submitted", desc: 'You applied for "Full Stack Developer" at TechFlow.', time: "10 minutes ago" },
      { id: 2, dotColor: "bg-blue-500", title: "New Connection", desc: "Sarah Miller accepted your connection request.", time: "2 hours ago" },
      { id: 3, dotColor: "bg-yellow-400", title: "Profile Viewed", desc: "A recruiter from Innovate Lab viewed your profile.", time: "5 hours ago" },
      { id: 4, dotColor: "bg-slate-300", title: "Milestone Reached", desc: "You reached 1,000 profile views this month!", time: "Yesterday" }
    ]
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Attempt to fetch from your actual backend port 8000
        const [statsRes, recsRes, actsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/dashboard/stats'),
          axios.get('http://localhost:8000/api/dashboard/recommendations'),
          axios.get('http://localhost:8000/api/dashboard/activities')
        ]);
        
        setData({
          stats: statsRes.data,
          recommendations: recsRes.data,
          activities: actsRes.data
        });
      } catch (error) {
        console.warn('API not ready yet, loading mock UI data...', error);
        setData(mockData); // Fallback to design data
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back, {displayName}. Here's what's happening in your network today.</p>
      </div>

      {/* Stats Grid - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map(stat => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Recommended & CTA) spans 2 cols on extra-large screens */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Recommended List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recommended for You</h2>
              <button className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">See all</button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {data.recommendations.map(rec => (
                <div key={rec.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${rec.bg}`}>
                      {rec.initial || rec.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{rec.role}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{rec.company}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {rec.isNew && (
                      <span className="block w-fit ml-auto px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md mb-1.5">New</span>
                    )}
                    <p className="text-xs text-slate-400">{rec.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coral CTA Banner */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-8 rounded-2xl shadow-lg relative overflow-hidden flex flex-col items-start">
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-orange-400 rounded-full opacity-40 blur-2xl pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Connect with Alumni</h2>
            <p className="text-orange-50 text-sm max-w-sm mb-6 relative z-10 leading-relaxed">
              Expand your network by reaching out to alumni from your graduating class and industry.
            </p>
            <button className="bg-white text-orange-600 font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors relative z-10">
              Find People
            </button>
          </div>
        </div>

        {/* Right Column (Activity Timeline & Network Strength) */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              
              <div className="pt-2">
                {data.activities.map(act => (
                  <ActivityItem key={act.id} {...act} />
                ))}
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <button className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                  View Full History
                </button>
              </div>
            </div>
          </div>

          {/* Network Strength Placeholder Card (Bottom Right) */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
             <h3 className="text-sm font-bold text-white mb-4">Network Strength</h3>
             {/* Mocking the little orange bar chart seen in the design */}
             <div className="flex items-end gap-2 h-16 mt-4">
               <div className="w-1/5 bg-orange-600/50 rounded-t-sm h-1/3"></div>
               <div className="w-1/5 bg-orange-500 rounded-t-sm h-2/3"></div>
               <div className="w-1/5 bg-orange-500 rounded-t-sm h-full"></div>
               <div className="w-1/5 bg-orange-400 rounded-t-sm h-4/5"></div>
               <div className="w-1/5 bg-orange-600/50 rounded-t-sm h-1/2"></div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;