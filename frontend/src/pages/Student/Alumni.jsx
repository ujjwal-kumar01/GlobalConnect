// src/pages/AlumniDirectory.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // 🔥 IMPORT useNavigate
import { useUser } from '../../context/UserContext'; 

// --- CUSTOM DROPDOWN COMPONENT ---
// (Keep your CustomDropdown exactly the same)
const CustomDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-50 border text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition-colors ${
          isOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-500"}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              !value ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            All {placeholder.split(' ')[0]}s
          </button>
          
          {options.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { onChange(option.toString()); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === option.toString() ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
// ---------------------------------

const AlumniDirectory = () => {
  const { user } = useUser(); 
  const navigate = useNavigate(); // 🔥 INITIALIZE useNavigate
  
  const [alumni, setAlumni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('All Alumni');

  const [filterYear, setFilterYear] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const bannerColors = [
    'bg-red-100',      
    'bg-blue-50',      
    'bg-emerald-50',   
    'bg-orange-50'     
  ];

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/student/allAlumni', { withCredentials: true });

        if (response.data.success) {
          setAlumni(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch alumni:", err);
        setError("Unable to load the alumni directory at this time.");
        // Fallback data removed for brevity in snippet, keep yours!
        setAlumni([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  const uniqueYears = [...new Set(alumni.map(a => a.graduationYear))].filter(Boolean).sort().reverse();
  const uniqueBranches = [...new Set(alumni.map(a => a.branch))].filter(Boolean).sort();
  const uniqueLocations = [...new Set(alumni.map(a => a.location))].filter(Boolean).sort();

  const filteredAlumni = useMemo(() => {
    return alumni.filter((person) => {
      const matchYear = filterYear ? person.graduationYear?.toString() === filterYear : true;
      const matchBranch = filterBranch ? person.branch === filterBranch : true;
      const matchLocation = filterLocation ? person.location === filterLocation : true;
      
      let matchTab = true;
      if (activeTab === 'My Classmates') {
        matchTab = user?.graduationYear ? person.graduationYear === user.graduationYear : false;
      } 
      else if (activeTab === 'Near Me') {
        matchTab = user?.location ? person.location === user.location : false;
      }

      return matchYear && matchBranch && matchLocation && matchTab;
    });
  }, [alumni, filterYear, filterBranch, filterLocation, activeTab, user]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Find Alumni</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Showing {filteredAlumni.length} {filteredAlumni.length === 1 ? 'graduate' : 'graduates'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/account/profile" 
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Update Profile
          </Link>
        </div>
      </div>

      {/* FILTER & TABS CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-8">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-2 hide-scrollbar">
          {['All Alumni', 'My Classmates', 'Near Me'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-4 text-sm font-bold transition-colors relative ${
                activeTab === tab ? 'text-orange-500' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* CUSTOM DROPDOWN FILTERS */}
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <CustomDropdown value={filterYear} onChange={setFilterYear} options={uniqueYears} placeholder="Graduation Year" />
          <CustomDropdown value={filterBranch} onChange={setFilterBranch} options={uniqueBranches} placeholder="Industry" />
          <CustomDropdown value={filterLocation} onChange={setFilterLocation} options={uniqueLocations} placeholder="Location" />
          
          <button 
            onClick={() => {
              setFilterYear('');
              setFilterBranch('');
              setFilterLocation('');
            }}
            className="sm:flex-none px-6 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Reset
          </button>
        </div>
      </div>

      {/* WARNING IF USER PROFILE IS INCOMPLETE */}
      {((activeTab === 'My Classmates' && !user?.graduationYear) || (activeTab === 'Near Me' && !user?.location)) && (
        <div className="p-4 mb-8 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-center font-medium flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Please <Link to="/account/profile" className="underline font-bold hover:text-orange-800">update your profile</Link> with your {activeTab === 'Near Me' ? 'location' : 'graduation year'} to use this feature.
        </div>
      )}

      {/* ERROR STATE */}
      {error && !isLoading && (
        <div className="p-4 mb-8 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-medium">{error}</div>
      )}

      {/* ALUMNI GRID */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-slate-500 font-medium">No alumni found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAlumni.map((person, index) => {
            const bannerColor = bannerColors[index % bannerColors.length];
            
            return (
              <div key={person._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                
                <div className={`h-24 w-full ${bannerColor} relative`}></div>

                <div className="px-6 relative flex justify-center mt-[-40px]">
                  <img 
                    src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=fdba74&color=c2410c`} 
                    alt={person.name}
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-sm bg-white"
                  />
                </div>

                <div className="p-6 pt-3 flex flex-col flex-1 text-center">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">{person.name}</h3>
                  <p className="text-xs font-bold text-orange-600 mb-5">
                    {person.position || 'Professional'} {person.company ? `at ${person.company}` : ''}
                  </p>

                  <div className="space-y-2 mb-6 text-sm text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7"></path></svg>
                      Class of {person.graduationYear || 'N/A'} • {person.branch || 'N/A'}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {person.location || 'Location Not Set'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mb-8 mt-auto">
                    {person.skills && person.skills.length > 0 ? (
                      person.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-lg">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 text-slate-400 text-[11px] font-medium italic">No skills listed</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/profile/${person._id}`}
                      className="flex-1 py-2.5 border-2 border-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors flex items-center justify-center"
                    >
                      View Profile
                    </Link>
                    
                    {/* 🔥 UPDATED: Use navigate to push state */}
                    <button 
                      onClick={() => navigate('/messages', { state: { preselectedUser: person } })}
                      className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20"
                    >
                      Message
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default AlumniDirectory;