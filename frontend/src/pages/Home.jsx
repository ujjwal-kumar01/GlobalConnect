// src/pages/LandingPage.jsx
import React from 'react';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeatureGrid from '../components/landing/FeatureGrid';
import StepsSection from '../components/landing/StepsSection';
import Testimonials from '../components/landing/Testimonials';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/layout/Footer';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* 2. Main Page Content */}
      <main className="flex-grow bg-white">
        <HeroSection />
        <FeatureGrid />
        <StepsSection />
        <Testimonials />
        <CTASection />
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
};

export default Home;