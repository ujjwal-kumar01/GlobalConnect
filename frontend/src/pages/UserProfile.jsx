import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom'; // 🔥 Added useNavigate
import { useUser } from '../context/UserContext';

// Reusable Input Component
const EditInput = React.forwardRef(({ icon, ...props }, ref) => (
  <div className="relative">
    {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
    <input 
      ref={ref} 
      {...props} 
      className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all`} 
    />
  </div>
));

const UserProfile = () => {
  const { user, refreshUser } = useUser();
  const { userId } = useParams(); 
  const navigate = useNavigate(); // 🔥 Hook for navigation
  
  // Profile Target States
  const [targetUser, setTargetUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  
  // States for Notifications, Skills, and Avatar Upload
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Image Upload States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  // 1. Fetch Profile Logic
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setServerError('');

      try {
        if (userId && user && userId !== user._id) {
          setIsOwnProfile(false);
          setIsEditing(false); 
          
          const response = await axios.get(`/api/user/${userId}`, { withCredentials: true });
          setTargetUser(response.data.data);
          setSkills(response.data.data?.skills || []);
        } else if (user) {
          setIsOwnProfile(true);
          setTargetUser(user);
          setSkills(user.skills || []);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setServerError("Failed to load profile data.");
        setTargetUser(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [userId, user]);

  // 2. Initialize form 
  useEffect(() => {
    if (targetUser && isOwnProfile) {
      reset({
        name: targetUser.name || '',
        bio: targetUser.bio || '',
        location: targetUser.location || '',
        company: targetUser.company || '',
        position: targetUser.position || '',
        github: targetUser.github || '',
        linkedin: targetUser.linkedin || '',
        graduationYear: targetUser.graduationYear || '',
        branch: targetUser.branch || '',
      });
      setSkills(targetUser.skills || []);
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [targetUser, reset, isEditing, isOwnProfile]);

  // Handle Local Image Preview
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle adding/removing skills
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    if(!isEditing) return;
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Submit Profile Updates
  const onSubmit = async (data) => {
    if (!isOwnProfile) return;

    setServerError('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key]) formData.append(key, data[key]);
      });
      formData.append('skills', JSON.stringify(skills));
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await axios.put('/api/user/profile', formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      await refreshUser(true); 
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false); 
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (isLoadingProfile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-10 w-10 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Profile Not Found</h2>
        <p className="text-slate-500">The user you are looking for does not exist or is unavailable.</p>
      </div>
    );
  }

  const InfoLabel = ({ children }) => <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>;
  const ViewText = ({ children, icon }) => (
    <div className="flex items-center gap-2.5 text-sm text-slate-800 font-medium min-h-[36px]">
      {icon && <span className="text-orange-400 shrink-0">{icon}</span>}
      {children || <span className="italic text-slate-400">Not specified</span>}
    </div>
  );

  const displayAvatar = avatarPreview || targetUser.avatar;

  return (
    <div className="min-h-screen bg-slate-50/50 py-4 sm:py-6 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Header Navigation */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">
            {isOwnProfile ? "Your Profile Center" : `${targetUser.name}'s Profile`}
          </h1>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 🔥 NEW: Message Button for Other Users */}
            {!isOwnProfile && (
                <button 
                  onClick={() => navigate(`/messages`, { 
                    state: { 
                      preselectedUser: {
                        _id: targetUser._id,
                        name: targetUser.name,
                        avatar: targetUser.avatar
                      } 
                    } 
                  })}
                  className="px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  Message
                </button>
            )}

            {isOwnProfile && (
              <div className="flex items-center gap-2 sm:gap-3">
                {isEditing ? (
                  <>
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" form="profileForm" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-70 flex items-center gap-2">
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {(serverError || successMsg) && (
          <div className={`mb-6 p-3 rounded-xl border ${serverError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-200'} text-sm font-medium`}>
            {serverError || successMsg}
          </div>
        )}

        {/* --- PROFILE HUB --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="h-24 sm:h-28 w-full bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-200"></div>
          
          <div className="px-6 sm:px-8 pb-6 text-left">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5 -mt-12 sm:-mt-14 mb-5">
              
              {/* Avatar Box */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shrink-0 shadow-md border border-slate-100">
                <div className="relative w-full h-full rounded-xl bg-orange-50 flex items-center justify-center text-4xl font-extrabold text-orange-600 uppercase border border-orange-100 shadow-inner overflow-hidden group">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    targetUser.name?.charAt(0) || '?'
                  )}
                  
                  {isEditing && isOwnProfile && (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span className="text-[10px] font-bold">Change</span>
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Name, Role, College, and Email Info */}
              <div className="flex-1 space-y-1.5 pb-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{targetUser.name}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                    {targetUser.activeMembership?.role || "Member"}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                  {/* College */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
                    <span>{targetUser.activeMembership?.college?.name || "Global Connect Network"}</span>
                  </div>
                  
                  {/* Email Display */}
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <span>{targetUser.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <ViewText icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}>
                {targetUser.location}
              </ViewText>
              
              <ViewText icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>}>
                {targetUser.linkedin ? <a href={targetUser.linkedin} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">LinkedIn Profile</a> : "LinkedIn Not Linked"}
              </ViewText>

              <ViewText icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>}>
                {targetUser.github ? <a href={targetUser.github} target="_blank" rel="noreferrer" className="text-slate-900 hover:underline">GitHub Portfolio</a> : "GitHub Not Linked"}
              </ViewText>
            </div>
          </div>
        </div>

        {/* --- DETAILED CONTENT --- */}
        <form id="profileForm" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
          
          {/* LEFT: About & Skills */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                Professional Biography
              </h3>
              {isEditing ? (
                <textarea {...register("bio")} rows="4" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-700 text-sm resize-none leading-relaxed" placeholder="Briefly describe your professional journey..."></textarea>
              ) : (
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{targetUser.bio || <span className="italic text-slate-400">No bio provided yet.</span>}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Core Competencies
              </h3>
              
              {isEditing && (
                <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(e)} className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 text-sm" placeholder="e.g., Python, UI Design" />
                  <button type="button" onClick={handleAddSkill} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">Add</button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {skill}
                      {isEditing && (
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 italic">No specific skills listed.</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Details & Social Links */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Detailed Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <InfoLabel>Current Job Title</InfoLabel>
                {isEditing ? (
                  <EditInput {...register("position")} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>} placeholder="e.g. Senior Software Engineer" />
                ) : (
                  <ViewText>{targetUser.position}</ViewText>
                )}
              </div>
              <div className="space-y-2">
                <InfoLabel>Organization / Company</InfoLabel>
                {isEditing ? (
                  <EditInput {...register("company")} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>} placeholder="e.g. Acme Tech Inc." />
                ) : (
                  <ViewText>{targetUser.company}</ViewText>
                )}
              </div>
            </div>

            {targetUser.activeMembership?.role !== 'recruiter' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">Academic Background</h4>
                <div className="space-y-2">
                  <InfoLabel>Department / Branch</InfoLabel>
                  {isEditing ? (
                    <EditInput {...register("branch")} placeholder="e.g. Computer Science Engineering" />
                  ) : (
                    <ViewText>{targetUser.branch}</ViewText>
                  )}
                </div>
                <div className="space-y-2">
                  <InfoLabel>Year of Graduation</InfoLabel>
                  {isEditing ? (
                    <EditInput type="number" {...register("graduationYear")} placeholder="e.g. 2024" />
                  ) : (
                    <ViewText>{targetUser.graduationYear}</ViewText>
                  )}
                </div>
              </div>
            )}
            
            {isEditing && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900">Social Links & Basics</h4>
                    <div className="space-y-2">
                        <InfoLabel>Display Name</InfoLabel>
                        <EditInput {...register("name", { required: "Name is required" })} placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                        <InfoLabel>Profile Location</InfoLabel>
                        <EditInput {...register("location")} placeholder="City, Country" />
                    </div>
                    <div className="space-y-2">
                        <InfoLabel>LinkedIn URL</InfoLabel>
                        <EditInput {...register("linkedin")} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="space-y-2">
                        <InfoLabel>GitHub URL</InfoLabel>
                        <EditInput {...register("github")} placeholder="https://github.com/..." />
                    </div>
                </div>
            )}
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default UserProfile;