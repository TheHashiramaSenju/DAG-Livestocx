'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function InteractiveGlobe() {
  const globeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const globe = globeRef.current;
    const container = containerRef.current;
    
    if (!globe || !container) return;

    // Intersection Observer for visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);

    // Initial animation
    if (isVisible) {
      gsap.fromTo(globe,
        { 
          scale: 0, 
          opacity: 0, 
          rotationY: -180 
        },
        { 
          scale: 1, 
          opacity: 1, 
          rotationY: 0,
          duration: 2, 
          ease: "back.out(1.7)" 
        }
      );

      // Continuous slow rotation
      gsap.to(globe, {
        rotationY: 360,
        duration: 20,
        repeat: -1,
        ease: "none"
      });

      // Floating animation
      gsap.to(globe, {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }

    return () => {
      observer.disconnect();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isVisible]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[700px] bg-gradient-to-br from-blue-100 via-green-50 to-blue-100 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full opacity-40 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Concentric circles for depth */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] border border-green-200 rounded-full opacity-20 animate-ping-slow"></div>
        <div className="absolute w-[500px] h-[500px] border border-blue-200 rounded-full opacity-30 animate-ping-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-[400px] h-[400px] border border-green-300 rounded-full opacity-40 animate-ping-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* MAIN GLOBE - Significantly Enlarged */}
      <div 
        ref={globeRef}
        className="relative z-10 flex items-center justify-center"
        style={{ 
          width: '450px', 
          height: '450px',
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
        }}
      >
        {/* Globe emoji - much larger */}
        <span 
          className="block text-[300px] leading-none"
          style={{
            background: 'linear-gradient(45deg, #4ade80, #22c55e, #16a34a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 10px 20px rgba(34, 197, 94, 0.3))'
          }}
        >
          🌍
        </span>
        
        {/* Orbiting agricultural elements */}
        <div className="absolute inset-0 animate-spin-very-slow">
          {/* Tractor */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <span className="text-4xl drop-shadow-lg">🚜</span>
          </div>
          
          {/* Wheat */}
          <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
            <span className="text-4xl drop-shadow-lg">🌾</span>
          </div>
          
          {/* Cow */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <span className="text-4xl drop-shadow-lg">🐄</span>
          </div>
          
          {/* Seeds */}
          <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
            <span className="text-4xl drop-shadow-lg">🌱</span>
          </div>
        </div>

        {/* Inner orbiting elements */}
        <div className="absolute inset-8 animate-spin-reverse-slow">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <span className="text-2xl">💰</span>
          </div>
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
            <span className="text-2xl">📊</span>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <span className="text-2xl">🌐</span>
          </div>
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
            <span className="text-2xl">🔗</span>
          </div>
        </div>
      </div>

      {/* Floating blockchain icons */}
      <div className="absolute top-12 left-12 animate-bounce-slow">
        <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
          B
        </div>
      </div>
      
      <div className="absolute bottom-12 right-12 animate-bounce-slow" style={{ animationDelay: '1s' }}>
        <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
          ₿
        </div>
      </div>

      {/* Globe info overlay */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
          <h3 className="font-bold text-gray-800">Global Agricultural Network</h3>
          <p className="text-sm text-gray-600">Connecting farmers and investors worldwide</p>
        </div>
      </div>
    </div>
  );
}
