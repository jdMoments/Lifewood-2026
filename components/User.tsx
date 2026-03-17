import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from './ProfileSidebar';

const User: React.FC = () => {
  const { user, loading: authLoading, signOut: authSignOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userDarkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('userDarkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.hash = '#/signin';
      return;
    }

    if (user) {
      fetchProfile(user.id);
      fetchGoals(user.id);
    }
  }, [user, authLoading]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error) setProfile(data);
  };

  const fetchGoals = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error) setGoals(data);
  };

  const handleSignOut = async () => {
    await authSignOut();
    window.location.hash = '#/signin';
  };

  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_goals')
      .update({ is_completed: !currentStatus })
      .eq('id', goalId);

    if (!error) {
      setGoals(goals.map(g => g.id === goalId ? { ...g, is_completed: !currentStatus } : g));
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !user) return;

    setIsAddingGoal(true);
    const { data, error } = await supabase
      .from('user_goals')
      .insert([{ user_id: user.id, title: newGoalTitle, is_completed: false }])
      .select()
      .single();

    if (!error && data) {
      setGoals([data, ...goals]);
      setNewGoalTitle('');
    }
    setIsAddingGoal(false);
  };

  if (authLoading) return null;

  if (!user) return null;
  const menuItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '🕒', label: 'My Progress' },
    { icon: '📝', label: 'Tasks' },
    { icon: '📈', label: 'Performance' },
  ];

  const settingsItems = [
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className={`min-h-screen flex font-sans transition-colors ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-[#1a1a1a]'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col p-6 fixed h-full z-20 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-100'}`}>
        <div 
          className="flex items-center justify-between mb-12"
        >
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(true)}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${darkMode ? 'text-white group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>Lifewood</span>
            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold transition-colors ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>User</span>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex-grow">
          <div className="mb-8">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-4 ${darkMode ? 'text-slate-500' : 'text-emerald-600/40'}`}>Main Menu</p>
            <ul className="space-y-2 list-none p-0">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all no-underline ${
                      item.active
                        ? darkMode 
                          ? 'bg-slate-800 text-emerald-400 border-r-4 border-emerald-400'
                          : 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-600'
                        : darkMode
                          ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'
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
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-4 ${darkMode ? 'text-slate-500' : 'text-emerald-600/40'}`}>Settings</p>
            <ul className="space-y-2 list-none p-0">
              {settingsItems.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all no-underline ${
                      darkMode
                        ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'
                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                    }`}
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
        <div className={`mt-auto pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-emerald-100'}`}>
          <div className={`flex items-center justify-between p-3 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-emerald-50/50'}`}>
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsProfileOpen(true)}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'Profile'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.email?.[0].toUpperCase() || 'U'
                )}
              </div>
              <div className="overflow-hidden">
                <p className={`text-sm font-bold truncate transition-colors ${darkMode ? 'text-slate-100 group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>{profile?.full_name || user.email?.split('@')[0] || 'User'}</p>
                <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>{profile?.role || 'User'}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className={`transition-colors ${darkMode ? 'text-slate-500 hover:text-emerald-400' : 'text-gray-400 hover:text-emerald-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-8">
        {/* Hero Section */}
        <section className={`relative rounded-[40px] p-12 text-white overflow-hidden mb-8 min-h-[450px] flex flex-col justify-between shadow-xl transition-all ${darkMode ? 'bg-slate-800 shadow-emerald-900/10' : 'bg-[#1a2e1a] shadow-emerald-900/20'}`}>
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
             <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-gradient-to-l from-emerald-500/20 to-transparent blur-3xl rounded-full transform rotate-12"></div>
          </div>

          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 ${darkMode ? 'bg-slate-700' : 'bg-white/10'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Learning Path</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold max-w-2xl leading-[1.1] mb-12">
              {profile?.current_course || 'Your AI Learning Journey Starts Here.'}
            </h1>

            <div className="flex items-center gap-8">
              <button className="bg-emerald-500 text-white font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
                Continue Learning
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </button>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-emerald-100/60'}`}>Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!</span>
            </div>
          </div>

          <div className="relative z-10 flex gap-12 mt-12">
            <div>
              <p className="text-4xl font-bold mb-1">{profile?.completion || '0'}%</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>Progress</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">{profile?.hours_spent || '0'}h</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>Time Invested</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">{profile?.grade || 'N/A'}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>Performance</p>
            </div>
          </div>

          {/* Calendar Widget Overlay */}
          <div className={`absolute top-12 right-12 backdrop-blur-md border rounded-[32px] p-6 w-[300px] hidden xl:block transition-colors ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white/5 border-white/10'}`}>
             <div className="flex justify-between items-center mb-6">
                <div>
                  <p className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>03 \ 2026</p>
                  <p className="text-xl font-bold">March</p>
                </div>
                <div className="flex gap-2">
                  <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-white/5 text-emerald-100/40 hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-white/5 text-emerald-100/40 hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
             </div>
             
             <div className={`grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold mb-4 ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>
                <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
             </div>
             <div className="grid grid-cols-7 gap-y-4 text-center text-sm font-medium">
                <span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>1</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>2</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>3</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>4</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>5</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>6</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>7</span>
                <span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>8</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>9</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>10</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>11</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>12</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>13</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>14</span>
                <span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>15</span>
                <div className="relative flex items-center justify-center">
                  <span className="w-8 h-8 rounded-lg border border-emerald-400 flex items-center justify-center text-white">16</span>
                  <div className="absolute -bottom-1 w-1 h-1 bg-emerald-400 rounded-full"></div>
                </div>
                <span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>17</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>18</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>19</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>20</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>21</span>
                <span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>22</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>23</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>24</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>25</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>26</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>27</span><span className={darkMode ? 'text-slate-600' : 'text-emerald-100/60'}>28</span>
             </div>
          </div>
        </section>

        {/* Bottom Cards Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Activity Card */}
          <div className={`col-span-12 lg:col-span-5 rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Goals</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Track your progress</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Add Goal Form */}
              <form onSubmit={handleAddGoal} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="What's your next goal?"
                    className={`flex-grow border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-black/5 text-gray-900'}`}
                  />
                  <button
                    type="submit"
                    disabled={isAddingGoal || !newGoalTitle.trim()}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                  >
                    {isAddingGoal ? '...' : '+'}
                  </button>
                </div>
              </form>

              {goals.length > 0 ? (
                goals.slice(0, 3).map((goal) => (
                  <div 
                    key={goal.id} 
                    onClick={() => toggleGoalCompletion(goal.id, goal.is_completed)}
                    className={`${goal.is_completed ? (darkMode ? 'bg-slate-900/50' : 'bg-gray-50') : 'bg-emerald-600 text-white'} p-6 rounded-[32px] flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.02] shadow-sm`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${goal.is_completed ? (darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100') : 'bg-white/20'} flex items-center justify-center ${goal.is_completed ? 'text-emerald-600' : 'text-white'} font-bold text-xs`}>
                        {goal.is_completed ? '✓' : '!!'}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${goal.is_completed ? (darkMode ? 'line-through text-slate-500' : 'line-through text-gray-400') : ''}`}>{goal.title}</p>
                        <p className={`text-[10px] ${goal.is_completed ? (darkMode ? 'text-slate-600' : 'text-gray-400') : 'text-emerald-100'}`}>
                          {new Date(goal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-6 rounded-[32px] text-center text-sm ${darkMode ? 'bg-slate-900/50 text-slate-500' : 'bg-gray-50 text-gray-400'}`}>
                  Start by adding your first goal!
                </div>
              )}
            </div>
          </div>

          {/* Right Column Stats */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-8">
            {/* Efficiency Card */}
            <div className={`col-span-1 rounded-[40px] p-8 flex flex-col justify-between shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <div className="flex justify-between items-start">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>Efficiency</p>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-900 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
              </div>
              <p className={`text-6xl font-bold ${darkMode ? 'text-white' : 'text-emerald-900'}`}>{profile?.efficiency || '0'}%</p>
            </div>

            {/* Level Card */}
            <div className={`col-span-1 rounded-[40px] p-8 flex flex-col justify-between shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <div className="flex justify-between items-start">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>Level</p>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-900 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
              <div>
                <p className={`text-6xl font-bold ${darkMode ? 'text-white' : 'text-emerald-900'}`}>{profile?.level?.toString().padStart(2, '0') || '01'}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>{profile?.role || 'User'}</p>
              </div>
            </div>

            {/* Weekly Goals Card */}
            <div className={`col-span-2 rounded-[40px] p-8 shadow-sm border flex items-center justify-between transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-900 text-slate-500' : 'bg-gray-50 text-gray-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Learning Goals</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{goals.filter(g => !g.is_completed).length} tasks remaining</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isProfileOpen && (
          <ProfileSidebar 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            profile={profile}
            user={user}
            onUpdate={() => fetchProfile(user.id)}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default User;


