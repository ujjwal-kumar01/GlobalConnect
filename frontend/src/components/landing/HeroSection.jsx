// src/components/landing/HeroSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import Button from '../common/Button';
import meetingImage from '../../assets/business_meeting_office.jpg';

const HeroSection = () => {
  const navigate = useNavigate(); // 2. Initialize the hook

  return (
    <section className="relative bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <div className="space-y-6">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-xs font-bold text-orange-600 tracking-wide uppercase">
            The Ultimate Alumni Network
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">
            Bridge the Gap Between <span className="text-orange-500">Campus</span> and Career.
          </h1>
          <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
            Connect with verified alumni, land direct referrals, and chat with top recruiters. Your college network is your most valuable asset—start using it today.
          </p>
          <div className="flex items-center gap-4 pt-2">
            {/* 3. Add onClick handlers to route to login */}
            <Button variant="coral" onClick={() => navigate('/register')}>
              Join Your Campus
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Explore Jobs
            </Button>
          </div>
        </div>

        {/* Right Content - Hero Image */}
        <div className="relative flex flex-col md:block">
          
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 relative z-0">
            <img 
              src={meetingImage}
              alt="Students and professionals connecting" 
              className="object-cover w-full h-auto aspect-video md:aspect-auto"
            />
          </div>
          
          {/* FIX: Static/slight overlap on mobile, Absolute on desktop */}
          <div className="relative md:absolute md:bottom-6 md:left-6 md:right-6 -mt-8 md:mt-0 mx-4 md:mx-0 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-xl flex items-center gap-3 shadow-lg border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
              🎓
            </div>
            <p className="text-sm font-semibold text-slate-800">Over 5,000+ students hired through alumni referrals.</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;