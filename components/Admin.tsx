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
const EMAILJS_SERVICE_ID = 'service_gtody9o';
const EMAILJS_ACCEPT_TEMPLATE_ID = 'template_0qxt2rp';
const EMAILJS_DECLINE_TEMPLATE_ID = 'template_10tdhwj';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

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
  const [internSearchTerm, setInternSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [expandedManageFrames, setExpandedManageFrames] = useState<Array<'interns' | 'pending' | 'employees'>>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [applicantActionNotice, setApplicantActionNotice] = useState('');
  const [isUpdatingApplicantStatus, setIsUpdatingApplicantStatus] = useState(false);
  const [openApplicantActionMenuId, setOpenApplicantActionMenuId] = useState<string | null>(null);
  const [applicantRowActionId, setApplicantRowActionId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [evaluationRoleFilter, setEvaluationRoleFilter] = useState<'intern' | 'employee'>('intern');
  const [selectedEvaluationUserId, setSelectedEvaluationUserId] = useState('');
  const [evaluationDecision, setEvaluationDecision] = useState<'pass' | 'fail' | 'pending'>('pending');
  const [evaluationComment, setEvaluationComment] = useState('');
  const [evaluationNotice, setEvaluationNotice] = useState('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const [reportRoleView, setReportRoleView] = useState<'intern' | 'employee' | 'all'>('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportSortBy, setReportSortBy] = useState<'consistency' | 'completion' | 'efficiency'>('consistency');
  const [reportNotice, setReportNotice] = useState('');
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);
  const applicantActionMenuRef = useRef<HTMLDivElement | null>(null);

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

  const normalizeApplicationStatus = (status?: string): 'pending' | 'accepted' | 'declined' | 'archived' => {
    const normalized = (status || '').toString().trim().toLowerCase();
    if (normalized === 'accepted' || normalized === 'declined' || normalized === 'archived' || normalized === 'pending') {
      return normalized;
    }
    return 'pending';
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

  const clampPercentage = (value: any, fallback = 55) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, numeric));
  };

  const getConsistencyScore = (profileItem: any) => {
    const completion = clampPercentage(profileItem?.completion, 55);
    const efficiency = clampPercentage(profileItem?.efficiency, 55);
    const hoursSpent = Math.max(0, Number(profileItem?.hours_spent || 0));
    const hoursBoost = Math.min(10, Math.round(hoursSpent / 10));
    const evaluation = (profileItem?.evaluation_result || '').toString().toLowerCase();
    const grade = (profileItem?.grade || '').toString().toLowerCase();
    const evaluationBoost = evaluation === 'pass' || grade === 'pass' ? 6 : evaluation === 'fail' || grade === 'fail' ? -6 : 0;

    return Math.max(0, Math.min(100, Math.round(completion * 0.5 + efficiency * 0.4 + hoursBoost + evaluationBoost)));
  };

  const getConsistencyBand = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Stable';
    if (score >= 55) return 'Watch';
    return 'At Risk';
  };

  const matchesFirstNameSearch = (profile: any, searchValue: string) => {
    const term = searchValue.trim().toLowerCase();
    if (term === '') return true;
    return getFirstName(profile).toLowerCase().startsWith(term);
  };

  const toggleManageFrameExpansion = (frame: 'interns' | 'pending' | 'employees') => {
    setExpandedManageFrames((prev) => {
      if (prev.includes(frame)) {
        if (prev.length >= 2 && prev[0] === frame) {
          // If multiple frames are expanded, clicking the top one sends it to bottom.
          return [...prev.slice(1), frame];
        }
        return prev.filter((item) => item !== frame);
      }

      if (prev.length === 0) return [frame];
      if (prev.length === 1) return [...prev, frame];
      if (prev.length === 2) return [...prev, frame];

      return prev;
    });
  };

  const isManageFrameExpanded = (frame: 'interns' | 'pending' | 'employees') =>
    expandedManageFrames.includes(frame);

  const getManageFrameLayoutClass = (frame: 'interns' | 'pending' | 'employees') => {
    const firstExpanded = expandedManageFrames[0];
    const secondExpanded = expandedManageFrames[1];
    const thirdExpanded = expandedManageFrames[2];

    if (frame === firstExpanded) return 'lg:col-span-2 lg:order-1';
    if (frame === secondExpanded) return 'lg:col-span-2 lg:order-2';
    if (frame === thirdExpanded) return 'lg:col-span-2 lg:order-3';

    if (expandedManageFrames.length === 0) return '';
    if (frame === 'interns') return 'lg:order-3';
    if (frame === 'pending') return 'lg:order-4';
    return 'lg:order-5';
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
      if (applicantActionMenuRef.current && !applicantActionMenuRef.current.contains(event.target as Node)) {
        setOpenApplicantActionMenuId(null);
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

  const sendApplicationDecisionEmail = async (application: any, status: 'accepted' | 'declined') => {
    const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim() || '';
    if (!publicKey) {
      throw new Error('Missing VITE_EMAILJS_PUBLIC_KEY in .env');
    }

    const templateId = status === 'accepted' ? EMAILJS_ACCEPT_TEMPLATE_ID : EMAILJS_DECLINE_TEMPLATE_ID;
    const applicantName = `${application?.first_name || ''} ${application?.last_name || ''}`.trim() || 'Applicant';
    const applicantEmail = (application?.email || '').toString().trim();
    if (!applicantEmail) {
      throw new Error('Applicant email is empty');
    }
    const decisionLabel = status === 'accepted' ? 'Accepted' : 'Declined';

    const basePayload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: templateId,
      template_params: {
        name: applicantName,
        title: application?.project_applied || 'Lifewood Position',
        email: applicantEmail,
        to_name: applicantName,
        to_email: applicantEmail,
        user_email: applicantEmail,
        recipient: applicantEmail,
        reply_to: applicantEmail,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        project_applied: application?.project_applied || '',
        application_status: decisionLabel,
        decision_message:
          status === 'accepted'
            ? `Congratulations ${applicantName}, your application has been accepted.`
            : `Thank you ${applicantName} for applying. Your application was not selected this cycle.`,
        decision_date: new Date().toLocaleDateString(),
      },
    };

    const sendRequest = async (payload: Record<string, any>) => {
      const response = await fetch(EMAILJS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) return;

      const rawError = await response.text().catch(() => '');
      let parsedError = rawError || `EmailJS request failed (${response.status})`;

      try {
        const jsonError = JSON.parse(rawError);
        parsedError = jsonError?.message || jsonError?.text || parsedError;
      } catch (_) {
        // Keep raw text when JSON parsing fails.
      }

      throw new Error(parsedError);
    };

    try {
      await sendRequest({
        ...basePayload,
        public_key: publicKey,
      });
    } catch (firstError) {
      try {
        await sendRequest({
          ...basePayload,
          user_id: publicKey,
        });
      } catch (secondError) {
        const firstMessage = firstError instanceof Error ? firstError.message : '';
        const secondMessage = secondError instanceof Error ? secondError.message : '';
        throw new Error(secondMessage || firstMessage || 'EmailJS failed');
      }
    }
  };

  if (authLoading && !user) return null;

  if (!user) return null;
  const handleUpdateApplicationStatus = async (application: any, status: 'accepted' | 'declined') => {
    if (!application?.id) return;
    setIsUpdatingApplicantStatus(true);
    setApplicantActionNotice('');

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', application.id);
      
      if (error) throw error;
      
      setApplications((prev) => prev.map((app) => app.id === application.id ? { ...app, status } : app));

      try {
        await sendApplicationDecisionEmail(application, status);
        setApplicantActionNotice(
          status === 'accepted'
            ? 'Application accepted and acceptance email sent.'
            : 'Application declined and decline email sent.'
        );
      } catch (emailError) {
        console.error('EmailJS send error:', emailError);
        const errorMessage =
          emailError instanceof Error && emailError.message
            ? emailError.message.replace(/\s+/g, ' ').slice(0, 180)
            : 'Unknown EmailJS error';
        setApplicantActionNotice(
          status === 'accepted'
            ? `Application accepted, but acceptance email was not sent. (${errorMessage})`
            : `Application declined, but decline email was not sent. (${errorMessage})`
        );
      }

      setSelectedApplicant(null);
    } catch (error) {
      console.error('Error updating application status:', error);
      setApplicantActionNotice('Unable to update application status right now.');
    } finally {
      setIsUpdatingApplicantStatus(false);
    }
  };

  const handleArchiveApplication = async (application: any) => {
    if (!application?.id) return;

    const currentStatus = normalizeApplicationStatus(application.status);
    if (currentStatus === 'archived') {
      setApplicantActionNotice('Application is already archived.');
      setOpenApplicantActionMenuId(null);
      return;
    }

    setApplicantRowActionId(application.id);
    setApplicantActionNotice('');

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'archived' })
        .eq('id', application.id);

      if (error) throw error;

      setApplications((prev) => prev.map((app) => (
        app.id === application.id ? { ...app, status: 'archived' } : app
      )));
      setOpenApplicantActionMenuId(null);
      setApplicantActionNotice('Application archived successfully.');
    } catch (error) {
      console.error('Error archiving application:', error);
      setApplicantActionNotice('Unable to archive application right now.');
    } finally {
      setApplicantRowActionId(null);
    }
  };

  const handleDeleteApplication = async (application: any) => {
    if (!application?.id) return;
    if (!confirm('Are you sure you want to delete this application?')) return;

    setApplicantRowActionId(application.id);
    setApplicantActionNotice('');

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id);

      if (error) throw error;

      setApplications((prev) => prev.filter((app) => app.id !== application.id));
      if (selectedApplicant?.id === application.id) {
        setSelectedApplicant(null);
      }
      setOpenApplicantActionMenuId(null);
      setApplicantActionNotice('Application deleted successfully.');
    } catch (error) {
      console.error('Error deleting application:', error);
      setApplicantActionNotice('Unable to delete application right now.');
    } finally {
      setApplicantRowActionId(null);
    }
  };

  const evaluationCandidates = getEvaluationCandidates();
  const selectedEvaluationUser =
    evaluationCandidates.find((candidate) => candidate.id === selectedEvaluationUserId) || null;
  const pendingApplications = applications.filter((app) => normalizeApplicationStatus(app.status) === 'pending');
  const reviewedApplications = applications.filter((app) => normalizeApplicationStatus(app.status) !== 'pending');
  const evaluationInsight = selectedEvaluationUser ? getAiInsight(selectedEvaluationUser) : null;
  const approvedInternProfiles = allProfiles.filter((p) => p?.is_approved === true && isInternLikeRole(getNormalizedRole(p)));
  const approvedEmployeeProfiles = allProfiles.filter((p) => p?.is_approved === true && isEmployeeLikeRole(getNormalizedRole(p)));
  const manageInternProfiles = allProfiles.filter((p) => (p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user') && p.is_approved === true);
  const manageEmployeeProfiles = allProfiles.filter((p) => (p.role?.toLowerCase() === 'employee' || p.role?.toLowerCase() === 'admin') && p.is_approved === true);
  const filteredManageInternProfiles = manageInternProfiles.filter((p) => matchesFirstNameSearch(p, internSearchTerm));
  const filteredManageEmployeeProfiles = manageEmployeeProfiles.filter((p) => matchesFirstNameSearch(p, employeeSearchTerm));
  const filteredManagePendingProfiles = pendingProfiles.filter((p) => matchesFirstNameSearch(p, pendingSearchTerm));
  const internReportRows = approvedInternProfiles.map((profileItem) => ({
    id: String(profileItem.id),
    name: profileItem.full_name || getFirstName(profileItem),
    firstName: getFirstName(profileItem),
    email: profileItem.email || 'N/A',
    role: 'Intern',
    completion: clampPercentage(profileItem?.completion, 55),
    efficiency: clampPercentage(profileItem?.efficiency, 55),
    consistency: getConsistencyScore(profileItem),
    scoreBand: getConsistencyBand(getConsistencyScore(profileItem)),
  }));
  const employeeReportRows = approvedEmployeeProfiles.map((profileItem) => ({
    id: String(profileItem.id),
    name: profileItem.full_name || getFirstName(profileItem),
    firstName: getFirstName(profileItem),
    email: profileItem.email || 'N/A',
    role: 'Employee',
    completion: clampPercentage(profileItem?.completion, 55),
    efficiency: clampPercentage(profileItem?.efficiency, 55),
    consistency: getConsistencyScore(profileItem),
    scoreBand: getConsistencyBand(getConsistencyScore(profileItem)),
  }));
  const reportRowsByRole =
    reportRoleView === 'intern'
      ? internReportRows
      : reportRoleView === 'employee'
      ? employeeReportRows
      : [...internReportRows, ...employeeReportRows];
  const sortedReportRows = [...reportRowsByRole].sort((a, b) => {
    if (reportSortBy === 'completion') return b.completion - a.completion;
    if (reportSortBy === 'efficiency') return b.efficiency - a.efficiency;
    return b.consistency - a.consistency;
  });
  const filteredReportRows = sortedReportRows.filter((row) => {
    const query = reportSearchTerm.trim().toLowerCase();
    if (!query) return true;
    return row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query);
  });
  const reportChartData = filteredReportRows.slice(0, 8).map((row) => ({
    name: row.firstName,
    consistency: row.consistency,
    completion: row.completion,
    efficiency: row.efficiency,
  }));
  const internConsistencyAverage = internReportRows.length
    ? Math.round(internReportRows.reduce((sum, row) => sum + row.consistency, 0) / internReportRows.length)
    : 0;
  const employeeConsistencyAverage = employeeReportRows.length
    ? Math.round(employeeReportRows.reduce((sum, row) => sum + row.consistency, 0) / employeeReportRows.length)
    : 0;
  const activeConsistencyAverage = filteredReportRows.length
    ? Math.round(filteredReportRows.reduce((sum, row) => sum + row.consistency, 0) / filteredReportRows.length)
    : 0;
  const activeHighConsistencyCount = filteredReportRows.filter((row) => row.consistency >= 80).length;
  const activeAtRiskCount = filteredReportRows.filter((row) => row.consistency < 55).length;
  const consistencyTrendData = [
    { month: 'Jan', interns: Math.max(0, internConsistencyAverage - 8), employees: Math.max(0, employeeConsistencyAverage - 6) },
    { month: 'Feb', interns: Math.max(0, internConsistencyAverage - 5), employees: Math.max(0, employeeConsistencyAverage - 4) },
    { month: 'Mar', interns: Math.max(0, internConsistencyAverage - 3), employees: Math.max(0, employeeConsistencyAverage - 2) },
    { month: 'Apr', interns: Math.max(0, internConsistencyAverage - 1), employees: Math.max(0, employeeConsistencyAverage) },
    { month: 'May', interns: Math.min(100, internConsistencyAverage + 2), employees: Math.min(100, employeeConsistencyAverage + 2) },
    { month: 'Jun', interns: Math.min(100, internConsistencyAverage + 4), employees: Math.min(100, employeeConsistencyAverage + 3) },
  ];
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

  const handleReportAction = (action: 'Reminder' | 'Coaching', row: { name: string }) => {
    setReportNotice(`${action} action prepared for ${row.name}.`);
    window.setTimeout(() => {
      setReportNotice('');
    }, 2500);
  };

  const handleOpenEvaluation = (row: { id: string; role: string }) => {
    setEvaluationRoleFilter(row.role.toLowerCase() === 'employee' ? 'employee' : 'intern');
    setSelectedEvaluationUserId(row.id);
    setActiveTab('Evaluation');
  };

  const handleExportConsistencyCsv = () => {
    if (!filteredReportRows.length) {
      setReportNotice('No rows to export with current filters.');
      return;
    }

    const csvHeader = 'Name,Email,Role,Consistency,Completion,Efficiency,Band';
    const csvRows = filteredReportRows.map((row) =>
      [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.email.replace(/"/g, '""')}"`,
        row.role,
        row.consistency,
        row.completion,
        row.efficiency,
        row.scoreBand,
      ].join(',')
    );

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consistency-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setReportNotice('Report exported successfully.');
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
            <div className="flex items-center justify-center gap-2">
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
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'text-slate-500 hover:text-emerald-400 hover:bg-slate-700/60' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
          <div className="space-y-8">
            <div className={`rounded-[40px] p-8 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#1a1a1a]'}`}>Consistency Reports</h2>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Performance stability insights for interns and employees.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-700/70' : 'bg-emerald-50'}`}>
                    {[
                      { label: 'All', value: 'all' as const },
                      { label: 'Interns', value: 'intern' as const },
                      { label: 'Employees', value: 'employee' as const },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setReportRoleView(item.value)}
                        title={`Show ${item.label.toLowerCase()} report`}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                          reportRoleView === item.value
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : (darkMode ? 'text-slate-300 hover:text-emerald-300' : 'text-gray-500 hover:text-emerald-700')
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value)}
                      placeholder="Search name or email..."
                      className={`w-60 max-w-full px-4 py-2 rounded-xl border text-sm focus:outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400'
                      }`}
                    />
                  </div>

                  <select
                    value={reportSortBy}
                    onChange={(e) => setReportSortBy(e.target.value as 'consistency' | 'completion' | 'efficiency')}
                    title="Sort report table"
                    className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-emerald-200 text-gray-700'
                    }`}
                  >
                    <option value="consistency">Sort: Consistency</option>
                    <option value="completion">Sort: Completion</option>
                    <option value="efficiency">Sort: Efficiency</option>
                  </select>

                  <button
                    onClick={handleExportConsistencyCsv}
                    title="Download CSV report"
                    className="px-4 py-2 rounded-xl bg-[#1a2e1a] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#152515]"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div
                title="Average consistency score of current filtered users"
                className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Average Consistency</p>
                <p className={`text-4xl font-black mt-3 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{activeConsistencyAverage}%</p>
              </div>
              <div
                title="Users currently hitting consistency 80 or above"
                className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>High Consistency</p>
                <p className={`text-4xl font-black mt-3 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{activeHighConsistencyCount}</p>
              </div>
              <div
                title="Users with consistency below 55"
                className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Needs Intervention</p>
                <p className={`text-4xl font-black mt-3 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>{activeAtRiskCount}</p>
              </div>
              <div
                title="Total users included in this report view"
                className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total In View</p>
                <p className={`text-4xl font-black mt-3 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{filteredReportRows.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className={`xl:col-span-3 rounded-[32px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Consistency Trend</h3>
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Last 6 months</span>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={consistencyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="interns" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="employees" stroke="#1e293b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`xl:col-span-2 rounded-[32px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <h3 className={`text-lg font-bold mb-5 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Top Consistency Scores</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="consistency" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={`rounded-[36px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Detailed Consistency Table</h3>
                <div className="flex items-center gap-3">
                  {reportNotice && (
                    <span className={`text-xs font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {reportNotice}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setReportSearchTerm('');
                      setReportSortBy('consistency');
                      setReportRoleView('all');
                    }}
                    title="Reset report filters"
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
                      darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Role</th>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Consistency</th>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Completion</th>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Efficiency</th>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Band</th>
                      <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportRows.map((row) => (
                      <tr key={row.id} className={`border-b ${darkMode ? 'border-slate-700 hover:bg-slate-700/40' : 'border-black/5 hover:bg-gray-50'} transition-colors`}>
                        <td className="py-4">
                          <div>
                            <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{row.name}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{row.email}</p>
                          </div>
                        </td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.role}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            row.consistency >= 80
                              ? 'bg-emerald-100 text-emerald-700'
                              : row.consistency >= 55
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {row.consistency}%
                          </span>
                        </td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.completion}%</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.efficiency}%</td>
                        <td className={`py-4 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{row.scoreBand}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEvaluation(row)}
                              title="Open this user in Evaluation tab"
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700"
                            >
                              Evaluate
                            </button>
                            <button
                              onClick={() => handleReportAction('Reminder', row)}
                              title="Prepare reminder action"
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Reminder
                            </button>
                            <button
                              onClick={() => handleReportAction('Coaching', row)}
                              title="Prepare coaching action"
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                darkMode ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                              }`}
                            >
                              Coach
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredReportRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          No report data matches your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'Applicants' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#1a1a1a]'}`}>New Applicants</h2>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Applications from JoinModal</p>
              </div>
              {applicantActionNotice ? (
                <p className={`text-xs font-semibold ${applicantActionNotice.toLowerCase().includes('not sent') || applicantActionNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                  {applicantActionNotice}
                </p>
              ) : null}
            </div>

            <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Pending Applicants</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  {pendingApplications.length} pending
                </span>
              </div>
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
                    {pendingApplications.map((app) => (
                      <tr key={app.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                        <td className={`py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.phone || 'N/A'}</td>
                        <td className="py-4 text-sm font-bold text-lw-green">{app.project_applied}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="py-4">
                          <button
                            onClick={() => setSelectedApplicant(app)}
                            title="Review application and choose Accept or Decline"
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full transition-all ${darkMode ? 'bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 hover:scale-105' : 'bg-orange-50 text-orange-600 hover:scale-105'}`}
                          >
                            pending
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingApplications.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`py-12 text-center italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No pending applications</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Processed Applicants</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {reviewedApplications.length} records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Position</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Date</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest text-right ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewedApplications.map((app) => (
                      <tr key={app.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-black/5 hover:bg-gray-50'}`}>
                        <td className={`py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className="py-4 text-sm font-bold text-lw-green">{app.project_applied}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(app.updated_at || app.created_at).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span
                            className={`inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                              normalizeApplicationStatus(app.status) === 'accepted'
                                ? darkMode
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : 'bg-emerald-50 text-emerald-600'
                                : normalizeApplicationStatus(app.status) === 'declined'
                                  ? darkMode
                                    ? 'bg-red-500/10 text-red-300'
                                    : 'bg-red-50 text-red-600'
                                  : darkMode
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {normalizeApplicationStatus(app.status)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="relative inline-flex" ref={openApplicantActionMenuId === app.id ? applicantActionMenuRef : null}>
                            <button
                              type="button"
                              onClick={() => setOpenApplicantActionMenuId((prev) => (prev === app.id ? null : app.id))}
                              disabled={applicantRowActionId === app.id}
                              title="More actions"
                              className={`w-8 h-8 rounded-full border inline-flex items-center justify-center transition-colors disabled:opacity-50 ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="12" cy="5" r="1"/>
                                <circle cx="12" cy="19" r="1"/>
                              </svg>
                            </button>
                            {openApplicantActionMenuId === app.id && (
                              <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 w-32 rounded-xl border shadow-xl z-20 p-1 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <button
                                  type="button"
                                  onClick={() => handleArchiveApplication(app)}
                                  disabled={applicantRowActionId === app.id || normalizeApplicationStatus(app.status) === 'archived'}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                    darkMode
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Archive
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app)}
                                  disabled={applicantRowActionId === app.id}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${darkMode ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reviewedApplications.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`py-12 text-center italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No processed applications yet</td>
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
                        onClick={() => handleUpdateApplicationStatus(selectedApplicant, 'declined')}
                        disabled={isUpdatingApplicantStatus}
                        title="Decline this applicant and send decline email"
                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        {isUpdatingApplicantStatus ? 'Processing...' : 'Decline'}
                      </button>
                      <button 
                        onClick={() => handleUpdateApplicationStatus(selectedApplicant, 'accepted')}
                        disabled={isUpdatingApplicantStatus}
                        title="Accept this applicant and send acceptance email"
                        className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isUpdatingApplicantStatus ? 'Processing...' : 'Accept'}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Interns Table */}
              <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${getManageFrameLayoutClass('interns')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Interns</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="group relative">
                      <div className="relative w-10 h-10 group-hover:w-64 focus-within:w-64 transition-all duration-300 overflow-hidden">
                        <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search first name..."
                          value={internSearchTerm}
                          onChange={(e) => setInternSearchTerm(e.target.value)}
                          className={`w-full h-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400' : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleManageFrameExpansion('interns')}
                      title={isManageFrameExpanded('interns') ? 'Collapse frame' : 'Expand frame'}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-gray-50 border-emerald-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {isManageFrameExpanded('interns') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[36rem] pr-1">
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
                      {filteredManageInternProfiles.map((p, index) => (
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
                      {filteredManageInternProfiles.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No interns found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Approvals Table */}
              <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${getManageFrameLayoutClass('pending')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    </div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Pending Approvals</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="group relative">
                      <div className="relative w-10 h-10 group-hover:w-64 focus-within:w-64 transition-all duration-300 overflow-hidden">
                        <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search first name..."
                          value={pendingSearchTerm}
                          onChange={(e) => setPendingSearchTerm(e.target.value)}
                          className={`w-full h-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400' : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleManageFrameExpansion('pending')}
                      title={isManageFrameExpanded('pending') ? 'Collapse frame' : 'Expand frame'}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-gray-50 border-emerald-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {isManageFrameExpanded('pending') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[36rem] pr-1">
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
                      {filteredManagePendingProfiles.map((p, index) => (
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
                      {filteredManagePendingProfiles.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No pending approvals</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employees Table */}
              <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${getManageFrameLayoutClass('employees')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-[#1a2e1a] text-emerald-400' : 'bg-[#1a2e1a] text-emerald-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Employees</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="group relative">
                      <div className="relative w-10 h-10 group-hover:w-64 focus-within:w-64 transition-all duration-300 overflow-hidden">
                        <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search first name..."
                          value={employeeSearchTerm}
                          onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                          className={`w-full h-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400' : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleManageFrameExpansion('employees')}
                      title={isManageFrameExpanded('employees') ? 'Collapse frame' : 'Expand frame'}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-gray-50 border-emerald-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {isManageFrameExpanded('employees') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      )}
                    </button>
                  </div>
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
                      {filteredManageEmployeeProfiles.map((p, index) => (
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
                      {filteredManageEmployeeProfiles.length === 0 && (
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


