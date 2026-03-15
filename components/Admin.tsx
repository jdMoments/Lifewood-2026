import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from './ProfileSidebar';

const Admin: React.FC = () => {
  const { user, loading: authLoading, signOut: authSignOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([
    { id: 's1', full_name: 'Marcus Thorne', email: 'marcus@lifewood.com', role: 'employee', country: 'USA', created_at: '2024-01-15T10:00:00Z', efficiency: 95, level: 4, grade: 'A' },
    { id: 's2', full_name: 'Elena Petrova', email: 'elena@lifewood.com', role: 'employee', country: 'Bulgaria', created_at: '2023-11-20T14:30:00Z', efficiency: 92, level: 5, grade: 'A+' },
    { id: 's3', full_name: 'David Okafor', email: 'david@lifewood.com', role: 'employee', country: 'Nigeria', created_at: '2024-02-05T09:15:00Z', efficiency: 89, level: 3, grade: 'B+' },
    { id: 's4', full_name: 'Lina Schmidt', email: 'lina@lifewood.com', role: 'intern', country: 'Germany', created_at: '2024-03-01T11:00:00Z', efficiency: 88, level: 2, grade: 'B+' },
    { id: 's5', full_name: 'Kenji Sato', email: 'kenji@lifewood.com', role: 'intern', country: 'Japan', created_at: '2024-03-10T08:45:00Z', efficiency: 72, level: 1, grade: 'B' },
    { id: 's6', full_name: 'Sofia Rossi', email: 'sofia@lifewood.com', role: 'intern', country: 'Italy', created_at: '2024-03-12T16:20:00Z', efficiency: 78, level: 1, grade: 'B-' }
  ]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [applications, setApplications] = useState<any[]>([
    { id: 'a1', first_name: 'Alex', last_name: 'Rivera', email: 'alex.rivera@example.com', project_applied: 'AI Model Training', created_at: '2024-03-14T10:00:00Z', status: 'pending', phone: '+1234567890', portfolio_url: 'https://example.com/alex', cv_url: 'https://example.com/cv/alex.pdf' },
    { id: 'a2', first_name: 'Sam', last_name: 'Chen', email: 'sam.chen@example.com', project_applied: 'Data Annotation', created_at: '2024-03-13T14:30:00Z', status: 'accepted', phone: '+0987654321', portfolio_url: 'https://example.com/sam', cv_url: 'https://example.com/cv/sam.pdf' },
    { id: 'a3', first_name: 'Jordan', last_name: 'Lee', email: 'jordan.lee@example.com', project_applied: 'Quality Assurance', created_at: '2024-03-12T09:15:00Z', status: 'declined', phone: '+1122334455', portfolio_url: 'https://example.com/jordan', cv_url: 'https://example.com/cv/jordan.pdf' }
  ]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  const userGrowthData = [
    { name: 'Jan', users: 40 },
    { name: 'Feb', users: 75 },
    { name: 'Mar', users: 120 },
    { name: 'Apr', users: 190 },
    { name: 'May', users: 250 },
    { name: 'Jun', users: 320 },
  ];

  const taskCompletionData = [
    { name: 'Completed', value: 65 },
    { name: 'In Progress', value: 25 },
    { name: 'Pending', value: 10 },
  ];

  const projectProgressData = [
    { name: 'AI Training', progress: 85 },
    { name: 'Data Mining', progress: 60 },
    { name: 'UI Design', progress: 95 },
    { name: 'Backend', progress: 45 },
    { name: 'QA Testing', progress: 30 },
  ];

  const COLORS = ['#10b981', '#1a2e1a', '#e5e7eb'];

  useEffect(() => {
    // Safety timeout: if loading is still true after 10 seconds, force it to false
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Admin dashboard loading safety timeout reached');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.hash = '#/signin';
      return;
    }

    if (user) {
      fetchProfile(user.id);
      fetchGoals(user.id);
      fetchAllProfiles();
      fetchApplications();
    }
  }, [user, authLoading]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sampleApps = [
        { id: 'a1', first_name: 'Alex', last_name: 'Rivera', email: 'alex.rivera@example.com', project_applied: 'AI Model Training', created_at: '2024-03-14T10:00:00Z', status: 'pending', phone: '+1234567890', portfolio_url: 'https://example.com/alex', cv_url: 'https://example.com/cv/alex.pdf' },
        { id: 'a2', first_name: 'Sam', last_name: 'Chen', email: 'sam.chen@example.com', project_applied: 'Data Annotation', created_at: '2024-03-13T14:30:00Z', status: 'accepted', phone: '+0987654321', portfolio_url: 'https://example.com/sam', cv_url: 'https://example.com/cv/sam.pdf' },
        { id: 'a3', first_name: 'Jordan', last_name: 'Lee', email: 'jordan.lee@example.com', project_applied: 'Quality Assurance', created_at: '2024-03-12T09:15:00Z', status: 'declined', phone: '+1122334455', portfolio_url: 'https://example.com/jordan', cv_url: 'https://example.com/cv/jordan.pdf' }
      ];
      
      setApplications([...sampleApps, ...(data || [])]);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'intern' })
      .eq('id', userId);
    
    if (!error) {
      fetchAllProfiles();
    }
  };

  const handleDeclineUser = async (userId: string) => {
    if (!confirm('Are you sure you want to decline this user? This will remove their profile.')) return;
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (!error) {
      fetchAllProfiles();
    }
  };

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false })
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      
      const sampleProfiles = [
        { id: 's1', full_name: 'Marcus Thorne', email: 'marcus@lifewood.com', role: 'employee', country: 'USA', created_at: '2024-01-15T10:00:00Z', efficiency: 95, level: 4, grade: 'A' },
        { id: 's2', full_name: 'Elena Petrova', email: 'elena@lifewood.com', role: 'employee', country: 'Bulgaria', created_at: '2023-11-20T14:30:00Z', efficiency: 92, level: 5, grade: 'A+' },
        { id: 's3', full_name: 'David Okafor', email: 'david@lifewood.com', role: 'employee', country: 'Nigeria', created_at: '2024-02-05T09:15:00Z', efficiency: 89, level: 3, grade: 'B+' },
        { id: 's4', full_name: 'Lina Schmidt', email: 'lina@lifewood.com', role: 'intern', country: 'Germany', created_at: '2024-03-01T11:00:00Z', efficiency: 88, level: 2, grade: 'B+' },
        { id: 's5', full_name: 'Kenji Sato', email: 'kenji@lifewood.com', role: 'intern', country: 'Japan', created_at: '2024-03-10T08:45:00Z', efficiency: 72, level: 1, grade: 'B' },
        { id: 's6', full_name: 'Sofia Rossi', email: 'sofia@lifewood.com', role: 'intern', country: 'Italy', created_at: '2024-03-12T16:20:00Z', efficiency: 78, level: 1, grade: 'B-' }
      ];

      setAllProfiles([...sampleProfiles, ...(data || [])]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        level: editingUser.level,
        efficiency: editingUser.efficiency,
        role: editingUser.role,
        grade: editingUser.grade
      })
      .eq('id', editingUser.id);

    if (!error) {
      setAllProfiles(allProfiles.map(p => p.id === editingUser.id ? editingUser : p));
      setEditingUser(null);
    }
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setIsCalendarModalOpen(true);
  };

  const hasGoalsOnDate = (day: number) => {
    const dateStr = `${calendarDate.getFullYear()}-${(calendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return goals.some(g => g.target_date === dateStr);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error) setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!error) setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
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

  const handleAddGoal = async (e: React.FormEvent, targetDate?: string) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !user) return;

    setIsAddingGoal(true);
    const { data, error } = await supabase
      .from('user_goals')
      .insert([{ 
        user_id: user.id, 
        title: newGoalTitle, 
        is_completed: false,
        target_date: targetDate || null
      }])
      .select()
      .single();

    if (!error && data) {
      setGoals([data, ...goals]);
      setNewGoalTitle('');
    }
    setIsAddingGoal(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      calendarDate.getMonth() === today.getMonth() &&
      calendarDate.getFullYear() === today.getFullYear()
    );
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center"
        >
          {/* Logo/Icon */}
          <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white text-4xl font-bold mb-8 shadow-2xl shadow-emerald-200 animate-pulse">
            ⚡
          </div>
          
          {/* Spinner */}
          <div className="absolute -bottom-2">
            <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-1/2 h-full bg-emerald-600"
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Lifewood Hub</h2>
            <p className="text-sm text-emerald-600/60 font-medium animate-pulse">Initializing Admin Dashboard...</p>
          </div>
        </motion.div>

        {/* Safety button if stuck */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5 }}
          onClick={() => setLoading(false)}
          className="mt-12 text-xs text-gray-400 hover:text-emerald-600 transition-colors underline underline-offset-4"
        >
          Taking too long? Click here to bypass
        </motion.button>
      </div>
    );
  }

  if (!user) return null;

  const handleUpdateApplicationStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      setApplications(applications.map(app => app.id === id ? { ...app, status } : app));
      setSelectedApplicant(null);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '🕒', label: 'Analytics' },
    { icon: '📝', label: 'Evaluation' },
    { icon: '📈', label: 'Reports' },
    { icon: '📩', label: 'Applicants' },
    { icon: '👥', label: 'Manage Users' },
  ];

  const settingsItems = [
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-white text-[#1a1a1a]'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col p-6 fixed h-full z-20 transition-colors duration-300 ${darkMode ? 'bg-[#1e293b] border-slate-800' : 'bg-white border-emerald-100'}`}>
        <div 
          className="flex items-center gap-3 mb-12 cursor-pointer group"
          onClick={() => setIsProfileOpen(true)}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <span className={`font-bold text-xl tracking-tight transition-colors ${darkMode ? 'text-slate-100 group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>Lifewood</span>
          <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded uppercase font-bold text-emerald-600">Hub</span>
        </div>

        <div className="flex-grow">
          <div className="mb-8">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-4 ${darkMode ? 'text-slate-500' : 'text-emerald-600/40'}`}>Main Menu</p>
            <ul className="space-y-2 list-none p-0">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => setActiveTab(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.label
                        ? (darkMode ? 'bg-slate-800 text-emerald-400 border-r-4 border-emerald-500' : 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-600')
                        : (darkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50')
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all no-underline ${darkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                >
                  <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
                  <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </li>
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
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className={`text-sm font-bold truncate transition-colors ${darkMode ? 'text-slate-200 group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>{profile?.full_name || user.email?.split('@')[0] || 'User'}</p>
                <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>{profile?.role || 'Intern Access'}</p>
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
        {activeTab === 'Dashboard' ? (
          <>
            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`rounded-[32px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/40' : 'bg-white border-black/5 hover:border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-600 bg-emerald-50'}`}>+12%</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total Applicants</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{applications.length}</h3>
              </div>

              <div className={`rounded-[32px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/40' : 'bg-white border-black/5 hover:border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-50'}`}>Active</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total Interns</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{allProfiles.filter(p => p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user').length}</h3>
              </div>

              <div className={`rounded-[32px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/40' : 'bg-white border-black/5 hover:border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-50'}`}>Staff</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total Employee</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{allProfiles.filter(p => p.role?.toLowerCase() === 'employee' || p.role?.toLowerCase() === 'admin').length}</h3>
              </div>

              <div className={`rounded-[32px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/40' : 'bg-white border-black/5 hover:border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Live</span>
                  </div>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Active now</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {Math.max(1, Math.floor(allProfiles.length * (0.2 + Math.random() * 0.15)))}
                </h3>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="space-y-8">
              {/* Weekly Task Card */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Weekly Task</h3>
                    <p className="text-xs text-gray-400">{goals.filter(g => !g.is_completed).length} tasks remaining</p>
                  </div>
                </div>
                <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:text-black transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              {/* All Users Table Section */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold">All Users</h3>
                      <p className="text-sm text-gray-400">Manage and monitor all {allProfiles.length} platform members</p>
                    </div>
                    <button 
                      onClick={fetchAllProfiles}
                      className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      title="Refresh data"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-black/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-64 transition-colors"
                      />
                    </div>

                    {/* Role Filter Dropdown */}
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-black/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="All">All Roles</option>
                      <option value="Employee">Employee</option>
                      <option value="Intern">Intern</option>
                      <option value="Applicant">Applicant</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">User</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Country</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Joined</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                        <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles
                        .filter(p => {
                          const matchesSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                              p.email?.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesRole = roleFilter === 'All' || 
                                            (roleFilter === 'Employee' && (p.role?.toLowerCase() === 'employee' || p.role?.toLowerCase() === 'admin')) ||
                                            (roleFilter === 'Intern' && (p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user')) ||
                                            (roleFilter === 'Applicant' && (!p.role || p.role === ''));
                          return matchesSearch && matchesRole;
                        })
                        .map((p) => (
                          <tr key={p.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors group">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                  {p.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{p.full_name}</p>
                                  <p className="text-[10px] text-gray-400">{p.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                                p.role?.toLowerCase() === 'admin' || p.role?.toLowerCase() === 'employee' 
                                  ? 'bg-purple-50 text-purple-600' 
                                  : p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-gray-50 text-gray-400'
                              }`}>
                                {p.role || 'Applicant'}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-gray-500">{p.country || 'Not set'}</td>
                            <td className="py-4 text-sm text-gray-500">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${p.efficiency > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                <span className="text-xs font-medium">{p.efficiency > 80 ? 'Active' : 'Idle'}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${p.efficiency || 0}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'Analytics' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
                <h3 className="text-xl font-bold mb-6">User Growth</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Task Completion Chart */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
                <h3 className="text-xl font-bold mb-6">Task Completion Rates</h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskCompletionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Project Progress Chart */}
              <div className="lg:col-span-2 bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
                <h3 className="text-xl font-bold mb-6">Project Progress</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                      <Tooltip 
                        cursor={{fill: '#f9fafb'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="progress" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Evaluation' ? (
          <div className="bg-white rounded-[40px] p-12 shadow-sm border border-black/5 min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">Evaluation</h2>
              <p className="text-gray-500">this is Evaluation</p>
            </div>
          </div>
        ) : activeTab === 'Reports' ? (
          <div className="bg-white rounded-[40px] p-12 shadow-sm border border-black/5 min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">Reports</h2>
              <p className="text-gray-500">this is Reports</p>
            </div>
          </div>
        ) : activeTab === 'Applicants' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#1a1a1a]'}`}>New Applicants</h2>
              <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Applications from JoinModal</p>
            </div>

            <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Position</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Date</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                        <td className={`py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className="py-4 text-sm font-bold text-lw-green">{app.project_applied}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="py-4">
                          <button 
                            onClick={() => app.status === 'pending' && setSelectedApplicant(app)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-all ${
                              app.status === 'pending' ? 'bg-orange-50 text-orange-600 hover:scale-105' :
                              app.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-red-50 text-red-600'
                            }`}
                          >
                            {app.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {applications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400 italic">No applications found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Applicant Detail Modal */}
            <AnimatePresence>
              {selectedApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedApplicant(null)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-lg rounded-[32px] p-8 shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-900'}`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{selectedApplicant.first_name} {selectedApplicant.last_name}</h3>
                        <p className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{selectedApplicant.project_applied}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedApplicant(null)}
                        className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>

                    <div className="space-y-6 mb-10">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</p>
                          <p className="text-sm font-medium">{selectedApplicant.email}</p>
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Phone</p>
                          <p className="text-sm font-medium">{selectedApplicant.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Portfolio</p>
                        <a 
                          href={selectedApplicant.portfolio_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-emerald-500 hover:underline break-all"
                        >
                          {selectedApplicant.portfolio_url || 'N/A'}
                        </a>
                      </div>

                      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold">Curriculum Vitae</p>
                              <p className="text-[10px] text-gray-500">PDF Document • 2.4 MB</p>
                            </div>
                          </div>
                          <a 
                            href={selectedApplicant.cv_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            View CV
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleUpdateApplicationStatus(selectedApplicant.id, 'declined')}
                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleUpdateApplicationStatus(selectedApplicant.id, 'accepted')}
                        className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : activeTab === 'Manage Users' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#1a1a1a]'}`}>Manage Users</h2>
              <button 
                onClick={fetchAllProfiles}
                className={`p-2 rounded-full shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-black/5 hover:bg-gray-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Interns Table */}
              <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Interns</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Country</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Level</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Efficiency</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.filter(p => p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user').map((p) => (
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                                {p.full_name?.[0] || 'U'}
                              </div>
                              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{p.full_name}</span>
                            </div>
                          </td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.country || 'N/A'}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-900'}`}>{p.level || 1}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-900'}`}>{p.efficiency || 0}%</td>
                          <td className="py-4 text-sm">
                            <button 
                              onClick={() => setEditingUser({ ...p })}
                              className="text-emerald-600 hover:text-emerald-800 font-bold text-[10px] uppercase tracking-widest transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                      {allProfiles.filter(p => p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user').length === 0 && (
                        <tr>
                          <td colSpan={5} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No interns found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Approvals Table */}
              <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  </div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Pending Approvals</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>User</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Joined</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.filter(p => p.role?.toLowerCase() === 'applicant').map((p) => (
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                {p.full_name?.[0] || 'U'}
                              </div>
                              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{p.full_name}</span>
                            </div>
                          </td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.email}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-4 text-sm">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApproveUser(p.id)}
                                className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleDeclineUser(p.id)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              >
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {allProfiles.filter(p => p.role?.toLowerCase() === 'applicant').length === 0 && (
                        <tr>
                          <td colSpan={4} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No pending approvals</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employees Table */}
              <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-[#1a2e1a] text-emerald-400' : 'bg-[#1a2e1a] text-emerald-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Employees</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Country</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Role</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Grade</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.filter(p => p.role?.toLowerCase() === 'employee' || p.role?.toLowerCase() === 'admin').map((p) => (
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                                {p.full_name?.[0] || 'U'}
                              </div>
                              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{p.full_name}</span>
                            </div>
                          </td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.country || 'N/A'}</td>
                          <td className={`py-4 text-sm capitalize ${darkMode ? 'text-slate-300' : 'text-gray-900'}`}>{p.role}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-900'}`}>{p.grade || 'N/A'}</td>
                          <td className="py-4 text-sm">
                            <button 
                              onClick={() => setEditingUser({ ...p })}
                              className="text-emerald-600 hover:text-emerald-800 font-bold text-[10px] uppercase tracking-widest transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-[40px] p-12 shadow-sm border min-h-[600px] flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{activeTab}</h2>
              <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Content for {activeTab} will appear here.</p>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-[40px] p-10 w-full max-w-md shadow-2xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Update User</h3>
                <button 
                  onClick={() => setEditingUser(null)}
                  className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Full Name</label>
                  <div className={`px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    {editingUser.full_name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Level</label>
                    <input 
                      type="number" 
                      value={editingUser.level || 1}
                      onChange={(e) => setEditingUser({ ...editingUser, level: parseInt(e.target.value) })}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-100'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Efficiency (%)</label>
                    <input 
                      type="number" 
                      value={editingUser.efficiency || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, efficiency: parseInt(e.target.value) })}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-100'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <option value="Intern">Intern</option>
                    <option value="Employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Grade</label>
                  <input 
                    type="text" 
                    value={editingUser.grade || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, grade: e.target.value })}
                    placeholder="e.g. A, B+, N/A"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 mt-4"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isCalendarModalOpen && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-black/5"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold">Date Details</h3>
                  <p className="text-sm text-gray-500">{selectedDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button onClick={() => setIsCalendarModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Goals for this day</h4>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                    {goals.filter(g => g.target_date === formatDate(selectedDate)).length > 0 ? (
                      goals.filter(g => g.target_date === formatDate(selectedDate)).map(goal => (
                        <div key={goal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-black/5">
                          <div className={`w-2 h-2 rounded-full ${goal.is_completed ? 'bg-gray-300' : 'bg-[#d4f05c]'}`}></div>
                          <span className={`text-sm ${goal.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{goal.title}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">No goals set for this date.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Add new goal</h4>
                  <form onSubmit={(e) => {
                    handleAddGoal(e, formatDate(selectedDate));
                  }} className="flex gap-2">
                    <input
                      type="text"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      placeholder="Goal title..."
                      className="flex-grow bg-gray-50 border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d4f05c] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isAddingGoal || !newGoalTitle.trim()}
                      className="bg-black text-[#d4f05c] px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      {isAddingGoal ? '...' : 'Add'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}

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

export default Admin;
