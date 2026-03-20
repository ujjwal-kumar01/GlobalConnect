// src/components/landing/FeatureGrid.jsx
import React from 'react';

const FeatureCard = ({ icon, title, description, isHighlighted = false }) => {
  const baseClasses = "p-8 rounded-2xl border space-y-4 transition-all duration-200 hover:shadow-md";
  const colors = isHighlighted
    ? "bg-orange-50 border-orange-100"
    : "bg-white border-slate-100 shadow-sm";
  
  return (
    <div className={`${baseClasses} ${colors}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl ${isHighlighted ? "text-orange-600 bg-orange-100" : "text-slate-600 bg-slate-100"}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className={`text-sm leading-relaxed ${isHighlighted ? "text-orange-800" : "text-slate-600"}`}>{description}</p>
    </div>
  );
};

const FeatureGrid = () => {
  const features = [
    { icon: "🤝", title: "Alumni Mentorship", description: "Filter the alumni directory by company, role, or graduation year to find the perfect mentor for your journey." },
    { icon: "💬", title: "Real-Time Chat", description: "Skip the cold emails. Drop a direct message to seniors or recruiters to get instant advice and feedback." },
    { icon: "💼", title: "Exclusive Job Board", description: "Apply to roles posted directly by alumni looking to hire from their alma mater, giving your application priority." },
    { icon: "🏫", title: "Verified Communities", description: "Join closed, college-specific hubs where admins ensure everyone is a genuine student, alumni, or verified recruiter.", isHighlighted: true },
  ];

  return (
    <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-14 text-center">
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything you need to launch your career
          </h2>
          <p className="text-lg text-slate-600">
            We've built the exact tools you need to network effectively, without the noise of traditional social media.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;