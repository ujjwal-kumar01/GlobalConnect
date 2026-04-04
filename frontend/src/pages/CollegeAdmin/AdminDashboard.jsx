import React, { useState, useEffect, useRef } from 'react'; // 🔥 Added useRef
import axios from 'axios';
import { useUser } from '../../context/UserContext';

// --- Reusable UI Components ---

const StatCard = ({ icon, title, value, trend, isPositive, iconBg }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconBg}`}>{icon}</div>
      <span className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const PostCard = ({ post, onReadMore, onDelete, currentUserId }) => {
  const isAuthor = post.author?._id === currentUserId || post.author === currentUserId;

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative">
      {isAuthor && (
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            onDelete(post._id);
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-md hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-slate-100"
          title="Delete Post"
        >
          ✕
        </button>
      )}

      <div onClick={() => onReadMore(post)} className="cursor-pointer flex-1 flex flex-col text-left">
        {post.image && (
          <div className="h-44 overflow-hidden relative">
            <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
              {post.type}
            </span>
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{post.title}</h3>
          <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed">{post.content}</p>
          <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">🎓</div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button className="text-orange-500 font-black text-[10px] uppercase tracking-widest hover:underline">
              Read More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useUser();
  const isAdmin = user?.activeMembership?.role === 'admin' || user?.activeMembership?.role === 'super_admin';
  const displayName = user?.fullName || user?.name || "Guest User";
  const collegeName = user?.activeMembership?.college?.name || "Community";

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ members: 0, recruiters: 0, broadcasts: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postForm, setPostForm] = useState({ title: '', content: '', type: 'news' });
  const [postImage, setPostImage] = useState(null);

  // 🔥 Reference to clear the input value
  const fileInputRef = useRef(null);

  const fetchPosts = async (page) => {
    try {
      const res = await axios.get(`/api/user/college-posts?page=${page}&limit=6`, { withCredentials: true });
      setPosts(res.data.data.posts || []);
      setPagination(res.data.data.pagination || {});
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats/overview', { withCredentials: true });
      setStats(res.data.data);
    } catch (err) {
      setStats({ members: "2,450", recruiters: "128", broadcasts: "0", pending: "12" });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPosts(1), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) fetchPosts(currentPage);
  }, [currentPage]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) return;
    setIsPublishing(true);
    const formData = new FormData();
    Object.keys(postForm).forEach(key => formData.append(key, postForm[key]));
    if (postImage) formData.append('image', postImage);

    try {
      await axios.post('/api/admin/create-post', formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentPage(1);
      await fetchPosts(1);
      setPostForm({ title: '', content: '', type: 'news' });
      clearImageSelection(); // 🔥 Clear on success
      alert("Broadcast successful!");
    } catch (err) { alert("Failed to publish."); } 
    finally { setIsPublishing(false); }
  };

  // 🔥 Function to handle removal of image and resetting input
  const clearImageSelection = () => {
    setPostImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Manually reset input string so onChange triggers again
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      await axios.delete(`/api/admin/posts/${postId}`, { withCredentials: true });
      setPosts(posts.filter(p => p._id !== postId));
      fetchStats();
    } catch (err) { alert("Failed to delete post."); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 text-left relative">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isAdmin ? "Admin Control Center" : "Campus Feed"}
          </h1>
          <p className="text-slate-500 font-medium">
            Welcome, <span className="text-orange-500 font-bold">{displayName}</span>. 
            {isAdmin ? " Manage your institution's broadcasts here." : " Catch up with what's happening at your college."}
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{collegeName}</span>
        </div>
      </div>

      {/* 2. STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="👥" title="College Members" value={stats.members} trend="Total" isPositive={true} iconBg="bg-blue-50 text-blue-500" />
        <StatCard icon="💼" title="Verified Recruiters" value={stats.recruiters} trend="Active" isPositive={true} iconBg="bg-emerald-50 text-emerald-500" />
        <StatCard icon="📢" title="Active Broadcasts" value={pagination.totalPosts || 0} trend="Live" isPositive={true} iconBg="bg-orange-50 text-orange-500" />
        <StatCard icon="🛡️" title="Pending Approval" value={stats.pending} trend="Action Required" isPositive={false} iconBg="bg-purple-50 text-purple-500" />
      </div>

      {/* 3. HIGHLIGHTS & PAGINATION */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight px-2">Campus Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post._id} post={post} onReadMore={setSelectedPost} onDelete={handleDeletePost} currentUserId={user?._id} />
          ))}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button disabled={!pagination.hasPrevPage} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-30">Previous</button>
            <span className="text-xs font-black text-slate-400">{pagination.currentPage} / {pagination.totalPages}</span>
            <button disabled={!pagination.hasNextPage} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-30">Next</button>
          </div>
        )}
      </section>

      {/* 4. ADMIN BROADCAST & SIDEBAR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          {isAdmin && (
            <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-xl shadow-orange-500/5">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span className="bg-orange-500 text-white p-1 rounded-lg text-lg">✍️</span> Broadcast a New Update
              </h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                
                {/* Live Image Preview */}
                {postImage && (
                  <div className="relative w-full h-48 mb-4 rounded-2xl overflow-hidden border-2 border-orange-100 group">
                    <img src={URL.createObjectURL(postImage)} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={clearImageSelection} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <input placeholder="Post Headline" value={postForm.title} onChange={(e) => setPostForm({...postForm, title: e.target.value})} className="bg-slate-50 border-none rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20" />
                  <select value={postForm.type} onChange={(e) => setPostForm({...postForm, type: e.target.value})} className="bg-slate-50 border-none rounded-xl px-4 text-sm font-bold outline-none cursor-pointer">
                    <option value="news">Campus News</option>
                    <option value="event">Event</option>
                    <option value="blog">Blog Post</option>
                  </select>
                </div>
                <textarea placeholder="Share the details..." value={postForm.content} onChange={(e) => setPostForm({...postForm, content: e.target.value})} rows="3" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 resize-none text-left" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-600">
                    {postImage ? "Change Image" : "🖼️ Add Cover Photo"}
                    <input 
                       ref={fileInputRef} 
                       type="file" 
                       className="hidden" 
                       accept="image/*" 
                       onChange={(e) => setPostImage(e.target.files[0])} 
                    />
                  </label>
                  <button disabled={isPublishing} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-orange-500 transition-all active:scale-95">
                    {isPublishing ? "Publishing..." : "Publish Post"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        <div className="xl:col-span-1">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-white font-black text-lg mb-4 text-left">Network Growth</h3>
            <div className="flex items-end gap-2 h-20 mb-6">
              {[30, 50, 40, 80, 60, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-orange-500 rounded-t-lg" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <button className="w-full bg-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Invite Peers</button>
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
              <button onClick={() => setSelectedPost(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-900">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 text-left">
              {selectedPost.image && (
                <div className="w-full bg-slate-100 rounded-3xl mb-8 overflow-hidden flex justify-center items-center max-h-[400px] border border-slate-100">
                  <img src={selectedPost.image} className="max-w-full max-h-[400px] object-contain shadow-sm" alt="Post cover" />
                </div>
              )}
              <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">{selectedPost.title}</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{selectedPost.content}</p>
            </div>

            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">🎓</div>
              <div>
                <p className="text-xs font-black text-slate-900">{collegeName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Official Post</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedPost(null)}></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;