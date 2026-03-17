import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from './ProfileSidebar';

const ADMIN_EMAILS = ['damayojholmer@gmail.com', 'jholmerdamayo@gmail.com'];

const isMissingDeclinedColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('is_declined') && message.includes('does not exist');
};

const isMissingEvaluationColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('does not exist') && (message.includes('evaluation_comment') || message.includes('evaluation_result') || message.includes('last_evaluated_at'));
};

const getNormalizedRole = (profile: any) => (profile?.role || '').toString().trim().toLowerCase();

const getFirstName = (profile: any) => {
  const fullName = (profile?.full_name || '').toString().trim();
  if (fullName) return fullName.split(/\s+/)[0];
  const emailLocal = ((profile?.email || '').toString().split('@')[0] || '').trim();
  if (emailLocal) return emailLocal.split(/[._-]/)[0];
  return 'User';
};

const isInternLikeRole = (role: string) => role === 'intern' || role === 'user';

const isEmployeeLikeRole = (role: string) => role === 'employee' || role === 'admin';

const isOfficialMemberProfile = (profile: any) => {
  const role = getNormalizedRole(profile);
  return profile?.is_approved === true && (isInternLikeRole(role) || isEmployeeLikeRole(role));
};

const isPendingProfile = (profile: any) => {
  const email = (profile?.email || '').toLowerCase();
  const role = getNormalizedRole(profile);
  const isApproved = profile?.is_approved === true;
  const isDeclined = profile?.is_declined === true;

  return !isApproved && !isDeclined && role !== 'admin' && !ADMIN_EMAILS.includes(email);
};

