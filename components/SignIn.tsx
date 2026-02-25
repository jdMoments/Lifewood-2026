import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[40%] p-8 md:p-16 flex flex-col justify-center relative z-10">
        <a 
          href="#/" 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 no-underline text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </a>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-[#FFB347]"></div>
          <span className="font-bold text-xl tracking-tight">lifewood</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-3">Sign In</h1>
        <p className="text-gray-500 mb-10">Enter your credentials to access your dashboard</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="flex items-center justify-center py-3 px-6 rounded-xl bg-[#1c1c1c] border border-white/5 hover:bg-[#252525] transition-colors">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" alt="Google" className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-center py-3 px-6 rounded-xl bg-[#1c1c1c] border border-white/5 hover:bg-[#252525] transition-colors">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="h-5 w-5 invert" />
          </button>
        </div>

        <div className="relative flex items-center mb-8">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-gray-600 text-xs uppercase tracking-widest font-bold">or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Username or Email</label>
            <input 
              type="text" 
              placeholder="test1"
              className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-4 px-5 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#FFB347]/50 transition-colors"
            />
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Password</label>
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#FFB347] transition-colors no-underline">Forgot?</a>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••"
                className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl py-4 px-5 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#FFB347]/50 transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => window.location.hash = '#/admin'}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all group mt-8"
          >
            Sign In
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>
      </div>

      {/* Right Side - Bento Grid Visual */}
      <div className="hidden lg:flex w-[60%] p-8 relative items-center justify-center overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFB347]/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full"></div>

        <div className="relative w-full max-w-[900px] grid grid-cols-12 grid-rows-12 gap-4 aspect-[16/10]">
          {/* Main Card */}
          <div className="col-span-7 row-span-6 bg-[#111] rounded-[32px] border border-white/5 p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#FFB347]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-12 h-12 rounded-2xl bg-[#1a2a1a] flex items-center justify-center text-[#d4f05c] mb-8 border border-[#d4f05c]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">Innovative Design</h2>
              <p className="text-gray-500 text-base leading-relaxed">Harness the power of AI for cutting-edge 3D creations.</p>
            </div>
          </div>

          {/* Small Top Right Card */}
          <div className="col-span-5 row-span-3 bg-[#111] rounded-[32px] border border-white/5"></div>
          
          {/* Small Middle Right Card */}
          <div className="col-span-5 row-span-3 bg-[#111] rounded-[32px] border border-white/5"></div>

          {/* User Friendly Card (Lime Green) */}
          <div className="col-span-7 row-span-3 bg-[#d4f05c] rounded-[32px] p-8 flex flex-col justify-center text-black">
            <h2 className="text-2xl font-bold mb-1">User-Friendly</h2>
            <p className="text-black/70 text-sm font-medium">Intuitive platform for everyone.</p>
          </div>

          {/* Vertical Card Right */}
          <div className="col-span-5 row-span-6 bg-[#111] rounded-[32px] border border-white/5 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
          </div>

          {/* Bottom Left Card */}
          <div className="col-span-7 row-span-3 bg-[#111] rounded-[32px] border border-white/5 p-8 flex items-center justify-between group cursor-pointer">
            <span className="text-gray-500 font-medium group-hover:text-white transition-colors">Join the future</span>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
