import React from 'react';
import { motion } from 'framer-motion';

const Admin: React.FC = () => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '🕒', label: 'Analytics' },
    { icon: '📝', label: 'Evaluation' },
    { icon: '📈', label: 'Reports' },
  ];

  const settingsItems = [
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex text-[#1a1a1a] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 rounded-lg bg-[#d4f05c] flex items-center justify-center text-black font-bold">
            ⚡
          </div>
          <span className="font-bold text-xl tracking-tight">Lifewood</span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase font-bold text-gray-400">Hub</span>
        </div>

        <div className="flex-grow">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 px-4">Main Menu</p>
            <ul className="space-y-2 list-none p-0">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all no-underline ${
                      item.active
                        ? 'bg-white/10 text-white border-r-4 border-[#d4f05c]'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 px-4">Settings</p>
            <ul className="space-y-2 list-none p-0">
              {settingsItems.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all no-underline"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User Profile */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d4f05c] flex items-center justify-center text-black font-bold">
                T
              </div>
              <div>
                <p className="text-sm font-bold">test1</p>
                <p className="text-[10px] text-gray-500">Intern Access</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-8">
        {/* Hero Section */}
        <section className="relative bg-black rounded-[40px] p-12 text-white overflow-hidden mb-8 min-h-[450px] flex flex-col justify-between">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
             <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-gradient-to-l from-white/20 to-transparent blur-3xl rounded-full transform rotate-12"></div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-[#d4f05c] animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4f05c]">In Progress</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold max-w-2xl leading-[1.1] mb-12">
              Mastering <span className="text-[#d4f05c]">React</span> Patterns & Architecture.
            </h1>

            <div className="flex items-center gap-8">
              <button className="bg-[#d4f05c] text-black font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform">
                Continue Lesson
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </button>
              <span className="text-gray-400 text-sm">Module 12 of 24</span>
            </div>
          </div>

          <div className="relative z-10 flex gap-12 mt-12">
            <div>
              <p className="text-4xl font-bold mb-1">82%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Completion</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">14h</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Spent</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">A+</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Avg Grade</p>
            </div>
          </div>

          {/* Calendar Widget Overlay */}
          <div className="absolute top-12 right-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6 w-[300px] hidden xl:block">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">02 \ 2026</p>
                  <p className="text-xl font-bold">February</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
             </div>
             
             <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold text-gray-500 mb-4">
                <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
             </div>
             <div className="grid grid-cols-7 gap-y-4 text-center text-sm font-medium">
                <span className="text-gray-700">1</span><span className="text-gray-700">2</span><span className="text-gray-700">3</span><span className="text-gray-700">4</span><span className="text-gray-700">5</span><span className="text-gray-700">6</span><span className="text-gray-700">7</span>
                <span className="text-gray-700">8</span><span className="text-gray-700">9</span><span className="text-gray-700">10</span><span className="text-gray-700">11</span><span className="text-gray-700">12</span><span className="text-gray-700">13</span><span className="text-gray-700">14</span>
                <span className="text-gray-700">15</span>
                <div className="relative flex items-center justify-center">
                  <span className="w-8 h-8 rounded-lg border border-[#d4f05c] flex items-center justify-center text-white">16</span>
                  <div className="absolute -bottom-1 w-1 h-1 bg-[#d4f05c] rounded-full"></div>
                </div>
                <span className="text-gray-700">17</span><span className="text-gray-700">18</span><span className="text-gray-700">19</span><span className="text-gray-700">20</span><span className="text-gray-700">21</span>
                <span className="text-gray-700">22</span><span className="text-gray-700">23</span><span className="text-gray-700">24</span><span className="text-gray-700">25</span><span className="text-gray-700">26</span><span className="text-gray-700">27</span><span className="text-gray-700">28</span>
             </div>

             <div className="mt-8 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00f2ff]"></div>
                  <span className="text-[8px] font-bold uppercase text-gray-500">Start Date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ffb347]"></div>
                  <span className="text-[8px] font-bold uppercase text-gray-500">Deadline</span>
                </div>
             </div>
          </div>
        </section>

        {/* Bottom Cards Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Activity Card */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold">Activity</h3>
                <p className="text-xs text-gray-400">Recent updates</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-black text-white p-6 rounded-[32px] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#d4f05c] flex items-center justify-center text-black font-bold text-xs">
                  98%
                </div>
                <div>
                  <p className="font-bold text-sm">Quiz Score: React Hooks</p>
                  <p className="text-[10px] text-gray-500">27 Feb, 2026</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[32px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center text-black font-bold text-lg">
                    x2
                  </div>
                  <div>
                    <p className="font-bold text-sm">Productivity Streak</p>
                    <p className="text-[10px] text-gray-500">Increased by 12%</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Stats */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-8">
            {/* Efficiency Card */}
            <div className="col-span-1 bg-[#d4f05c] rounded-[40px] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Efficiency</p>
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[#d4f05c]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
              </div>
              <p className="text-6xl font-bold">98%</p>
            </div>

            {/* Level Card */}
            <div className="col-span-1 bg-[#1a1a1a] text-white rounded-[40px] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Level</p>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
              <div>
                <p className="text-6xl font-bold">04</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Senior Intern</p>
              </div>
            </div>

            {/* Weekly Goals Card */}
            <div className="col-span-2 bg-white rounded-[40px] p-8 shadow-sm border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Weekly Goals</h3>
                  <p className="text-xs text-gray-400">4 tasks remaining</p>
                </div>
              </div>
              <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:text-black transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
