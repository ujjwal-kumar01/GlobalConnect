import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const SidebarItem = ({ icon, label, path, isActive }) => {
  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
          ? 'bg-orange-50 text-orange-500'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useUser();

  // 1. Determine active role (fallback to 'student' if undefined)
  const role = user?.activeMembership?.role || 'student';
  const isSuperAdmin = role === 'super_admin';

  // 2. Dynamically build the configuration based on the role
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
        // { icon: '💼', label: 'Post Job', path: '/admin/post-job' },
        { icon: '🎓', label: 'Manage Students', path: '/admin/MemberManagement' },
        { icon: '👥', label: 'Manage Recruiter', path: '/admin/RecruiterManagement' },
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
        { icon: '💬', label: 'Messages', path: '/recruiter/messages' },
        { icon: '🏫', label: 'Join College', path: '/recruiter/join-college' },
      ];
    }
    else {
      // Default for 'student' and 'alumni'
      config.portalName = role === 'alumni' ? 'Alumni Portal' : 'Student Portal';
      config.basePath = '/student'; // Using the same base path for both

      // Base items everyone gets
      config.navItems = [
        { icon: '🎛️', label: 'Dashboard', path: `${config.basePath}/dashboard` },
        { icon: '👥', label: 'Alumni', path: `${config.basePath}/alumni` },
        { icon: '💬', label: 'Messages', path: `${config.basePath}/messages` },
      ];

      // 🔥 STUDENTS ONLY: Apply for Jobs
      if (role === 'student') {
        config.navItems.push(
          { icon: '💼', label: 'Jobs', path: `${config.basePath}/jobs` },
          { icon: '📄', label: 'Applications', path: `${config.basePath}/MyApplications` },
        );
      }

      // 🔥 ALUMNI ONLY: Post Jobs & View Applicants
      if (role === 'alumni') {
        config.navItems.push(
          { icon: '📢', label: 'Post Job', path: `${config.basePath}/post-jobs` },
          { icon: '📄', label: 'Job Applicants', path: `${config.basePath}/JobApplicants` }
        );
      }

      // Add the rest of the items for both roles
      config.navItems.push(
        { icon: '📈', label: 'Activity', path: `${config.basePath}/activity` },
        { icon: '🔔', label: 'Notifications', path: `${config.basePath}/notifications` }
      );
    }

    return config;
  }, [role, isSuperAdmin]);

  // 3. Account items dynamically use the generated base path
  const accountItems = [
    { icon: '👤', label: 'Profile', path: `/account/profile` }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0">

      {/* Logo Area */}
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

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">

        {/* Main Nav */}
        <div className="space-y-1">
          {navItems.map((item) => {
            // Check if active: matches exact path, OR is the root/dashboard path
            const isActive = location.pathname === item.path || (location.pathname === basePath && item.path === `${basePath}/dashboard`);
            return (
              <SidebarItem
                key={item.label}
                {...item}
                isActive={isActive}
              />
            );
          })}
        </div>

        {/* Account Nav */}
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