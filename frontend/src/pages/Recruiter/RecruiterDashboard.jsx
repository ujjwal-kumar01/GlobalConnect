import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useSocket } from '../../context/SocketContext';

// --- Reusable Sub-Components ---

const StatCard = ({ icon, title, value, trend, iconBg }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4 hover:shadow-md transition-all text-left">
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconBg}`}>{icon}</div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trend}</span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const CollegePostCard = ({ post, onClick }) => (
  <div 
    onClick={() => onClick(post)}
    className="min-w-[300px] max-w-[300px] bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col h-full"
  >
    <div className="relative h-32 mb-3 overflow-hidden rounded-xl bg-slate-100 text-left">
      {post.image ? (
        <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 font-bold uppercase text-[10px]">Campus Update</div>
      )}
      <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black uppercase text-orange-600">
        {post.type}
      </div>
    </div>
    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-500 transition-colors text-left">{post.title}</h4>
    <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-3 text-left">{post.content}</p>
    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50">
      <span className="text-[10px] font-bold text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Details →</span>
    </div>
  </div>
);

const RecruiterDashboard = () => {
  const { user } = useUser();
  const { notifications } = useSocket();
  const navigate = useNavigate();
  
  const [data, setData] = useState({ recommendations: [], posts: [] });
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ mainCount: 0, secondaryCount: 0, collegeCount: 0 });
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const companyName = user?.company || "Your Organization";
  const displayName = user?.fullName || user?.name || "Recruiter";

  const fetchDashboardData = async (page = 1) => {
    try {
      const [recsRes, postsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/dashboard/recommendations', { withCredentials: true }),
        axios.get(`http://localhost:8000/api/user/college-posts?page=${page}&limit=6`, { withCredentials: true }),
        axios.get('http://localhost:8000/api/user/stats/user-overview', { withCredentials: true })
      ]);

      setData({
        recommendations: recsRes.data.data || [],
        posts: postsRes.data.data.posts || []
      });
      setPagination(postsRes.data.data.pagination || {});
      // stats.mainCount = Active Jobs, stats.secondaryCount = Total Applicants
      setStats(statsRes.data.data || { mainCount: 0, secondaryCount: 0, collegeCount: "2.5k+" });
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(currentPage);
  }, [currentPage]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6 relative text-left font-sans">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-orange-500 font-bold text-xs uppercase tracking-[0.2em]">Recruitment Hub</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">Welcome, {displayName.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-2 font-medium">
            Managing talent acquisition for <span className="text-slate-900 font-bold">{companyName}</span>.
          </p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm px-5 flex items-center gap-3 w-fit">
           <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hiring Mode Active</span>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            icon="📢" 
            title="Active Job Posts" 
            value={stats.mainCount} 
            trend="Live Openings" 
            iconBg="bg-blue-50 text-blue-600" 
        />
        
        <StatCard 
            icon="👥" 
            title="Total Applicants" 
            value={stats.secondaryCount} 
            trend="All Time" 
            iconBg="bg-orange-50 text-orange-600" 
        />

        <StatCard 
            icon="💬" 
            title="Unread Inquiries" 
            value={notifications.length} 
            trend={notifications.length > 0 ? "Response Needed" : "Inbox Clear"} 
            iconBg="bg-emerald-50 text-emerald-600" 
        />

        <StatCard 
            icon="🎓" 
            title="Campus Talent Pool" 
            value={stats.collegeCount} 
            trend="Verified Students" 
            iconBg="bg-purple-50 text-purple-600" 
        />
      </div>

      {/* 3. Campus Highlights / Placement News */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Placement Cell Updates <span className="text-orange-500 text-sm font-bold uppercase tracking-widest">Official</span>
          </h2>
          <div className="flex items-center gap-2">
            <button 
                disabled={!pagination.hasPrevPage} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 bg-white border border-slate-100 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
                ←
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Page {pagination.currentPage}</span>
            <button 
                disabled={!pagination.hasNextPage} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 bg-white border border-slate-100 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
                →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.posts.length > 0 ? data.posts.map(post => (
            <CollegePostCard key={post._id} post={post} onClick={setSelectedPost} />
          )) : (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] py-12 text-center text-slate-400 italic font-medium">
              No recent campus updates from the placement cell.
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        <div className="xl:col-span-2 space-y-10">
          {/* 4. RECOMMENDED CANDIDATES SECTION */}
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-5">
              Top Potential Candidates
            </h2>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {data.recommendations.map(rec => (
                <div key={rec.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div 
                      onClick={() => navigate(`/profile/${rec.id}`)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner cursor-pointer overflow-hidden bg-slate-100 ${rec.bg}`}
                    >
                      {rec.avatar ? <img src={rec.avatar} className="w-full h-full object-cover" alt="" /> : (rec.name?.charAt(0) || rec.initial)}
                    </div>
                    <div>
                      <h4 onClick={() => navigate(`/profile/${rec.id}`)} className="text-md font-bold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer">
                        {rec.name || "Student Name"}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">{rec.role} • Class of 2026</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/messages`, { state: { preselectedUser: { _id: rec.id, name: rec.name, avatar: rec.avatar } } })}
                      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </button>
                    <button onClick={() => navigate(`/profile/${rec.id}`)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl hover:bg-orange-600 transition-all">
                      View CV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner CTA */}
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl transition-all group-hover:bg-orange-500/20"></div>
            <div className="relative z-10 max-w-lg">
              <h2 className="text-3xl font-black text-white mb-4 leading-tight">
                Scale Your Engineering Team
              </h2>
              <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed opacity-80">
                Instantly post new career opportunities, internships, or full-time roles to the IIIT Una student and alumni portal.
              </p>
              <button 
                onClick={() => navigate("/recruiter/post-jobs")} 
                className="bg-orange-500 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-white hover:text-slate-900 transition-all active:scale-95 uppercase text-xs tracking-widest"
              >
                Post a Job Now
              </button>
            </div>
          </div>
        </div>

        {/* 5. Right Column: Static Recruitment Outlook */}
        <div className="xl:col-span-1 space-y-10">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                   Industry Demand
                </h3>
                <span className="text-orange-500 font-black text-xs">Trending</span>
             </div>
             
             {/* Progress Visualization */}
             <div className="space-y-5">
                {[
                  { label: "Frontend (React/Next)", val: 85 },
                  { label: "Backend (Node/Go)", val: 94 },
                  { label: "DevOps & Cloud", val: 72 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900">High Demand</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-900 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${item.val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="mt-10 pt-8 border-t border-slate-50">
               <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                 "Hiring is the most important thing you do. You are the average of the people you hire."
               </p>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                 — Sam Altman
               </p>
             </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-xl">
             <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 text-orange-500">Recruiter Tip</h3>
             <p className="text-slate-400 text-xs font-medium leading-loose">
               Shortlisting candidates with verified GitHub repositories and branch-specific certifications significantly reduces time-to-hire.
               <br/><br/>
               Use the "Message" feature to schedule quick virtual screening calls directly.
             </p>
          </div>
        </div>
      </div>

      {/* READ MORE MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase rounded-full">{selectedPost.type}</span>
                <span className="text-[10px] font-bold text-slate-400">{new Date(selectedPost.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <button onClick={() => setSelectedPost(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
              {selectedPost.image && (
                <div className="w-full bg-slate-100 rounded-3xl mb-8 overflow-hidden flex justify-center items-center max-h-[400px]">
                  <img src={selectedPost.image} className="max-w-full max-h-[400px] object-contain shadow-sm" alt="Post cover" />
                </div>
              )}
              <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">{selectedPost.title}</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{selectedPost.content}</p>
            </div>
            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">🎓</div>
              <div>
                <p className="text-xs font-black text-slate-900">Placement Cell</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Campus Recruitment Update</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedPost(null)}></div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;