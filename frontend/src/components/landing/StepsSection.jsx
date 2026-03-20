// src/components/landing/StepsSection.jsx
import React from 'react';
import network2 from "../../assets/network2.jpg"

const StepsSection = () => {
  const steps = [
    { number: 1, title: "Set Up Your Profile", description: "Select your role (Student, Alumni, or Recruiter), add your major, graduation year, and current skills." },
    { number: 2, title: "Discover Connections", description: "Use advanced filters to find alumni working at your dream companies or in your specific target roles." },
    { number: 3, title: "Engage & Grow", description: "Send connection requests, chat in real-time, ask for referrals, and apply to exclusive job postings." },
  ];

  return (
    <section className="bg-slate-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        <div className="space-y-10">
          <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">
            Networking made <span className="text-orange-500">effortless.</span>
          </h2>
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-5">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm shadow-md">
                  {step.number}
                </div>
                <div className="space-y-2 pt-1">
                  <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
                  <p className="text-slate-600 text-base leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200">
           {/* Suggestion: A mockup of your actual app's search filters here */}
          <img 
            src={network2} 
            alt="Search interface visualization" 
            className="object-cover w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default StepsSection;