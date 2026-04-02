import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useSocket } from '../../context/SocketContext';

const SidebarItem = ({ icon, label, path, isActive, notificationCount }) => {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 relative ${isActive
          ? 'bg-orange-50 text-orange-500'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <span className="text-sm">{label}</span>
      
      {notificationCount > 0 && (
        <span className="absolute right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          {notificationCount}
        </span>
      )}
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useUser();
  const { notifications } = useSocket(); 

  const role = user?.activeMembership?.role || 'student';
  const isSuperAdmin = role === 'super_admin';

  const { portalName, basePath, navItems } = useMemo(() => {
    let config = {
      portalName: 'Student Portal',
      basePath: '/student',
      navItems: []
    };

    if (role === 'admin' || role === 'super_admin') {
      config.portalName = 'Admin Portal';
      config.basePath = '/admin';
      config.navItems = [
        { icon: '🎛️', label: 'Dashboard', path: '/admin/dashboard' },
        { icon: '🎓', label: 'Manage Students', path: '/admin/MemberManagement' },
        { icon: '👥', label: 'Manage Recruiter', path: '/admin/RecruiterManagement' },
        // 💬 Messages removed for Admins
      ];
      if (isSuperAdmin) {
        config.navItems.push({ icon: '🛡️', label: 'Manage Admins', path: '/admin/manage-admins' });
      }
    }
    else if (role === 'recruiter') {
      config.portalName = 'Recruiter Portal';
      config.basePath = '/recruiter';
      config.navItems = [
        { icon: '🎛️', label: 'Dashboard', path: '/recruiter/dashboard' },
        { icon: '💼', label: 'Post Jobs', path: '/recruiter/post-jobs' },
        { icon: '🎓', label: 'Job Applicants', path: '/recruiter/JobApplicants' },
        // 💬 Messages removed for Recruiters
        { icon: '🏫', label: 'Join College', path: '/recruiter/join-college' },
      ];
    }
    else {
      config.portalName = role === 'alumni' ? 'Alumni Portal' : 'Student Portal';
      config.basePath = '/student'; 

      config.navItems = [
        { icon: '🎛️', label: 'Dashboard', path: `${config.basePath}/dashboard` },
        { icon: '👥', label: 'Alumni', path: `${config.basePath}/alumni` },
        { icon: '💬', label: 'Messages', path: '/messages' }, // ✅ Kept for Students/Alumni
      ];

      if (role === 'student') {
        config.navItems.push(
          { icon: '💼', label: 'Jobs', path: `${config.basePath}/jobs` },
          { icon: '📄', label: 'Applications', path: `${config.basePath}/MyApplications` },
        );
      }

      if (role === 'alumni') {
        config.navItems.push(
          { icon: '📢', label: 'Post Job', path: `${config.basePath}/post-jobs` },
          { icon: '📄', label: 'Job Applicants', path: `${config.basePath}/JobApplicants` }
        );
      }

      config.navItems.push(
        { icon: '📈', label: 'Activity', path: `${config.basePath}/activity` },
        { icon: '🔔', label: 'Notifications', path: `${config.basePath}/notifications` }
      );
    }

    return config;
  }, [role, isSuperAdmin]);

  const accountItems = [
    { icon: '👤', label: 'Profile', path: `/account/profile` }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0">
      <div className="h-20 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-tight tracking-tight">Global Connect</span>
            <span className="text-[9px] font-bold text-orange-500 tracking-widest uppercase mt-0.5">{portalName}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname === basePath && item.path === `${basePath}/dashboard`);
            
            const isMessageTab = item.path === '/messages';
            const unreadCount = isMessageTab ? notifications?.length || 0 : 0;

            return (
              <SidebarItem
                key={item.label}
                {...item}
                isActive={isActive}
                notificationCount={unreadCount} 
              />
            );
          })}
        </div>

        <div className="space-y-1 pt-2">
          <p className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Account</p>
          {accountItems.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;