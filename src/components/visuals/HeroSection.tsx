'use client';

import React from 'react';

export default function HeroSection() {
  return (
    <section className="hero-section min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6">
          Revolutionize <span className="text-green-600">Agriculture</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Hero functionality integrated into LandingPage.tsx
        </p>
      </div>
    </section>
  );
}
