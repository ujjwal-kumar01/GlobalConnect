// src/components/landing/Testimonials.jsx
import React from 'react';

const TestimonialCard = ({ quote, avatar, name, position, roleTag }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="text-orange-500 text-5xl font-serif leading-none h-6">"</div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{roleTag}</span>
      </div>
      <blockquote className="text-slate-700 text-base font-medium leading-relaxed grow pt-2">
        {quote}
      </blockquote>
      <div className="flex items-center gap-4 pt-6 mt-auto border-t border-slate-50">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
          {name.charAt(0)}
        </div>
        <div>
          <h5 className="font-bold text-slate-900 text-sm">{name}</h5>
          <p className="text-xs text-slate-500">{position}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const testimonialsData = [
    { 
      roleTag: "Student",
      quote: "The platform helped me connect with seniors who guided me on competitive programming. Thanks to their referrals, I just landed a full-stack internship for the summer!", 
      name: "Ujjwal K.", 
      position: "B.Tech CSE Student" 
    },
    { 
      roleTag: "Alumni",
      quote: "I love being able to give back. It's so much easier to hire directly from my alma mater through this platform than sorting through thousands of random applications.", 
      name: "Sarah Jenkins", 
      position: "Senior Engineer at TechFlow" 
    },
    { 
      roleTag: "Recruiter",
      quote: "Global Connect gives us direct access to verified, high-quality talent pools. We post our junior roles here first before going to public job boards.", 
      name: "David Chen", 
      position: "Technical Recruiter" 
    },
  ];

  return (
    <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Success stories from the <span className="text-orange-500">community</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonialsData.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;