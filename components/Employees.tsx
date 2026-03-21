import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from './ProfileSidebar';
import Aurora from './Aurora';

type UserSection = 'Dashboard' | 'My Progress' | 'Tasks' | 'Performance' | 'Settings';

const SAMPLE_TASKS: Array<{ id: string; title: string; completed: boolean }> = [
  { id: 'task-1', title: 'Prepare daily operations report', completed: false },
  { id: 'task-2', title: 'Attend 10:00 AM team stand-up meeting', completed: false },
  { id: 'task-3', title: 'Review and reply to pending client emails', completed: false },
  { id: 'task-4', title: 'Update project tracker and task statuses', completed: false },
  { id: 'task-5', title: 'Submit end-of-day accomplishment summary', completed: false },
];

const Employees: React.FC = () => {
  const { user, loading: authLoading, signOut: authSignOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<UserSection>('Dashboard');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userDarkMode') === 'true';
    }
    return false;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('userDarkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

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

  const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate();

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  type HolidayType = 'Regular Holiday' | 'Special Non-Working Day' | 'Special Working Day';

  const PHILIPPINE_HOLIDAYS: Array<{ month: number; day: number; name: string; type: HolidayType; backgroundImageUrl?: string }> = [
    { month: 0, day: 1, name: "New Year's Day", type: 'Regular Holiday', backgroundImageUrl: 'https://www.holidaysmart.com/sites/default/files/holidays/images/islam-muslim%20holidays-Eid-al-Fitr-cv.jpg' },
    { month: 1, day: 17, name: 'Chinese New Year', type: 'Special Non-Working Day', backgroundImageUrl: 'https://www.teachingnomad.com/wp-content/uploads/2024/12/chinese-newyear.jpg' },
    { month: 1, day: 25, name: 'EDSA People Power Anniversary', type: 'Special Working Day', backgroundImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6Vc-6UzGC4AnSROz-Q6DIHeRvJh_Wtwnh5g&s' },
    { month: 2, day: 20, name: "Eid'l Fitr (Feast of Ramadhan)", type: 'Regular Holiday', backgroundImageUrl: 'https://www.holidaysmart.com/sites/default/files/holidays/images/islam-muslim%20holidays-Eid-al-Fitr-cv.jpg' },
    { month: 3, day: 2, name: 'Maundy Thursday', type: 'Regular Holiday', backgroundImageUrl: 'https://assets3.ignitermedia.com/4b8cb0ba845d9fad2ada5f9ebcf4de21.jpg' },
    { month: 3, day: 3, name: 'Good Friday', type: 'Regular Holiday', backgroundImageUrl: 'https://img.pikbest.com/backgrounds/20250405/good-friday-typography-with-dew-and-green-leaves-background-_11649198.jpg!bwr800' },
    { month: 3, day: 4, name: 'Black Saturday', type: 'Special Non-Working Day', backgroundImageUrl: 'https://as1.ftcdn.net/jpg/04/88/88/72/1000_F_488887201_lv9qhjdw6rcb9YLQOsONWCWiLptCV8Qm.jpg' },
    { month: 3, day: 9, name: 'Araw ng Kagitingan (Day of Valor)', type: 'Regular Holiday', backgroundImageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/404/2a30a0198236283.Y3JvcCwxMzMzLDEwNDMsMzIzLDA.png' },
    { month: 4, day: 1, name: 'Labor Day', type: 'Regular Holiday', backgroundImageUrl: 'https://wallpapers.com/images/hd/3d-labor-day-logo-c94e440qewcozm2g.jpg' },
    { month: 4, day: 27, name: "Eid'l Adha (Feast of Sacrifice)", type: 'Regular Holiday', backgroundImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRfMg6pKvTODL8L7wBztsJkZYkpqV0JCgutA&s' },
    { month: 5, day: 12, name: 'Independence Day', type: 'Regular Holiday', backgroundImageUrl: 'https://as2.ftcdn.net/jpg/03/70/52/69/1000_F_370526905_JpNGf4aOZw0QDDGSG9u8tAZrLJOASbJb.jpg' },
    { month: 7, day: 21, name: 'Ninoy Aquino Day', type: 'Special Non-Working Day', backgroundImageUrl: 'https://assets.bossjob.com/companies/19668/album-pictures/TgGJLMeWQONfNpPnm0bgkYK3AgoXqSsEzb8sANZC.png' },
    { month: 7, day: 31, name: 'National Heroes Day', type: 'Regular Holiday', backgroundImageUrl: 'https://i.ebayimg.com/images/g/eoIAAOSw2WxlFu0G/s-l1200.jpg' },
    { month: 10, day: 1, name: "All Saints' Day", type: 'Special Non-Working Day', backgroundImageUrl: 'https://www.farmersalmanac.com/wp-content/uploads/2020/11/book-of-remembrance-all-souls-as_259946483-1024x682-1-950x633.jpeg' },
    { month: 10, day: 2, name: "All Souls' Day", type: 'Special Non-Working Day', backgroundImageUrl: 'https://www.farmersalmanac.com/wp-content/uploads/2020/11/book-of-remembrance-all-souls-as_259946483-1024x682-1-950x633.jpeg' },
    { month: 10, day: 30, name: 'Bonifacio Day', type: 'Regular Holiday', backgroundImageUrl: 'https://media.diy.com/is/image/KingfisherDigital/grandeco-life-wood-panels-green-wallpaper-a49204~5411012465988_02c_MP?$MOB_PREV$&$width=600&$height=600' },
    { month: 11, day: 8, name: 'Feast of the Immaculate Conception', type: 'Special Non-Working Day', backgroundImageUrl: 'https://framerusercontent.com/images/jbg1aNUPAjdSRv4pNOBijvBME.png?width=1800&height=1488' },
    { month: 11, day: 24, name: 'Christmas Eve', type: 'Special Non-Working Day', backgroundImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1Mwq5fLIZnONs7hymvfSDQykzt-LVWCkXRg&s' },
    { month: 11, day: 25, name: 'Christmas Day', type: 'Regular Holiday', backgroundImageUrl: 'https://www.thefactsite.com/wp-content/uploads/2021/12/christmas-day-facts.jpg' },
    { month: 11, day: 30, name: 'Rizal Day', type: 'Regular Holiday', backgroundImageUrl: 'https://lens.usercontent.google.com/banana?agsi=CmdnbG9iYWw6OjAwMDA1NWNmZWM3MDAyNmQ6MDAwMDAwZWI6MTozZjVlNzM4MGM4NzM5YWQ4OjAwMDA1NWNmZWM3MDAyNmQ6MDAwMDAxODE0OWEwMzM2ODowMDA2NGQ1YWRiMzliYmJmEAI=' },
    { month: 11, day: 31, name: 'Last Day of the Year', type: 'Special Non-Working Day', backgroundImageUrl: 'https://www.holidaysmart.com/sites/default/files/holidays/images/islam-muslim%20holidays-Eid-al-Fitr-cv.jpg' },
  ];

  const getHolidayEntry = (date: Date) => {
    const month = date.getMonth();
    const day = date.getDate();

    return PHILIPPINE_HOLIDAYS.find((holiday) => holiday.month === month && holiday.day === day) || null;
  };

  const getHolidayEntryByDateKey = (dateKey: string) => {
    const [yearPart, monthPart, dayPart] = dateKey.split('-');
    const year = Number(yearPart);
    const month = Number(monthPart) - 1;
    const day = Number(dayPart);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return PHILIPPINE_HOLIDAYS.find((holiday) => holiday.month === month && holiday.day === day) || null;
  };

  const getCalendarCells = (): Array<Date | null> => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  };

  const calendarCells = getCalendarCells();
  const todayDate = currentDateTime;
  const selectedDateHoliday = selectedDateKey ? getHolidayEntryByDateKey(selectedDateKey) : null;
  const todayHoliday = getHolidayEntry(todayDate);
  const activeFrameHoliday = selectedDateHoliday || todayHoliday;
  const defaultHolidayBackgroundUrl = 'https://www.holidaysmart.com/sites/default/files/holidays/images/islam-muslim%20holidays-Eid-al-Fitr-cv.jpg';
  const activeHolidayBackgroundUrl = activeFrameHoliday?.backgroundImageUrl || (activeFrameHoliday ? defaultHolidayBackgroundUrl : null);
  const shouldShowHolidayFrameBackground = Boolean(activeHolidayBackgroundUrl);
  const monthNumberLabel = String(calendarDate.getMonth() + 1).padStart(2, '0');
  const monthNameLabel = calendarDate.toLocaleDateString('en-US', { month: 'long' });
  const yearLabel = calendarDate.getFullYear();
  const goToPreviousMonth = () => setCalendarDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCalendarDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));

  if (authLoading && !user) return null;

  if (!user) return null;
  const menuItems: Array<{ label: UserSection }> = [
    { label: 'Dashboard' },
    { label: 'My Progress' },
    { label: 'Tasks' },
    { label: 'Performance' },
  ];

  const settingsItems: Array<{ label: UserSection }> = [
    { label: 'Settings' },
  ];

  const sectionCopy: Record<Exclude<UserSection, 'Dashboard'>, string> = {
    'My Progress': 'This is My Progress',
    'Tasks': 'This is Task',
    'Performance': 'This is a Performance',
    'Settings': 'This is Settings',
  };
  const filteredTasks = SAMPLE_TASKS.filter((task) =>
    task.title.toLowerCase().includes(taskSearchTerm.trim().toLowerCase())
  );
  const completedTaskCount = SAMPLE_TASKS.filter((task) => task.completed).length;
  const totalTaskCount = SAMPLE_TASKS.length;

  return (
    <div className={`min-h-screen flex font-sans transition-colors ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-[#1a1a1a]'}`}>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/45 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-72 lg:w-24' : 'w-72 lg:w-64'} border-r flex flex-col p-6 fixed h-full z-20 transition-all duration-300 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-100'}`}>
        <div className={`mb-12 ${isSidebarCollapsed ? 'space-y-3' : ''}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}>
            <div
              className={`flex items-center cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
              onClick={() => setIsProfileOpen(true)}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                ⚡
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className={`font-bold text-xl tracking-tight transition-colors ${darkMode ? 'text-white group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>Lifewood</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold transition-colors ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>User</span>
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false);
                  return;
                }
                setIsSidebarCollapsed((prev) => !prev);
              }}
              className={`rounded-lg p-1 transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'}`}
              title={typeof window !== 'undefined' && window.innerWidth < 1024 ? 'Close sidebar' : isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={typeof window !== 'undefined' && window.innerWidth < 1024 ? 'Close sidebar' : isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="flex flex-col justify-center gap-0.5 w-5 h-5">
                <span className={`h-0.5 rounded-sm transition-all ${darkMode ? 'bg-slate-200' : 'bg-black'}`}></span>
                <span className={`h-0.5 rounded-sm transition-all ${darkMode ? 'bg-slate-200' : 'bg-black'}`}></span>
                <span className={`h-0.5 rounded-sm transition-all ${darkMode ? 'bg-slate-200' : 'bg-black'}`}></span>
              </span>
            </button>
          </div>
        </div>
        <div className="flex-grow">
          <div className="mb-8">
            {!isSidebarCollapsed && (
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-4 ${darkMode ? 'text-slate-500' : 'text-emerald-600/40'}`}>Main Menu</p>
            )}
            <ul className="space-y-2 list-none p-0">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => setActiveSection(item.label)}
                    onMouseUp={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'text-left'} px-4 py-3 rounded-xl transition-all ${
                      activeSection === item.label
                        ? darkMode
                          ? 'bg-slate-800 text-emerald-400 border-r-4 border-emerald-400'
                          : 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-600'
                        : darkMode
                          ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                    }`}
                  >
                    {isSidebarCollapsed ? (
                      <span className="text-sm font-bold">{item.label.charAt(0)}</span>
                    ) : (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {!isSidebarCollapsed && (
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 px-4 ${darkMode ? 'text-slate-500' : 'text-emerald-600/40'}`}>Settings</p>
            )}
            <ul className="space-y-2 list-none p-0">
              {settingsItems.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => setActiveSection(item.label)}
                    onMouseUp={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'text-left'} px-4 py-3 rounded-xl transition-all ${
                      activeSection === item.label
                        ? darkMode
                          ? 'bg-slate-800 text-emerald-400 border-r-4 border-emerald-400'
                          : 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-600'
                        : darkMode
                          ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                    }`}
                  >
                    {isSidebarCollapsed ? (
                      <span className="text-sm font-bold">{item.label.charAt(0)}</span>
                    ) : (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User Profile */}
        <div className={`mt-auto pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-emerald-100'}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-emerald-50/50'}`}>
            <div
              className={`flex items-center cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
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
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className={`text-sm font-bold truncate transition-colors ${darkMode ? 'text-slate-100 group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>{profile?.full_name || user.email?.split('@')[0] || 'User'}</p>
                  <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>{profile?.role || 'User'}</p>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button
                onClick={handleSignOut}
                className={`transition-colors ${darkMode ? 'text-slate-500 hover:text-emerald-400' : 'text-gray-400 hover:text-emerald-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`relative flex-grow ml-0 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-64'} p-4 sm:p-6 lg:p-8 overflow-hidden transition-all duration-300`}>
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <Aurora
            amplitude={0.9}
            blend={0.45}
            speed={0.8}
          />
        </div>

        <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 mt-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`lg:hidden w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
            aria-label="Open sidebar"
          >
            <span className="flex flex-col justify-center gap-0.5 w-4 h-4">
              <span className="h-0.5 rounded-sm bg-current"></span>
              <span className="h-0.5 rounded-sm bg-current"></span>
              <span className="h-0.5 rounded-sm bg-current"></span>
            </span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              type="button"
              aria-label="Notifications"
              className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .738-1.674C19.41 13.956 18 12.499 18 8a6 6 0 0 0-12 0c0 4.499-1.411 5.956-2.738 7.326"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700' : 'bg-gray-100 border-gray-200 text-emerald-600 hover:bg-gray-200'}`}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border p-0.5 overflow-hidden transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.full_name || 'Profile'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-violet-500 text-white flex items-center justify-center text-[8px] font-bold">
                  {(profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </div>

        {activeSection === 'Dashboard' ? (
          <>
        {/* Hero Section */}
        <section
          className={`relative rounded-[32px] lg:rounded-[40px] p-6 sm:p-8 lg:p-12 text-white overflow-hidden mb-6 lg:mb-8 min-h-[420px] lg:min-h-[450px] flex flex-col justify-between shadow-xl transition-all ${shouldShowHolidayFrameBackground ? 'bg-[#1a2e1a] shadow-emerald-900/20' : darkMode ? 'bg-slate-800 shadow-emerald-900/10' : 'bg-[#1a2e1a] shadow-emerald-900/20'}`}
          style={
            shouldShowHolidayFrameBackground
              ? {
                  backgroundImage: `linear-gradient(rgba(12, 35, 22, 0.72), rgba(12, 35, 22, 0.72)), url("${activeHolidayBackgroundUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : undefined
          }
        >
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
             <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-gradient-to-l from-emerald-500/20 to-transparent blur-3xl rounded-full transform rotate-12"></div>
          </div>

          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 ${darkMode ? 'bg-slate-700' : 'bg-white/10'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Learning Path</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold max-w-2xl leading-[1.1] mb-8 lg:mb-12">
              {profile?.current_course || 'Your AI Learning Journey Starts Here.'}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <button className="bg-emerald-500 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20">
                Continue Learning
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </button>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-emerald-100/60'}`}>Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!</span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mt-8 lg:mt-12">
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
          <div className={`absolute top-8 right-8 z-20 pointer-events-auto backdrop-blur-md border rounded-[32px] p-6 w-[300px] hidden lg:block transition-colors ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white/5 border-white/10'}`}>
             <div className="flex justify-between items-center mb-6">
                <div>
                  <p className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>{monthNumberLabel} \ {yearLabel}</p>
                  <p className="text-xl font-bold">{monthNameLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-white/5 text-emerald-100/40 hover:text-white'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-white/5 text-emerald-100/40 hover:text-white'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
             </div>
             
             <div className={`grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold mb-4 ${darkMode ? 'text-slate-500' : 'text-emerald-100/40'}`}>
                <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
             </div>
             <div key={`${yearLabel}-${monthNumberLabel}`} className="grid grid-cols-7 gap-y-4 text-center text-sm font-medium">
                {calendarCells.map((cellDate, cellIndex) => {
                  if (!cellDate) {
                    return <span key={`empty-${cellIndex}`} className="h-8"></span>;
                  }

                  const holiday = getHolidayEntry(cellDate);
                  const isToday = isSameDay(cellDate, todayDate);
                  const isSpecialWorkingHoliday = holiday?.type === 'Special Working Day';
                  const dateKey = getDateKey(cellDate);
                  const isSelectedDate = selectedDateKey === dateKey;
                  const dayNumberClass = `w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isToday
                      ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30'
                      : holiday
                        ? isSpecialWorkingHoliday
                          ? darkMode
                            ? 'text-yellow-300 font-bold'
                            : 'text-yellow-400 font-bold'
                          : darkMode
                            ? 'text-red-300 font-bold'
                            : 'text-red-400 font-bold'
                        : darkMode
                          ? 'text-slate-300'
                          : 'text-emerald-100/80'
                  }`;

                  return (
                    <div key={cellDate.toISOString()} className="relative flex items-center justify-center">
                      <div className="group relative">
                        {holiday ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDateKey(dateKey);
                              setCalendarDate(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
                            }}
                            className={`${dayNumberClass} cursor-pointer ${isSelectedDate ? 'ring-2 ring-emerald-400/80 ring-offset-1 ring-offset-transparent' : ''}`}
                          >
                            {cellDate.getDate()}
                          </button>
                        ) : isToday ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDateKey(dateKey);
                              setCalendarDate(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
                            }}
                            className={`${dayNumberClass} cursor-pointer ${isSelectedDate ? 'ring-2 ring-emerald-400/80 ring-offset-1 ring-offset-transparent' : ''}`}
                          >
                            {cellDate.getDate()}
                          </button>
                        ) : (
                          <span className={`${dayNumberClass} cursor-default select-none`}>
                            {cellDate.getDate()}
                          </span>
                        )}
                        {holiday && (
                          <>
                            <span className={`pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 -top-12 w-max max-w-[220px] text-center whitespace-normal leading-tight px-2 py-1 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity border ${darkMode ? 'bg-white text-lw-green border-emerald-400/40' : 'bg-white text-lw-green border-emerald-500/40'}`}>
                              {holiday.name}
                              <br />
                              {holiday.type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>


        {/* Bottom Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Activity Card */}
          <div className={`col-span-12 lg:col-span-5 rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Task</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Static task list</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 group hover:w-56 focus-within:w-56 transition-all duration-300 overflow-hidden">
                  <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                    placeholder="Search task..."
                    className={`w-full h-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400' : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'}`}
                  />
                </div>
                <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {completedTaskCount}/{totalTaskCount} Completed
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-emerald-500' : darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{task.title}</p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-2xl text-center text-sm ${darkMode ? 'bg-slate-900/40 text-slate-500 border border-slate-700' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  No task matched your search.
                </div>
              )}
            </div>
          </div>
          {/* Right Column Stats */}
          <div className="col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
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
            <div className={`sm:col-span-2 rounded-[40px] p-8 shadow-sm border flex items-center justify-between transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
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
          </>
        ) : (
          <section className={`relative rounded-[32px] lg:rounded-[40px] p-6 sm:p-8 lg:p-12 overflow-hidden min-h-[420px] lg:min-h-[520px] border shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <Aurora amplitude={0.9} blend={0.45} speed={0.8} />
            </div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
              <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{activeSection}</h2>
              <p className={`text-lg font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {sectionCopy[activeSection as Exclude<UserSection, 'Dashboard'>]}
              </p>
            </div>
          </section>
        )}
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

export default Employees;





