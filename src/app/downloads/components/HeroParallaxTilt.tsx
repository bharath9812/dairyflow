'use client';

import React, { useRef, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';

export default function HeroParallaxTilt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Map the mouse position to a rotation angle (e.g., max 15 degrees)
    const rotateX = ((y - centerY) / centerY) * -10; // Tilt up/down
    const rotateY = ((x - centerX) / centerX) * 10;  // Tilt left/right

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-120px)] pt-6 pb-16 relative overflow-hidden">

      {/* Background glowing blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] md:w-[600px] md:h-[400px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full -z-10" />

      {/* 3D Tilt Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl px-4 md:px-8 z-10 cursor-pointer mt-6"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative w-full transition-transform ease-out will-change-transform ${isHovered ? 'duration-75' : 'duration-500'
            }`}
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovered ? 1.02 : 1})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Main Image */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/50 shadow-2xl bg-white/50 backdrop-blur-sm">
            <img
              src="/landing-page-asset.png"
              alt="Lumina Terminal Dashboard Preview"
              className="w-full h-auto object-cover rounded-2xl"
              // Fallback to placeholder if the image fails to load
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/dashboard-preview.png';
              }}
            />
          </div>

          {/* Decorative Floating Badges */}
          <div
            className="absolute -top-4 -right-4 md:-top-6 md:-right-8 lg:-right-12 bg-white text-slate-800 p-2 md:p-3 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-1 transition-transform duration-300"
            style={{ transform: `translateZ(40px) ${isHovered ? 'scale(1.05)' : 'scale(1)'}` }}
          >
            <div className="bg-purple-100 text-purple-600 p-1.5 md:p-2 rounded-xl">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">v2.0 UI Beta</span>
          </div>

        </div>
      </div>

      {/* Headline */}
      <div className="text-center mt-8 md:mt-12 space-y-3 md:space-y-4 z-10 px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          A truly beautiful <br className="hidden md:block" /> management experience
        </h1>
        <p className="text-base md:text-lg text-slate-500 max-w-xl md:max-w-2xl mx-auto leading-relaxed">
          Lumina Terminal is an enterprise-grade dairy procurement software that simplifies operations, tracks everything, and looks stunning while doing it.
        </p>
      </div>

    </div>
  );
}