const Admin: React.FC = () => {
  const { user, loading: authLoading, signOut: authSignOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
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
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [evaluationRoleFilter, setEvaluationRoleFilter] = useState<'intern' | 'employee'>('intern');
  const [selectedEvaluationUserId, setSelectedEvaluationUserId] = useState('');
  const [evaluationDecision, setEvaluationDecision] = useState<'pass' | 'fail' | 'pending'>('pending');
  const [evaluationComment, setEvaluationComment] = useState('');
  const [evaluationNotice, setEvaluationNotice] = useState('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

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

  const formatPendingProfileCode = (index: number) => String(index + 1);

  const formatManageProfileCode = (profile: any, index: number, group: 'intern' | 'employee') => {
    const code = (profile?.profile_code || '').toString().toUpperCase();
    const prefix = group === 'employee' ? 'EMP' : 'PH';
    const pattern = group === 'employee' ? /^EMP\d+$/ : /^PH\d+$/;
    if (pattern.test(code)) return code;
    return `${prefix}${String(index + 1).padStart(4, '0')}`;
  };

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
      fetchPendingApprovals();
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

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const resolveApprovedRole = (role?: string) => {
    const normalized = (role || '').toString().trim().toLowerCase();
    if (normalized === 'employee' || normalized === 'employees') return 'employee';
    if (normalized === 'intern' || normalized === 'interns' || normalized === 'user') return 'intern';
    return 'intern';
  };

  const getEvaluationCandidates = () =>
    allProfiles
      .filter((p) => {
        const role = (p?.role || '').toLowerCase();
        if (evaluationRoleFilter === 'intern') {
          return role === 'intern' || role === 'user';
        }
        return role === 'employee' || role === 'admin';
      })
      .sort((a, b) => (a?.full_name || '').localeCompare(b?.full_name || ''));

  const getAiInsight = (targetUser: any) => {
    const completion = Math.max(0, Math.min(100, Number(targetUser?.completion || 0)));
    const efficiency = Math.max(0, Math.min(100, Number(targetUser?.efficiency || 0)));
    const level = Math.max(1, Number(targetUser?.level || 1));
    const hoursSpent = Math.max(0, Number(targetUser?.hours_spent || 0));

    const score = Math.round(
      completion * 0.45 +
      efficiency * 0.45 +
      Math.min(level * 5, 10) +
      Math.min(hoursSpent / 10, 10)
    );

    if (score >= 80) {
      return {
        score,
        title: 'Doing very well',
        detail: 'Strong completion and efficiency trends. Candidate is ready for advanced tasks.',
      };
    }
    if (score >= 60) {
      return {
        score,
        title: 'Doing well',
        detail: 'Progress is steady, but focused coaching can improve consistency.',
      };
    }
    if (score >= 40) {
      return {
        score,
        title: 'Needs support',
        detail: 'Performance is below target. Recommend structured mentoring and weekly checkpoints.',
      };
    }
    return {
      score,
      title: 'At risk',
      detail: 'Low progress indicators. Immediate intervention and clear action plan are recommended.',
    };
  };

  const handleApproveUser = async (pendingUser: any) => {
    const approvedRole = resolveApprovedRole(pendingUser.role);
    setActioningUserId(pendingUser.id);
    let { error } = await supabase
      .from('profiles')
      .update({ 
        role: approvedRole,
        is_approved: true,
        is_declined: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingUser.id);

    if (error && isMissingDeclinedColumnError(error)) {
      const fallback = await supabase
        .from('profiles')
        .update({
          role: approvedRole,
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingUser.id);
      error = fallback.error;
    }
    
    if (!error) {
      setAllProfiles((prevProfiles) => prevProfiles.map((p) => (
        p.id === pendingUser.id
          ? { ...p, role: approvedRole, is_approved: true }
          : p
      )));
      setPendingProfiles((prevPending) => prevPending.filter((p) => p.id !== pendingUser.id));
      setActioningUserId(null);
      return;
    }

    console.error('Error approving user:', error);
    setActioningUserId(null);
  };

  const handleDeclineUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this pending request?')) return;
    setActioningUserId(userId);
    
    let { error } = await supabase
      .from('profiles')
      .update({
        is_declined: true,
        is_approved: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error && isMissingDeclinedColumnError(error)) {
      const fallback = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      error = fallback.error;
    }
    
    if (!error) {
      setAllProfiles((prevProfiles) => prevProfiles.filter((p) => p.id !== userId));
      setPendingProfiles((prevPending) => prevPending.filter((p) => p.id !== userId));
      setActioningUserId(null);
      return;
    }

    console.error('Error declining user:', error);
    setActioningUserId(null);
  };

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;

      const sortedProfiles = [...(data || [])].sort((a, b) => {
        const aTime = new Date(a?.created_at || a?.updated_at || 0).getTime();
        const bTime = new Date(b?.created_at || b?.updated_at || 0).getTime();
        return bTime - aTime;
      });

      setAllProfiles(sortedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('is_declined', true)
        .or('is_approved.eq.false,is_approved.is.null');

      if (error && isMissingDeclinedColumnError(error)) {
        const fallback = await supabase
          .from('profiles')
          .select('*')
          .or('is_approved.eq.false,is_approved.is.null');
        data = fallback.data as any;
        error = fallback.error;
      }

      if (error) throw error;

      let pendingData = data || [];

      // Fallback: if filtered query returns nothing, fetch all and filter locally.
      if (pendingData.length === 0) {
        let { data: allData, error: allError } = await supabase
          .from('profiles')
          .select('*');

        if (allError && isMissingDeclinedColumnError(allError)) {
          const fallback = await supabase
            .from('profiles')
            .select('*');
          allData = fallback.data as any;
          allError = fallback.error;
        }

        if (!allError) {
          pendingData = allData || [];
        }
      }

      const sortedPending = pendingData
        .filter(isPendingProfile)
        .sort((a, b) => {
          const aTime = new Date(a?.created_at || a?.updated_at || 0).getTime();
          const bTime = new Date(b?.created_at || b?.updated_at || 0).getTime();
          return aTime - bTime;
        });

      setPendingProfiles(sortedPending);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const refreshUsersData = async () => {
    await Promise.allSettled([fetchAllProfiles(), fetchPendingApprovals()]);
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          refreshUsersData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'Manage Users') {
      fetchPendingApprovals();
    }
    if (activeTab === 'Applicants') {
      fetchApplications();
    }
    if (activeTab === 'Evaluation') {
      fetchAllProfiles();
    }
  }, [activeTab]);

  useEffect(() => {
    const candidates = getEvaluationCandidates();

    if (candidates.length === 0) {
      setSelectedEvaluationUserId('');
      return;
    }

    if (!candidates.some((candidate) => candidate.id === selectedEvaluationUserId)) {
      setSelectedEvaluationUserId(candidates[0].id);
    }
  }, [evaluationRoleFilter, allProfiles, selectedEvaluationUserId]);

  useEffect(() => {
    if (!selectedEvaluationUserId) {
      setEvaluationDecision('pending');
      setEvaluationComment('');
      return;
    }

    const selectedProfile = allProfiles.find((p) => p.id === selectedEvaluationUserId);
    const storedResult = (selectedProfile?.evaluation_result || '').toLowerCase();
    const gradeValue = (selectedProfile?.grade || '').toLowerCase();
    const inferredDecision: 'pass' | 'fail' | 'pending' =
      storedResult === 'pass' || storedResult === 'fail'
        ? storedResult
        : gradeValue === 'pass'
          ? 'pass'
          : gradeValue === 'fail'
            ? 'fail'
            : 'pending';

    setEvaluationDecision(inferredDecision);
    setEvaluationComment(selectedProfile?.evaluation_comment || '');
    setEvaluationNotice('');
  }, [selectedEvaluationUserId, allProfiles]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  if (authLoading) return null;

  if (!user) return null;
  const handleUpdateApplicationStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      setApplications((prev) => prev.map((app) => app.id === id ? { ...app, status } : app));
      setSelectedApplicant(null);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const evaluationCandidates = getEvaluationCandidates();
  const selectedEvaluationUser =
    evaluationCandidates.find((candidate) => candidate.id === selectedEvaluationUserId) || null;
  const evaluationInsight = selectedEvaluationUser ? getAiInsight(selectedEvaluationUser) : null;
  const approvedInternProfiles = allProfiles.filter((p) => p?.is_approved === true && isInternLikeRole(getNormalizedRole(p)));
  const approvedEmployeeProfiles = allProfiles.filter((p) => p?.is_approved === true && isEmployeeLikeRole(getNormalizedRole(p)));
  const officialMemberProfiles = allProfiles.filter(isOfficialMemberProfile);
  const sortedOfficialMemberProfiles = [...officialMemberProfiles].sort((a, b) =>
    getFirstName(a).localeCompare(getFirstName(b), undefined, { sensitivity: 'base' })
  );
  const roleOptions: Array<{ label: string; value: string }> = [
    { label: 'All Roles', value: 'All' },
    { label: 'Employee', value: 'Employee' },
    { label: 'Intern', value: 'Intern' },
  ];

  const handleSaveEvaluation = async () => {
    if (!selectedEvaluationUser) {
      setEvaluationNotice('Select a user to evaluate.');
      return;
    }

    if (evaluationDecision === 'pending') {
      setEvaluationNotice('Choose Pass or Fail before saving.');
      return;
    }

    setIsSavingEvaluation(true);
    setEvaluationNotice('');

    try {
      const decisionLabel = evaluationDecision === 'pass' ? 'Pass' : 'Fail';
      const now = new Date().toISOString();
      const basePayload: any = {
        grade: decisionLabel,
        updated_at: now,
      };
      const fullPayload: any = {
        ...basePayload,
        evaluation_result: evaluationDecision,
        evaluation_comment: evaluationComment.trim() || null,
        last_evaluated_at: now,
      };

      let { error } = await supabase
        .from('profiles')
        .update(fullPayload)
        .eq('id', selectedEvaluationUser.id);

      if (error && isMissingEvaluationColumnError(error)) {
        const fallback = await supabase
          .from('profiles')
          .update(basePayload)
          .eq('id', selectedEvaluationUser.id);
        error = fallback.error;
      }

      if (error) throw error;

      setAllProfiles((prev) => prev.map((profileItem) => (
        profileItem.id === selectedEvaluationUser.id
          ? {
              ...profileItem,
              grade: decisionLabel,
              evaluation_result: evaluationDecision,
              evaluation_comment: evaluationComment.trim() || null,
              last_evaluated_at: now,
              updated_at: now,
            }
          : profileItem
      )));
      setEvaluationNotice('Evaluation saved successfully.');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setEvaluationNotice('Unable to save evaluation right now.');
    } finally {
      setIsSavingEvaluation(false);
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
      <aside
        className={`${isSidebarCollapsed ? 'w-24' : 'w-64'} border-r flex flex-col p-6 fixed h-full z-20 transition-all duration-300 overflow-y-auto backdrop-blur-xl ${darkMode ? 'bg-white/10 border-white/20 shadow-[0_0_30px_rgba(15,23,42,0.35)]' : 'bg-white/45 border-white/60 shadow-[0_0_30px_rgba(16,185,129,0.15)]'}`}
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className={`mb-12 ${isSidebarCollapsed ? 'space-y-3' : ''}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}>
            <button
              className="cursor-pointer group bg-transparent border-0 p-0"
              onClick={() => setIsProfileOpen(true)}
              title="Open profile"
            >
              <img
                src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429"
                alt="Lifewood"
                className={`${isSidebarCollapsed ? 'h-8 w-8 object-contain' : 'h-8 w-auto max-w-[140px]'}`}
                referrerPolicy="no-referrer"
              />
            </button>
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className={`rounded-lg p-1 transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'}`}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="flex flex-col justify-center gap-0.5 w-5 h-5">
                <span className={`h-0.5 rounded-sm transition-all ${darkMode ? 'bg-slate-200' : 'bg-black'}`}></span>
                <span className={`h-0.5 rounded-sm transition-all ${darkMode ? 'bg-slate-200' : 'bg-black'}`}></span>
                <span className={`h-0.5 rounded-sm transition-all ${darkMode ? 'bg-slate-200' : 'bg-black'}`}></span>
              </span>
            </button>
          </div>
          {!isSidebarCollapsed && (
            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${darkMode ? 'bg-white/10 text-emerald-300 border border-emerald-300/20' : 'bg-white/70 text-emerald-700 border border-emerald-200'}`}>Admin Hub</span>
          )}
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
                    onClick={() => setActiveTab(item.label)}
                    title={item.label}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.label
                        ? (darkMode ? 'bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-400' : 'bg-emerald-500/15 text-emerald-700 border-l-4 border-emerald-600')
                        : (darkMode ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/15' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-500/12')
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
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
                  <a
                    href="#"
                    title={item.label}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all no-underline ${darkMode ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/15' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-500/12'}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </a>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Light mode' : 'Dark mode'}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all ${darkMode ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/15' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-500/12'}`}
                >
                  <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
                  {!isSidebarCollapsed && <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* User Profile */}
        <div className={`mt-auto pt-6 border-t ${darkMode ? 'border-white/20' : 'border-emerald-200/60'}`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold hover:scale-105 transition-transform"
                title="Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'Profile'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.email?.[0].toUpperCase() || 'U'
                )}
              </button>
              <button
                onClick={handleSignOut}
                className={`transition-colors ${darkMode ? 'text-slate-500 hover:text-emerald-400' : 'text-gray-400 hover:text-emerald-600'}`}
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <div className={`flex items-center justify-between p-3 rounded-2xl ${darkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-emerald-100'}`}>
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
                  <p className={`text-sm font-bold truncate transition-colors ${darkMode ? 'text-slate-200 group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>{profile?.full_name || user.email?.split('@')[0] || 'User'}</p>
                  <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>{profile?.role || 'Intern Access'}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className={`transition-colors ${darkMode ? 'text-slate-500 hover:text-emerald-400' : 'text-gray-400 hover:text-emerald-600'}`}
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow ${isSidebarCollapsed ? 'ml-24' : 'ml-64'} p-8 transition-all duration-300`}>
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
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{approvedInternProfiles.length}</h3>
              </div>

              <div className={`rounded-[32px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/40' : 'bg-white border-black/5 hover:border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-50'}`}>Staff</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total Employee</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{approvedEmployeeProfiles.length}</h3>
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
                  {Math.max(1, Math.floor(officialMemberProfiles.length * (0.2 + Math.random() * 0.15)))}
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
                      <p className="text-sm text-gray-400">Manage and monitor all {officialMemberProfiles.length} platform members</p>
                    </div>
                    <button 
                      onClick={refreshUsersData}
                      className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      title="Refresh data"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 w-full sm:w-64 transition-colors"
                      />
                    </div>

                    {/* Role Filter Dropdown */}
                    <div className="relative min-w-[140px]" ref={roleDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                        className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-sm text-left focus:outline-none focus:border-emerald-400 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
                      >
                        {roleOptions.find((option) => option.value === roleFilter)?.label || 'All Roles'}
                      </button>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>

                      {isRoleDropdownOpen && (
                        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-lg">
                          {roleOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setRoleFilter(option.value);
                                setIsRoleDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                roleFilter === option.value
                                  ? 'bg-white text-emerald-700 font-medium hover:bg-emerald-100'
                                  : 'bg-white text-gray-700 hover:bg-emerald-100'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                      {sortedOfficialMemberProfiles
                        .filter(p => {
                          const term = searchTerm.trim().toLowerCase();
                          const firstName = getFirstName(p).toLowerCase();
                          const matchesSearch = term === '' || firstName.includes(term);
                          const matchesRole = roleFilter === 'All' || 
                                            (roleFilter === 'Employee' && p.role?.toLowerCase() === 'employee') ||
                                            (roleFilter === 'Intern' && p.role?.toLowerCase() === 'intern');
                          return matchesSearch && matchesRole;
                        })
                        .map((p) => (
                          <tr key={p.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors group">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                  {getFirstName(p)[0] || 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{getFirstName(p)}</p>
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
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#1a1a1a]'}`}>Evaluation</h2>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Review progress and finalize Pass or Fail with comments.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={evaluationRoleFilter}
                  onChange={(e) => setEvaluationRoleFilter(e.target.value as 'intern' | 'employee')}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-800'
                  }`}
                >
                  <option value="intern">Intern</option>
                  <option value="employee">Employee</option>
                </select>

                <select
                  value={selectedEvaluationUserId}
                  onChange={(e) => setSelectedEvaluationUserId(e.target.value)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[260px] ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-800'
                  }`}
                >
                  {evaluationCandidates.length === 0 ? (
                    <option value="">No users available</option>
                  ) : (
                    evaluationCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.full_name || candidate.email || candidate.id}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className={`rounded-[36px] p-8 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              {!selectedEvaluationUser ? (
                <div className="py-16 text-center">
                  <p className={`text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Select a user to start evaluation.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {selectedEvaluationUser.full_name || 'Unnamed User'}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {(selectedEvaluationUser.role || evaluationRoleFilter).toString()} • {selectedEvaluationUser.email || 'No email'}
                      </p>
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      (selectedEvaluationUser.is_approved === true)
                        ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                        : (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600')
                    }`}>
                      {(selectedEvaluationUser.is_approved === true) ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Current Work</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {selectedEvaluationUser.current_course || 'Introduction to AI Solutions'}
                      </p>
                    </div>
                    <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Completion</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {Number(selectedEvaluationUser.completion || 0)}%
                      </p>
                    </div>
                    <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Efficiency</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {Number(selectedEvaluationUser.efficiency || 0)}%
                      </p>
                    </div>
                    <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Hours Spent</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {Number(selectedEvaluationUser.hours_spent || 0)} hrs
                      </p>
                    </div>
                  </div>

                  {evaluationInsight && (
                    <div className={`rounded-2xl p-6 border ${
                      evaluationInsight.score >= 60
                        ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100')
                        : (darkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-100')
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                        evaluationInsight.score >= 60
                          ? (darkMode ? 'text-emerald-400' : 'text-emerald-600')
                          : (darkMode ? 'text-orange-400' : 'text-orange-600')
                      }`}>
                        AI Insight • Score {evaluationInsight.score}/100
                      </p>
                      <p className={`text-base font-bold mb-1 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{evaluationInsight.title}</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{evaluationInsight.detail}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Final Decision</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEvaluationDecision('pass')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                          evaluationDecision === 'pass'
                            ? 'bg-emerald-600 text-white'
                            : (darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')
                        }`}
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => setEvaluationDecision('fail')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                          evaluationDecision === 'fail'
                            ? (darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white')
                            : (darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-red-50 text-red-600 hover:bg-red-100')
                        }`}
                      >
                        Fail
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                      Comments
                    </label>
                    <textarea
                      value={evaluationComment}
                      onChange={(e) => setEvaluationComment(e.target.value)}
                      rows={4}
                      placeholder="Add feedback and next-step recommendations."
                      className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-50 border-black/10 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {evaluationNotice ? (
                      <p className={`text-xs font-medium ${evaluationNotice.toLowerCase().includes('success') ? 'text-emerald-500' : (darkMode ? 'text-orange-400' : 'text-orange-600')}`}>
                        {evaluationNotice}
                      </p>
                    ) : <span />}

                    <button
                      onClick={handleSaveEvaluation}
                      disabled={isSavingEvaluation || !selectedEvaluationUser}
                      className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingEvaluation ? 'Saving...' : 'Save Evaluation'}
                    </button>
                  </div>
                </div>
              )}
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
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Phone</th>
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
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.phone || 'N/A'}</td>
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
                        <td colSpan={6} className="py-12 text-center text-gray-400 italic">No applications found</td>
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
                onClick={refreshUsersData}
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
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>ID</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Phone</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Role</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.filter(p => (p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user') && p.is_approved === true).map((p, index) => (
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                          <td className={`py-4 text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatManageProfileCode(p, index, 'intern')}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                                {p.full_name?.[0] || 'U'}
                              </div>
                              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{p.full_name}</span>
                            </div>
                          </td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.email || 'N/A'}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.phone || 'N/A'}</td>
                          <td className={`py-4 text-sm capitalize ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{p.role || 'intern'}</td>
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
                      {allProfiles.filter(p => (p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user') && p.is_approved === true).length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No interns found</td>
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
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>ID</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Phone</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingProfiles.map((p, index) => (
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                          <td className={`py-4 text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatPendingProfileCode(index)}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                {p.full_name?.[0] || 'U'}
                              </div>
                              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{p.full_name}</span>
                            </div>
                          </td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.email || 'N/A'}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.phone || 'N/A'}</td>
                          <td className={`py-4 text-sm capitalize ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{resolveApprovedRole(p.role)}</td>
                          <td className="py-4 text-sm">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApproveUser(p)}
                                disabled={actioningUserId === p.id}
                                className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                              >
                                {actioningUserId === p.id ? 'Working...' : 'Accept'}
                              </button>
                              <button 
                                onClick={() => handleDeclineUser(p.id)}
                                disabled={actioningUserId === p.id}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              >
                                {actioningUserId === p.id ? 'Working...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingProfiles.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No pending approvals</td>
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
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>ID</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Phone</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Role</th>
                        <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfiles.filter(p => (p.role?.toLowerCase() === 'employee' || p.role?.toLowerCase() === 'admin') && p.is_approved === true).map((p, index) => (
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                          <td className={`py-4 text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatManageProfileCode(p, index, 'employee')}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                                {p.full_name?.[0] || 'U'}
                              </div>
                              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{p.full_name}</span>
                            </div>
                          </td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.email || 'N/A'}</td>
                          <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{p.phone || 'N/A'}</td>
                          <td className={`py-4 text-sm capitalize ${darkMode ? 'text-slate-300' : 'text-gray-900'}`}>{p.role}</td>
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
                      {allProfiles.filter(p => (p.role?.toLowerCase() === 'employee' || p.role?.toLowerCase() === 'admin') && p.is_approved === true).length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No employees found</td>
                        </tr>
                      )}
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


