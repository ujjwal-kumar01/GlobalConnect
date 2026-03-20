// src/components/landing/CTASection.jsx
import React from 'react';
import Button from '../common/Button';

const CTASection = () => {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col md:flex-row items-center justify-between p-12 md:p-16 gap-10">
                
                {/* Subtle Ambient Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500 opacity-5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

                {/* Text Content */}
                <div className="relative z-10 space-y-5 max-w-2xl text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                        Your college network is waiting. <span className="text-orange-500">Tap in.</span>
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        Join thousands of students and alumni already building their careers. Set up your profile in under 2 minutes and start connecting.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                    <Button variant="coral" className="w-full rounded-2xl bg-orange-500 text-white hover:bg-orange-600 shadow-sm sm:w-auto px-8 py-4 text-base shadow-lg shadow-orange-500/20">
                        Join Global Connect
                    </Button>
                </div>
                
            </div>
        </section>
    );
};

export default CTASection;