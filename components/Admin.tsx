import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from './ProfileSidebar';
import ClickSpark from './ClickSpark';
import LightPillar from './LightPillar';

const ADMIN_EMAILS = ['damayojholmer@gmail.com', 'jholmerdamayo@gmail.com'];
const EMAILJS_SERVICE_ID = 'service_gtody9o';
const EMAILJS_ACCEPT_TEMPLATE_ID = 'template_0qxt2rp';
const EMAILJS_DECLINE_TEMPLATE_ID = 'template_10tdhwj';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const PROJECT_SUBMISSION_TABLE_CANDIDATES = ['project_submissions', 'project_submission'] as const;

const isMissingDeclinedColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('is_declined') && message.includes('does not exist');
};

const isMissingEvaluationColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('does not exist') && (message.includes('evaluation_comment') || message.includes('evaluation_result') || message.includes('last_evaluated_at'));
};

const isMissingPositionColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('does not exist') && message.includes('position');
};

const isMissingProjectSubmissionTableError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    (message.includes('relation') && message.includes('does not exist'))
  );
};

const isMissingTableError = (error: any, tableName?: string) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  const hasMissingTableSignal =
    error?.code === '42P01' ||
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    (message.includes('relation') && message.includes('does not exist'));

  if (!hasMissingTableSignal) return false;
  if (!tableName) return true;
  const normalizedTable = tableName.toLowerCase();
  return message.includes(normalizedTable) || !message.includes('public.');
};

const getNormalizedRole = (profile: any) => (profile?.role || '').toString().trim().toLowerCase();

const getFirstName = (profile: any) => {
  const fullName = (profile?.full_name || '').toString().trim();
  if (fullName) return fullName.split(/\s+/)[0];
  const emailLocal = ((profile?.email || '').toString().split('@')[0] || '').trim();
  if (emailLocal) return emailLocal.split(/[._-]/)[0];
  return 'User';
};

const getProfilePhotoUrl = (profile: any) =>
  (profile?.avatar_url ||
    profile?.profile_picture_url ||
    profile?.photo_url ||
    profile?.profile_image_url ||
    '').toString().trim();

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

type AdminTaskRole = 'intern' | 'employee';

type AdminTaskAttachment = {
  name: string;
  size: number;
  type: string;
};

type AdminTaskCriteria = {
  lifewoodBranding: string;
  colorPalettes: string;
  design: string;
  content: string;
};

type AdminTaskItem = {
  id: string;
  title: string;
  entryType: 'Task' | 'Projects';
  targetRole: AdminTaskRole;
  assignedProfileId?: string | null;
  assignedProfileName?: string | null;
  description: string;
  criteria: AdminTaskCriteria;
  attachment: AdminTaskAttachment | null;
  startedAt: string;
  deadline: string;
  createdAt: string;
};

type AdminApplicationItem = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  degree?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  cv_url?: string | null;
  project_applied?: string | null;
  position?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | 'archived' | string;
};

type ProjectSubmissionItem = {
  id: string;
  source_table?: 'project_submissions' | 'project_submission';
  created_at?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  contact_number?: string | null;
  project_name?: string | null;
  description?: string | null;
  project_link?: string | null;
  resource_link?: string | null;
  uploaded_file_name?: string | null;
  main_ai_need?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | string;
};

type SettingsView = 'general' | 'history' | 'security';

type AccountHistoryItem = {
  id: string;
  created_at?: string | null;
  action?: 'archived' | 'deleted' | string;
  source?: string | null;
  reference_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  notes?: string | null;
  acted_by?: string | null;
};

type ProjectHistoryItem = {
  id: string;
  created_at?: string | null;
  action?: 'declined' | 'deleted' | string;
  source_table?: string | null;
  reference_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  project_name?: string | null;
  notes?: string | null;
  acted_by?: string | null;
};

type LoginActivityItem = {
  id: string;
  created_at?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  user_agent?: string | null;
  login_at?: string | null;
};

type HistoryDeleteTarget =
  | {
      kind: 'account';
      row: AccountHistoryItem;
      title: string;
      message: string;
    }
  | {
      kind: 'project';
      row: ProjectHistoryItem;
      title: string;
      message: string;
    };

type DashboardTaskScope = 'all' | 'weekly' | 'monthly';

type ManageFrameKey = 'interns' | 'pending' | 'employees' | 'admins';

const MANAGE_FRAME_ORDER: ManageFrameKey[] = ['interns', 'pending', 'employees', 'admins'];
const ADMIN_POSITION_OPTIONS = ['Manager', 'Hr', 'CEO', 'Senior Developer'];
const APP_LANGUAGE_OPTIONS = ['English', 'Filipino', 'Japanese', 'Mandarin'];

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
  const [internProgressSearchTerm, setInternProgressSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [expandedManageFrames, setExpandedManageFrames] = useState<ManageFrameKey[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [applications, setApplications] = useState<AdminApplicationItem[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<AdminApplicationItem | null>(null);
  const [applicantActionNotice, setApplicantActionNotice] = useState('');
  const [isUpdatingApplicantStatus, setIsUpdatingApplicantStatus] = useState(false);
  const [openApplicantActionMenuId, setOpenApplicantActionMenuId] = useState<string | null>(null);
  const [applicantRowActionId, setApplicantRowActionId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [manageUsersNotice, setManageUsersNotice] = useState('');
  const [manageDeleteProfile, setManageDeleteProfile] = useState<any>(null);
  const [isDeletingManageProfile, setIsDeletingManageProfile] = useState(false);
  const [evaluationRoleFilter, setEvaluationRoleFilter] = useState<'intern' | 'employee'>('intern');
  const [selectedEvaluationUserId, setSelectedEvaluationUserId] = useState('');
  const [evaluationDecision, setEvaluationDecision] = useState<'pass' | 'fail' | 'pending'>('pending');
  const [evaluationComment, setEvaluationComment] = useState('');
  const [evaluationNotice, setEvaluationNotice] = useState('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const [evaluationViewProfile, setEvaluationViewProfile] = useState<any>(null);
  const [evaluationDeleteProfile, setEvaluationDeleteProfile] = useState<any>(null);
  const [isDeletingEvaluation, setIsDeletingEvaluation] = useState(false);
  const [evaluationHistoryFocusId, setEvaluationHistoryFocusId] = useState('');
  const [evaluationHistorySearchTerm, setEvaluationHistorySearchTerm] = useState('');
  const [reportRoleView, setReportRoleView] = useState<'intern' | 'employee' | 'all'>('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportSortBy, setReportSortBy] = useState<'consistency' | 'completion' | 'efficiency'>('consistency');
  const [reportNotice, setReportNotice] = useState('');
  const [taskRoleFilter, setTaskRoleFilter] = useState<AdminTaskRole>('intern');
  const [adminTasks, setAdminTasks] = useState<AdminTaskItem[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEntryType, setTaskEntryType] = useState<'Task' | 'Projects'>('Task');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCriteria, setTaskCriteria] = useState<AdminTaskCriteria>({
    lifewoodBranding: '',
    colorPalettes: '',
    design: '',
    content: '',
  });
  const [taskAttachment, setTaskAttachment] = useState<AdminTaskAttachment | null>(null);
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskCalendarView, setTaskCalendarView] = useState(new Date());
  const [taskFormNotice, setTaskFormNotice] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<{ id: string; name: string } | null>(null);
  const [taskModalSource, setTaskModalSource] = useState<'new-assignment' | 'intern-card'>('new-assignment');
  const [taskPendingDelete, setTaskPendingDelete] = useState<AdminTaskItem | null>(null);
  const [dashboardTaskScope, setDashboardTaskScope] = useState<DashboardTaskScope>('all');
  const [isDashboardTaskModalOpen, setIsDashboardTaskModalOpen] = useState(false);
  const [isDashboardTaskScopeMenuOpen, setIsDashboardTaskScopeMenuOpen] = useState(false);
  const [projectSubmissions, setProjectSubmissions] = useState<ProjectSubmissionItem[]>([]);
  const [isLoadingProjectSubmissions, setIsLoadingProjectSubmissions] = useState(false);
  const [projectSubmissionNotice, setProjectSubmissionNotice] = useState('');
  const [selectedProjectSubmission, setSelectedProjectSubmission] = useState<ProjectSubmissionItem | null>(null);
  const [dashboardViewProfile, setDashboardViewProfile] = useState<any>(null);
  const [isProjectDecisionSaving, setIsProjectDecisionSaving] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNumber, setNewAdminNumber] = useState('');
  const [newAdminPosition, setNewAdminPosition] = useState('');
  const [adminPositionById, setAdminPositionById] = useState<Record<string, string>>({});
  const [adminManageNotice, setAdminManageNotice] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('general');
  const [settingsFullName, setSettingsFullName] = useState('');
  const [settingsNickName, setSettingsNickName] = useState('');
  const [settingsLanguage, setSettingsLanguage] = useState('English');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsHistoryNotice, setSettingsHistoryNotice] = useState('');
  const [settingsSecurityNotice, setSettingsSecurityNotice] = useState('');
  const [accountHistoryRows, setAccountHistoryRows] = useState<AccountHistoryItem[]>([]);
  const [projectHistoryRows, setProjectHistoryRows] = useState<ProjectHistoryItem[]>([]);
  const [loginActivityRows, setLoginActivityRows] = useState<LoginActivityItem[]>([]);
  const [isMfaAppEnabled, setIsMfaAppEnabled] = useState(false);
  const [isMfaSmsEnabled, setIsMfaSmsEnabled] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const [historyDeleteActionKey, setHistoryDeleteActionKey] = useState<string | null>(null);
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState<HistoryDeleteTarget | null>(null);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);
  const applicantActionMenuRef = useRef<HTMLDivElement | null>(null);
  const evaluationHistoryRef = useRef<HTMLDivElement | null>(null);
  const dashboardTaskScopeMenuRef = useRef<HTMLDivElement | null>(null);
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

  const COLORS = ['#046241', '#1a2e1a', '#e5e7eb'];

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
      fetchProjectSubmissions();
      recordCurrentLoginActivity();
      fetchDashboardLoginPresence();
    }
  }, [user, authLoading]);

  const asCleanText = (value: any) => (value || '').toString().trim();
  const isLikelyUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const formatDateTimeLabel = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleString();
  };

  const getDeviceTypeLabel = () => {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|mobile/.test(ua)) return 'Cellphone';
    return 'Computer';
  };

  const getBrowserLabel = () => {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Unknown';
  };

  const getOsLabel = () => {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) return 'macOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS';
    if (ua.includes('linux')) return 'Linux';
    return 'Unknown';
  };

  const getHistoryDisplayName = (row: { full_name?: string | null; email?: string | null }) =>
    asCleanText(row.full_name) || asCleanText(row.email) || 'Unknown';

  const recordAccountHistoryEntry = async (entry: {
    action: 'archived' | 'deleted';
    source: string;
    reference_id?: string | null;
    full_name?: string | null;
    email?: string | null;
    notes?: string | null;
  }) => {
    const payload = {
      action: entry.action,
      source: entry.source,
      reference_id: entry.reference_id || null,
      full_name: asCleanText(entry.full_name) || null,
      email: asCleanText(entry.email).toLowerCase() || null,
      notes: asCleanText(entry.notes) || null,
      acted_by: user?.id || null,
    };

    const { error } = await supabase.from('admin_account_history').insert([payload]);
    if (error && !isMissingTableError(error, 'admin_account_history')) {
      console.error('Error writing admin account history:', error);
    }
  };

  const recordProjectHistoryEntry = async (entry: {
    action: 'declined' | 'deleted';
    source_table?: string | null;
    reference_id?: string | null;
    full_name?: string | null;
    email?: string | null;
    project_name?: string | null;
    notes?: string | null;
  }) => {
    const payload = {
      action: entry.action,
      source_table: asCleanText(entry.source_table) || null,
      reference_id: entry.reference_id || null,
      full_name: asCleanText(entry.full_name) || null,
      email: asCleanText(entry.email).toLowerCase() || null,
      project_name: asCleanText(entry.project_name) || null,
      notes: asCleanText(entry.notes) || null,
      acted_by: user?.id || null,
    };

    const { error } = await supabase.from('admin_project_history').insert([payload]);
    if (error && !isMissingTableError(error, 'admin_project_history')) {
      console.error('Error writing admin project history:', error);
    }
  };

  const fetchSettingsHistory = async () => {
    let hasMissingTable = false;
    let historyNotice = '';
    setSettingsHistoryNotice('');

    const [accountResult, projectResult, archivedApplicationsResult] = await Promise.all([
      supabase
        .from('admin_account_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('admin_project_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('applications')
        .select('id, created_at, first_name, last_name, email, status')
        .eq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(300),
    ]);

    let fallbackDeclinedProfiles: any[] = [];
    let declinedProfilesError: any = null;
    let { data: declinedProfilesData, error: declinedProfilesQueryError } = await supabase
      .from('profiles')
      .select('id, created_at, updated_at, full_name, email, is_declined')
      .eq('is_declined', true)
      .order('updated_at', { ascending: false })
      .limit(300);

    if (declinedProfilesQueryError && isMissingDeclinedColumnError(declinedProfilesQueryError)) {
      const fallbackProfiles = await supabase
        .from('profiles')
        .select('id, created_at, updated_at, full_name, email');
      declinedProfilesData = (fallbackProfiles.data || []) as any[];
      declinedProfilesQueryError = fallbackProfiles.error;
    }

    if (declinedProfilesQueryError) {
      declinedProfilesError = declinedProfilesQueryError;
    } else {
      fallbackDeclinedProfiles = (declinedProfilesData || []).filter(
        (profileItem: any) => profileItem?.is_declined === true
      );
    }

    const fallbackDeclinedProjects: ProjectHistoryItem[] = [];
    for (const submissionTable of PROJECT_SUBMISSION_TABLE_CANDIDATES) {
      const { data, error } = await supabase
        .from(submissionTable)
        .select('id, created_at, full_name, email, project_name, status')
        .eq('status', 'declined')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) {
        if (!isMissingProjectSubmissionTableError(error)) {
          console.error('Error loading declined projects fallback:', error);
        }
        continue;
      }

      fallbackDeclinedProjects.push(
        ...((data || []).map((item: any) => ({
          id: `fallback-project-${submissionTable}-${item.id}`,
          created_at: item.created_at || null,
          action: 'declined',
          source_table: submissionTable,
          reference_id: item.id || null,
          full_name: asCleanText(item.full_name) || null,
          email: asCleanText(item.email).toLowerCase() || null,
          project_name: asCleanText(item.project_name) || null,
          notes: 'Fallback from project submissions table.',
        })) as ProjectHistoryItem[])
      );
    }

    const accountHistoryFromLogs = !accountResult.error
      ? ((accountResult.data || []) as AccountHistoryItem[])
      : [];
    const projectHistoryFromLogs = !projectResult.error
      ? ((projectResult.data || []) as ProjectHistoryItem[])
      : [];
    const accountHistoryFallbackFromApplicants = !archivedApplicationsResult.error
      ? ((archivedApplicationsResult.data || []).map((application: any) => ({
          id: `fallback-application-${application.id}`,
          created_at: application.created_at || null,
          action: 'archived',
          source: 'application',
          reference_id: application.id || null,
          full_name: `${asCleanText(application.first_name)} ${asCleanText(application.last_name)}`.trim() || null,
          email: asCleanText(application.email).toLowerCase() || null,
          notes: 'Fallback from archived applicants.',
        })) as AccountHistoryItem[])
      : [];
    const accountHistoryFallbackFromProfiles = fallbackDeclinedProfiles.map((profileItem: any) => ({
      id: `fallback-profile-${profileItem.id}`,
      created_at: profileItem.updated_at || profileItem.created_at || null,
      action: 'deleted',
      source: 'profile',
      reference_id: profileItem.id || null,
      full_name: asCleanText(profileItem.full_name) || null,
      email: asCleanText(profileItem.email).toLowerCase() || null,
      notes: 'Fallback from declined profile records.',
    })) as AccountHistoryItem[];

    const mergedAccountRows = [...accountHistoryFromLogs, ...accountHistoryFallbackFromApplicants, ...accountHistoryFallbackFromProfiles];
    const mergedProjectRows = [...projectHistoryFromLogs, ...fallbackDeclinedProjects];

    const dedupedAccountRows = Array.from(
      new Map(
        mergedAccountRows.map((row) => {
          const dedupeKey = `${(row.action || '').toLowerCase()}|${(row.source || '').toLowerCase()}|${row.reference_id || ''}|${(row.email || '').toLowerCase()}`;
          return [dedupeKey, row];
        })
      ).values()
    ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const dedupedProjectRows = Array.from(
      new Map(
        mergedProjectRows.map((row) => {
          const dedupeKey = `${(row.action || '').toLowerCase()}|${(row.source_table || '').toLowerCase()}|${row.reference_id || ''}|${(row.email || '').toLowerCase()}`;
          return [dedupeKey, row];
        })
      ).values()
    ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    if (accountResult.error) {
      if (isMissingTableError(accountResult.error, 'admin_account_history')) {
        hasMissingTable = true;
      } else {
        console.error('Error fetching account history:', accountResult.error);
        historyNotice = historyNotice || 'Unable to load account history right now.';
      }
    }

    if (projectResult.error) {
      if (isMissingTableError(projectResult.error, 'admin_project_history')) {
        hasMissingTable = true;
      } else {
        console.error('Error fetching project history:', projectResult.error);
        historyNotice = historyNotice || 'Unable to load project history right now.';
      }
    }

    if (archivedApplicationsResult.error) {
      console.error('Error fetching archived applicants fallback:', archivedApplicationsResult.error);
      historyNotice = historyNotice || 'Unable to load applicants history right now.';
    }

    if (declinedProfilesError) {
      console.error('Error fetching declined accounts fallback:', declinedProfilesError);
      historyNotice = historyNotice || 'Unable to load deleted accounts right now.';
    }

    setAccountHistoryRows(dedupedAccountRows);
    setProjectHistoryRows(dedupedProjectRows);

    if (hasMissingTable) {
      historyNotice =
        'History tables are missing. Showing fallback data from Applicants/Projects. Run section 10 of supabase_setup.sql for full deleted logs (including Evaluation delete history).'
    }

    setSettingsHistoryNotice(historyNotice);
  };

  const handleDeleteAccountHistoryEntry = async (row: AccountHistoryItem) => {
    const source = asCleanText(row.source).toLowerCase();
    const referenceId = asCleanText(row.reference_id);
    const rowId = asCleanText(row.id);

    setHistoryDeleteActionKey(`account:${row.id}`);
    setSettingsHistoryNotice('');

    try {
      if (referenceId && isLikelyUuid(referenceId)) {
        if (source === 'application') {
          const { error } = await supabase.from('applications').delete().eq('id', referenceId);
          if (error) throw error;
        } else if (source === 'profile') {
          const { error } = await supabase.from('profiles').delete().eq('id', referenceId);
          if (error) throw error;
        }
      }

      if (rowId && !rowId.startsWith('fallback-') && isLikelyUuid(rowId)) {
        const { error } = await supabase.from('admin_account_history').delete().eq('id', rowId);
        if (error && !isMissingTableError(error, 'admin_account_history')) {
          throw error;
        }
      }

      if (referenceId && isLikelyUuid(referenceId)) {
        const query = supabase
          .from('admin_account_history')
          .delete()
          .eq('reference_id', referenceId);
        const scopedQuery = source ? query.eq('source', source) : query;
        const { error } = await scopedQuery;
        if (error && !isMissingTableError(error, 'admin_account_history')) {
          throw error;
        }
      }

      await fetchSettingsHistory();
      setSettingsHistoryNotice('History entry and linked account data deleted successfully.');
    } catch (error) {
      console.error('Error deleting account history entry:', error);
      setSettingsHistoryNotice('Unable to delete this account history record right now.');
    } finally {
      setHistoryDeleteActionKey(null);
    }
  };

  const handleDeleteProjectHistoryEntry = async (row: ProjectHistoryItem) => {
    const sourceTable = asCleanText(row.source_table) as ProjectSubmissionItem['source_table'];
    const referenceId = asCleanText(row.reference_id);
    const rowId = asCleanText(row.id);

    setHistoryDeleteActionKey(`project:${row.id}`);
    setSettingsHistoryNotice('');

    try {
      if (referenceId && isLikelyUuid(referenceId)) {
        const preferredTables = sourceTable
          ? [sourceTable, ...PROJECT_SUBMISSION_TABLE_CANDIDATES.filter((candidate) => candidate !== sourceTable)]
          : [...PROJECT_SUBMISSION_TABLE_CANDIDATES];

        for (const tableName of preferredTables) {
          const { error } = await supabase.from(tableName).delete().eq('id', referenceId);
          if (error) {
            if (isMissingProjectSubmissionTableError(error)) {
              continue;
            }
            throw error;
          }
        }
      }

      if (rowId && !rowId.startsWith('fallback-') && isLikelyUuid(rowId)) {
        const { error } = await supabase.from('admin_project_history').delete().eq('id', rowId);
        if (error && !isMissingTableError(error, 'admin_project_history')) {
          throw error;
        }
      }

      if (referenceId && isLikelyUuid(referenceId)) {
        const query = supabase
          .from('admin_project_history')
          .delete()
          .eq('reference_id', referenceId);
        const scopedQuery = sourceTable ? query.eq('source_table', sourceTable) : query;
        const { error } = await scopedQuery;
        if (error && !isMissingTableError(error, 'admin_project_history')) {
          throw error;
        }
      }

      await fetchSettingsHistory();
      setSettingsHistoryNotice('History entry and linked project data deleted successfully.');
    } catch (error) {
      console.error('Error deleting project history entry:', error);
      setSettingsHistoryNotice('Unable to delete this project history record right now.');
    } finally {
      setHistoryDeleteActionKey(null);
    }
  };

  const openDeleteAccountHistoryModal = (row: AccountHistoryItem) => {
    const source = asCleanText(row.source).toLowerCase();
    const actionLabel = (row.action || 'record').toString().toLowerCase();
    const sourceLabel =
      source === 'application'
        ? 'Applicants'
        : source === 'profile'
        ? 'Profiles'
        : source === 'evaluation'
        ? 'Evaluation History'
        : 'related records';
    const targetName = getHistoryDisplayName(row);

    setHistoryDeleteTarget({
      kind: 'account',
      row,
      title: 'Confirm Account Deletion',
      message:
        `Delete "${targetName}" from History?\n\n` +
        `This will permanently delete linked data from ${sourceLabel} (if found) and remove its history logs.\n` +
        `Action type: ${actionLabel.toUpperCase()}.\n\n` +
        'This cannot be undone.',
    });
  };

  const openDeleteProjectHistoryModal = (row: ProjectHistoryItem) => {
    const projectTitle = asCleanText(row.project_name) || 'Untitled Project';
    const actionLabel = (row.action || 'record').toString().toLowerCase();

    setHistoryDeleteTarget({
      kind: 'project',
      row,
      title: 'Confirm Project Deletion',
      message:
        `Delete "${projectTitle}" from History?\n\n` +
        'This will permanently delete the linked project record from Projects (if found) and remove its history logs.\n' +
        `Action type: ${actionLabel.toUpperCase()}.\n\n` +
        'This cannot be undone.',
    });
  };

  const closeHistoryDeleteModal = () => {
    if (!historyDeleteTarget) return;
    const activeDeleteKey = `${historyDeleteTarget.kind}:${historyDeleteTarget.row.id}`;
    if (historyDeleteActionKey === activeDeleteKey) return;
    setHistoryDeleteTarget(null);
  };

  const handleConfirmHistoryDelete = async () => {
    if (!historyDeleteTarget) return;

    const pendingTarget = historyDeleteTarget;
    if (pendingTarget.kind === 'account') {
      await handleDeleteAccountHistoryEntry(pendingTarget.row);
    } else {
      await handleDeleteProjectHistoryEntry(pendingTarget.row);
    }
    setHistoryDeleteTarget(null);
  };

  const fetchLoginActivity = async () => {
    setSettingsSecurityNotice('');

    const { data, error } = await supabase
      .from('admin_login_activity')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(40);

    if (error) {
      if (isMissingTableError(error, 'admin_login_activity')) {
        setLoginActivityRows([]);
        setSettingsSecurityNotice('Security login table is missing. Run section 10 of supabase_setup.sql.');
        return;
      }
      console.error('Error fetching login activity:', error);
      setSettingsSecurityNotice('Unable to load login activity right now.');
      return;
    }

    setLoginActivityRows((data || []) as LoginActivityItem[]);
  };

  const fetchDashboardLoginPresence = async () => {
    const { data, error } = await supabase
      .from('admin_login_activity')
      .select('id, user_id, user_email, login_at, created_at')
      .order('login_at', { ascending: false })
      .limit(300);

    if (error) {
      if (!isMissingTableError(error, 'admin_login_activity')) {
        console.error('Error fetching dashboard login presence:', error);
      }
      return;
    }

    setLoginActivityRows((data || []) as LoginActivityItem[]);
  };

  const recordCurrentLoginActivity = async () => {
    if (!user?.id || typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const sessionKey = `lifewood_admin_login_activity_${user.id}`;
    const existingMarker = window.sessionStorage.getItem(sessionKey);
    if (existingMarker) return;

    const payload = {
      user_id: user.id,
      user_email: (user.email || '').toLowerCase() || null,
      device_type: getDeviceTypeLabel(),
      browser: getBrowserLabel(),
      os: getOsLabel(),
      user_agent: navigator.userAgent || null,
      login_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('admin_login_activity').insert([payload]);
    if (error) {
      if (!isMissingTableError(error, 'admin_login_activity')) {
        console.error('Error recording login activity:', error);
      }
      return;
    }

    window.sessionStorage.setItem(sessionKey, payload.login_at);
  };

  const getProfileOnlineStatus = (profileItem: any): 'Online' | 'Offline' => {
    const profileId = asCleanText(profileItem?.id);
    const profileEmail = asCleanText(profileItem?.email).toLowerCase();
    const currentUserEmail = asCleanText(user?.email).toLowerCase();

    if (user?.id && profileId && profileId === user.id) return 'Online';
    if (currentUserEmail && profileEmail && profileEmail === currentUserEmail) return 'Online';

    const latestActivity = loginActivityRows.find((row) => {
      const rowUserId = asCleanText(row.user_id);
      const rowEmail = asCleanText(row.user_email).toLowerCase();
      if (profileId && rowUserId && profileId === rowUserId) return true;
      if (profileEmail && rowEmail && profileEmail === rowEmail) return true;
      return false;
    });

    if (!latestActivity) return 'Offline';

    const lastSeenAt = latestActivity.login_at || latestActivity.created_at;
    const lastSeenTime = new Date(lastSeenAt || '').getTime();
    if (!Number.isFinite(lastSeenTime)) return 'Offline';

    const ONLINE_WINDOW_MS = 15 * 60 * 1000;
    return Date.now() - lastSeenTime <= ONLINE_WINDOW_MS ? 'Online' : 'Offline';
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const trimmedFullName = asCleanText(settingsFullName);
    const trimmedNickName = asCleanText(settingsNickName);
    const selectedLanguage = asCleanText(settingsLanguage) || 'English';

    if (!trimmedFullName) {
      setSettingsNotice('Full Name is required.');
      return;
    }

    if (settingsPassword || settingsConfirmPassword) {
      if (settingsPassword !== settingsConfirmPassword) {
        setSettingsNotice('Passwords do not match.');
        return;
      }
      if (settingsPassword.length < 8) {
        setSettingsNotice('Password must be at least 8 characters.');
        return;
      }
    }

    setIsSavingSettings(true);
    setSettingsNotice('');

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName,
          nick_name: trimmedNickName || null,
          language: selectedLanguage,
          updated_at: now,
        })
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setProfile((prev: any) => ({ ...prev, ...data }));
        setAllProfiles((prev) =>
          prev.map((profileItem) => (profileItem.id === user.id ? { ...profileItem, ...data } : profileItem))
        );
      }

      if (settingsPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: settingsPassword });
        if (passwordError) {
          setSettingsNotice('Profile updated, but password update failed. Please try again.');
          return;
        }
      }

      setSettingsPassword('');
      setSettingsConfirmPassword('');
      setSettingsNotice('Settings updated successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      setSettingsNotice('Unable to save settings right now.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getApplicantPositionValue = (application: Partial<AdminApplicationItem> | null | undefined) =>
    asCleanText(
      application?.project_applied ||
      application?.position ||
      (application as any)?.project
    );

  const getApplicantPositionLabel = (application: Partial<AdminApplicationItem> | null | undefined) =>
    getApplicantPositionValue(application) || 'N/A';

  const normalizeApplicationRecord = (record: any): AdminApplicationItem => {
    const firstName = asCleanText(record?.first_name);
    const lastName = asCleanText(record?.last_name);
    const email = asCleanText(record?.email).toLowerCase();
    const phone = asCleanText(record?.phone);
    const projectApplied = getApplicantPositionValue(record);

    return {
      ...record,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      project_applied: projectApplied || null,
    };
  };

  const normalizeProjectSubmissionRecord = (
    record: any,
    sourceTable: ProjectSubmissionItem['source_table'] = 'project_submissions'
  ): ProjectSubmissionItem => {
    const fullName = asCleanText(record?.full_name);
    const email = asCleanText(record?.email).toLowerCase();
    const projectName = asCleanText(record?.project_name);
    const contactNumber = asCleanText(record?.contact_number);
    const mainAiNeed = asCleanText(record?.main_ai_need);

    return {
      ...record,
      source_table: sourceTable,
      full_name: fullName || null,
      email: email || null,
      project_name: projectName || null,
      contact_number: contactNumber || null,
      main_ai_need: mainAiNeed || null,
    };
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const normalizedApplications = (data || [])
        .map(normalizeApplicationRecord)
        .filter((application) => Boolean(application.first_name || application.last_name || application.email));

      setApplications(normalizedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fullName = asCleanText(profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    const nickName = asCleanText(profile?.nick_name || user.user_metadata?.nick_name || '');
    const preferredLanguage = asCleanText(profile?.language || user.user_metadata?.language || 'English') || 'English';
    setSettingsFullName(fullName);
    setSettingsNickName(nickName);
    setSettingsLanguage(preferredLanguage);
  }, [user?.id, profile?.full_name, profile?.nick_name, profile?.language]);

  const fetchProjectSubmissions = async () => {
    setIsLoadingProjectSubmissions(true);
    setProjectSubmissionNotice('');
    try {
      let latestError: any = null;

      for (const submissionTable of PROJECT_SUBMISSION_TABLE_CANDIDATES) {
        const { data, error } = await supabase
          .from(submissionTable)
          .select('*')
          .order('created_at', { ascending: false });

        if (!error) {
          const sourceTable = submissionTable as ProjectSubmissionItem['source_table'];
          setProjectSubmissions((data || []).map((record) => normalizeProjectSubmissionRecord(record, sourceTable)));
          if (submissionTable === 'project_submission') {
            setProjectSubmissionNotice('Using legacy table: project_submission');
          }
          return;
        }

        latestError = error;
        if (!isMissingProjectSubmissionTableError(error)) {
          throw error;
        }
      }

      throw latestError;
    } catch (error) {
      console.error('Error fetching project submissions:', error);
      if (isMissingProjectSubmissionTableError(error)) {
        setProjectSubmissionNotice('Project submission table is missing. Run section 4 of supabase_setup.sql.');
      } else {
        setProjectSubmissionNotice('Unable to load submitted projects right now.');
      }
    } finally {
      setIsLoadingProjectSubmissions(false);
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
        const role = getNormalizedRole(p);
        const isApproved =
          p?.is_approved === true ||
          (p?.approval_status || '').toString().trim().toLowerCase() === 'accepted' ||
          (p?.status || '').toString().trim().toLowerCase() === 'accepted';
        if (!isApproved) return false;
        if (evaluationRoleFilter === 'intern') {
          return isInternLikeRole(role);
        }
        return role === 'employee';
      })
      .sort((a, b) => (a?.full_name || getFirstName(a)).localeCompare(b?.full_name || getFirstName(b)));

  const toBoundedScore = (value: any) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, Math.min(100, numeric));
  };

  const getTaskGradeScore = (task: AdminTaskItem) => {
    const criteriaScores = [
      toBoundedScore(task.criteria.lifewoodBranding),
      toBoundedScore(task.criteria.colorPalettes),
      toBoundedScore(task.criteria.design),
      toBoundedScore(task.criteria.content),
    ].filter((value): value is number => value !== null);

    if (criteriaScores.length === 0) return null;

    const total = criteriaScores.reduce((sum, score) => sum + score, 0);
    const normalizedScore = total > 100 ? total / criteriaScores.length : total;
    return Math.max(0, Math.min(100, Math.round(normalizedScore)));
  };

  const getEvaluationStatus = (profileItem: any): 'Pass' | 'Failed' | null => {
    const value = (profileItem?.evaluation_result || profileItem?.grade || '').toString().trim().toLowerCase();
    if (value === 'pass') return 'Pass';
    if (value === 'fail' || value === 'failed') return 'Failed';
    return null;
  };

  const getEvaluationAnalytics = (targetUser: any) => {
    const completion = Math.max(0, Math.min(100, Number(targetUser?.completion || 0)));
    const efficiency = Math.max(0, Math.min(100, Number(targetUser?.efficiency || 0)));
    const totalHours = Math.max(0, Number(targetUser?.hours_spent || 0));
    const assignedTasks = adminTasks.filter((task) => task.assignedProfileId === targetUser?.id);
    const nowTime = Date.now();
    const finishedTasks = assignedTasks.filter((task) => {
      const deadlineTime = new Date(task.deadline).getTime();
      return Number.isFinite(deadlineTime) && deadlineTime <= nowTime;
    });
    const scoreSourceTasks = finishedTasks.length > 0 ? finishedTasks : assignedTasks;
    const gradedTaskScores = scoreSourceTasks
      .map((task) => getTaskGradeScore(task))
      .filter((score): score is number => score !== null);
    const taskGradeScore = gradedTaskScores.length
      ? Math.round(gradedTaskScores.reduce((sum, score) => sum + score, 0) / gradedTaskScores.length)
      : null;

    const weightedScore = taskGradeScore !== null
      ? Math.round(taskGradeScore * 0.75 + completion * 0.15 + efficiency * 0.1)
      : Math.round(completion * 0.55 + efficiency * 0.35 + Math.min(totalHours / 2, 10));
    const score = Math.max(0, Math.min(100, weightedScore));

    if (score >= 85) {
      return {
        score,
        title: 'Excellent performance',
        detail: 'Task grade quality and delivery metrics are consistently strong. Candidate is ready for higher-impact assignments.',
        taskGradeScore,
        gradedTaskCount: gradedTaskScores.length,
        finishedTaskCount: finishedTasks.length,
        assignedTaskCount: assignedTasks.length,
        completion,
        efficiency,
        totalHours,
      };
    }
    if (score >= 70) {
      return {
        score,
        title: 'Strong progress',
        detail: 'Task outcomes are good with stable completion trends. Focused coaching can further improve consistency.',
        taskGradeScore,
        gradedTaskCount: gradedTaskScores.length,
        finishedTaskCount: finishedTasks.length,
        assignedTaskCount: assignedTasks.length,
        completion,
        efficiency,
        totalHours,
      };
    }
    if (score >= 55) {
      return {
        score,
        title: 'Needs closer monitoring',
        detail: 'Performance is acceptable but uneven. Add weekly checkpoints and targeted task reviews.',
        taskGradeScore,
        gradedTaskCount: gradedTaskScores.length,
        finishedTaskCount: finishedTasks.length,
        assignedTaskCount: assignedTasks.length,
        completion,
        efficiency,
        totalHours,
      };
    }
    return {
      score,
      title: 'At risk',
      detail: 'Current score indicates weak task-grade trends or low progress metrics. Immediate mentoring is recommended.',
      taskGradeScore,
      gradedTaskCount: gradedTaskScores.length,
      finishedTaskCount: finishedTasks.length,
      assignedTaskCount: assignedTasks.length,
      completion,
      efficiency,
      totalHours,
    };
  };

  const getAiInsight = (targetUser: any) => {
    const analytics = getEvaluationAnalytics(targetUser);
    return {
      score: analytics.score,
      title: analytics.title,
      detail: analytics.detail,
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

  const toggleManageFrameExpansion = (frame: ManageFrameKey) => {
    setExpandedManageFrames((prev) => {
      if (prev.includes(frame)) {
        if (prev.length >= 2 && prev[0] === frame) {
          // If multiple frames are expanded, clicking the top one sends it to bottom.
          return [...prev.slice(1), frame];
        }
        return prev.filter((item) => item !== frame);
      }

      if (prev.length < MANAGE_FRAME_ORDER.length) return [...prev, frame];
      return prev;
    });
  };

  const isManageFrameExpanded = (frame: ManageFrameKey) =>
    expandedManageFrames.includes(frame);

  const getManageFrameLayoutClass = (frame: ManageFrameKey) => {
    const orderClasses = [
      'lg:order-1',
      'lg:order-2',
      'lg:order-3',
      'lg:order-4',
      'lg:order-5',
      'lg:order-6',
      'lg:order-7',
      'lg:order-8',
    ];

    const expandedIndex = expandedManageFrames.indexOf(frame);
    if (expandedIndex >= 0) {
      return `lg:col-span-2 ${orderClasses[expandedIndex] || 'lg:order-1'}`;
    }

    if (expandedManageFrames.length === 0) return '';

    const collapsedFrames = MANAGE_FRAME_ORDER.filter((item) => !expandedManageFrames.includes(item));
    const collapsedIndex = collapsedFrames.indexOf(frame);
    if (collapsedIndex < 0) return '';

    const orderIndex = expandedManageFrames.length + collapsedIndex;
    return orderClasses[orderIndex] || '';
  };

  const getManageFramePaddingClass = (frame: ManageFrameKey) =>
    isManageFrameExpanded(frame) ? 'p-8' : 'p-10';

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
    const pendingUser =
      pendingProfiles.find((profileItem) => profileItem.id === userId) ||
      allProfiles.find((profileItem) => profileItem.id === userId) ||
      null;
    
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
      await recordAccountHistoryEntry({
        action: 'deleted',
        source: 'profile',
        reference_id: userId,
        full_name: pendingUser?.full_name || null,
        email: pendingUser?.email || null,
        notes: 'Pending account request removed by admin.',
      });
      if (activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
      }
      setAllProfiles((prevProfiles) => prevProfiles.filter((p) => p.id !== userId));
      setPendingProfiles((prevPending) => prevPending.filter((p) => p.id !== userId));
      setActioningUserId(null);
      return;
    }

    console.error('Error declining user:', error);
    setActioningUserId(null);
  };

  const requestManageProfileDeletion = (profileItem: any) => {
    setManageDeleteProfile(profileItem);
  };

  const closeManageDeleteModal = () => {
    if (isDeletingManageProfile) return;
    setManageDeleteProfile(null);
  };

  const handleDeleteManageProfile = async () => {
    if (!manageDeleteProfile?.id) return;

    setIsDeletingManageProfile(true);
    setManageUsersNotice('');

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', manageDeleteProfile.id);

      if (error) throw error;

      await recordAccountHistoryEntry({
        action: 'deleted',
        source: 'profile',
        reference_id: manageDeleteProfile.id,
        full_name: manageDeleteProfile.full_name || null,
        email: manageDeleteProfile.email || null,
        notes: 'Account deleted from Manage Users.',
      });

      setAllProfiles((prevProfiles) => prevProfiles.filter((item) => item.id !== manageDeleteProfile.id));
      setPendingProfiles((prevProfiles) => prevProfiles.filter((item) => item.id !== manageDeleteProfile.id));
      setManageUsersNotice('Account deleted successfully.');
      setManageDeleteProfile(null);

      if (activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
      }
    } catch (error) {
      console.error('Error deleting manage user profile:', error);
      setManageUsersNotice('Unable to delete account right now.');
    } finally {
      setIsDeletingManageProfile(false);
    }
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
    await Promise.allSettled([fetchAllProfiles(), fetchPendingApprovals(), fetchDashboardLoginPresence()]);
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_submissions' },
        () => {
          fetchProjectSubmissions();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_submission' },
        () => {
          fetchProjectSubmissions();
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
    if (activeTab === 'Projects') {
      fetchProjectSubmissions();
    }
    if (activeTab === 'Settings') {
      if (settingsView === 'history') {
        fetchSettingsHistory();
      }
      if (settingsView === 'security') {
        fetchLoginActivity();
      }
    }
  }, [activeTab, settingsView]);

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
    if (!evaluationHistoryFocusId) return;
    const timer = window.setTimeout(() => {
      setEvaluationHistoryFocusId('');
    }, 3500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [evaluationHistoryFocusId]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (applicantActionMenuRef.current && !applicantActionMenuRef.current.contains(event.target as Node)) {
        setOpenApplicantActionMenuId(null);
      }
      if (dashboardTaskScopeMenuRef.current && !dashboardTaskScopeMenuRef.current.contains(event.target as Node)) {
        setIsDashboardTaskScopeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('lifewood_admin_tasks_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setAdminTasks(parsed);
      }
    } catch (error) {
      console.error('Unable to load admin tasks from local storage:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('lifewood_admin_tasks_v1', JSON.stringify(adminTasks));
    } catch (error) {
      console.error('Unable to save admin tasks to local storage:', error);
    }
  }, [adminTasks]);

  const clearTaskForm = () => {
    setEditingTaskId(null);
    setTaskEntryType('Task');
    setTaskModalSource('new-assignment');
    setTaskAssignee(null);
    setTaskDescription('');
    setTaskCriteria({
      lifewoodBranding: '',
      colorPalettes: '',
      design: '',
      content: '',
    });
    setTaskAttachment(null);
    setTaskDeadline('');
    setTaskFormNotice('');
    setTaskCalendarView(new Date());
  };

  const openCreateTaskModal = (options?: { assignee?: any; source?: 'new-assignment' | 'intern-card' }) => {
    clearTaskForm();
    const assignee = options?.assignee;
    const source = options?.source ?? (assignee?.id ? 'intern-card' : 'new-assignment');
    setTaskModalSource(source);
    if (assignee?.id) {
      setTaskRoleFilter('intern');
      setTaskAssignee({
        id: assignee.id,
        name: assignee.full_name || getFirstName(assignee),
      });
    }
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: AdminTaskItem) => {
    setEditingTaskId(task.id);
    setTaskEntryType(task.entryType || 'Task');
    setTaskRoleFilter(task.targetRole);
    setTaskModalSource(task.assignedProfileId ? 'intern-card' : 'new-assignment');
    setTaskAssignee(
      task.assignedProfileId
        ? {
            id: task.assignedProfileId,
            name: task.assignedProfileName || 'Assigned Intern',
          }
        : null
    );
    setTaskDescription(task.description);
    setTaskCriteria(task.criteria);
    setTaskAttachment(task.attachment);
    setTaskDeadline(task.deadline);
    setTaskCalendarView(task.deadline ? new Date(task.deadline) : new Date());
    setTaskFormNotice('');
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    clearTaskForm();
  };

  const handleTaskAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setTaskAttachment({
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown',
    });
    event.target.value = '';
  };

  const handleConfirmTask = () => {
    const missingFields: string[] = [];

    if (!taskEntryType.trim()) missingFields.push('Type');
    if (!taskDescription.trim()) missingFields.push('Description');
    if (!taskDeadline) missingFields.push('Deadline');

    if (missingFields.length > 0) {
      setTaskFormNotice(`Please complete all required fields: ${missingFields.join(', ')}.`);
      return;
    }

    const timestamp = new Date().toISOString();

    if (editingTaskId) {
      setAdminTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                entryType: taskEntryType,
                targetRole: taskRoleFilter,
                assignedProfileId: taskAssignee?.id ?? null,
                assignedProfileName: taskAssignee?.name ?? null,
                description: taskDescription.trim(),
                criteria: taskCriteria,
                attachment: taskAttachment,
                deadline: taskDeadline,
              }
            : task
        )
      );
    } else {
      const nextTaskNumber =
        adminTasks.filter((task) => task.targetRole === taskRoleFilter && task.entryType === taskEntryType).length + 1;
      const newTask: AdminTaskItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: `${taskEntryType} ${nextTaskNumber}`,
        entryType: taskEntryType,
        targetRole: taskRoleFilter,
        assignedProfileId: taskAssignee?.id ?? null,
        assignedProfileName: taskAssignee?.name ?? null,
        description: taskDescription.trim(),
        criteria: taskCriteria,
        attachment: taskAttachment,
        startedAt: timestamp,
        deadline: taskDeadline,
        createdAt: timestamp,
      };
      setAdminTasks((prev) => [newTask, ...prev]);
    }

    closeTaskModal();
  };

  const handleDeleteTask = (taskId: string) => {
    setAdminTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const requestDeleteTask = (task: AdminTaskItem) => {
    setTaskPendingDelete(task);
  };

  const closeDeleteTaskModal = () => {
    setTaskPendingDelete(null);
  };

  const confirmDeleteTask = () => {
    if (!taskPendingDelete) return;
    handleDeleteTask(taskPendingDelete.id);
    if (editingTaskId === taskPendingDelete.id) {
      closeTaskModal();
    }
    setTaskPendingDelete(null);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = newAdminName.trim();
    const email = newAdminEmail.trim().toLowerCase();
    const phone = newAdminNumber.trim();
    const position = newAdminPosition.trim();

    if (!name || !email || !phone || !position) {
      setAdminManageNotice('Please fill out Name, Email, Number, and Position.');
      return;
    }

    const matchingProfile = allProfiles.find((p) => (p?.email || '').toString().trim().toLowerCase() === email);
    if (!matchingProfile?.id) {
      setAdminManageNotice('No existing account was found with that email. Ask them to sign up first.');
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminManageNotice('');

    const payload = {
      full_name: name,
      email,
      phone,
      position,
      role: 'admin',
      is_approved: true,
      is_declined: false,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', matchingProfile.id)
      .select('*')
      .single();

    if (error && isMissingPositionColumnError(error)) {
      const fallback = await supabase
        .from('profiles')
        .update({
          full_name: name,
          email,
          phone,
          role: 'admin',
          is_approved: true,
          is_declined: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchingProfile.id)
        .select('*')
        .single();
      data = fallback.data as any;
      error = fallback.error;
    }

    if (error) {
      console.error('Error adding admin:', error);
      setAdminManageNotice('Unable to add admin right now. Please try again.');
      setIsSubmittingAdmin(false);
      return;
    }

    const updatedAdmin = data || { ...matchingProfile, ...payload };
    setAllProfiles((prev) =>
      prev.map((profileItem) => (profileItem.id === matchingProfile.id ? updatedAdmin : profileItem))
    );
    setPendingProfiles((prev) => prev.filter((profileItem) => profileItem.id !== matchingProfile.id));
    setAdminPositionById((prev) => ({ ...prev, [matchingProfile.id]: position }));
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminNumber('');
    setNewAdminPosition('');
    setAdminManageNotice('Admin added successfully. This account can now log in as Admin.');
    setIsSubmittingAdmin(false);
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

  const handleSignOutAllDevices = async () => {
    setIsSigningOutAll(true);
    setSettingsSecurityNotice('');
    const { error } = await supabase.auth.signOut({ scope: 'global' } as any);
    if (error) {
      console.error('Error logging out all devices:', error);
      setSettingsSecurityNotice('Unable to log out all devices right now.');
      setIsSigningOutAll(false);
      return;
    }

    setIsSigningOutAll(false);
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
        title: getApplicantPositionValue(application) || 'Lifewood Position',
        email: applicantEmail,
        to_name: applicantName,
        to_email: applicantEmail,
        user_email: applicantEmail,
        recipient: applicantEmail,
        reply_to: applicantEmail,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        project_applied: getApplicantPositionValue(application),
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
      await recordAccountHistoryEntry({
        action: 'archived',
        source: 'application',
        reference_id: application.id,
        full_name: `${application?.first_name || ''} ${application?.last_name || ''}`.trim(),
        email: application?.email || null,
        notes: `Application for ${getApplicantPositionLabel(application)} was archived.`,
      });
      if (activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
      }
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

      await recordAccountHistoryEntry({
        action: 'deleted',
        source: 'application',
        reference_id: application.id,
        full_name: `${application?.first_name || ''} ${application?.last_name || ''}`.trim(),
        email: application?.email || null,
        notes: `Application for ${getApplicantPositionLabel(application)} was deleted.`,
      });
      setApplications((prev) => prev.filter((app) => app.id !== application.id));
      if (selectedApplicant?.id === application.id) {
        setSelectedApplicant(null);
      }
      if (activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
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
  const selectedEvaluationAnalytics = selectedEvaluationUser ? getEvaluationAnalytics(selectedEvaluationUser) : null;
  const pendingApplications = applications.filter((app) => normalizeApplicationStatus(app.status) === 'pending');
  const reviewedApplications = applications.filter((app) => normalizeApplicationStatus(app.status) !== 'pending');
  const evaluationInsight = selectedEvaluationUser ? getAiInsight(selectedEvaluationUser) : null;
  const approvedInternProfiles = allProfiles.filter((p) => p?.is_approved === true && isInternLikeRole(getNormalizedRole(p)));
  const approvedEmployeeProfiles = allProfiles.filter((p) => p?.is_approved === true && isEmployeeLikeRole(getNormalizedRole(p)));
  const manageInternProfiles = allProfiles.filter((p) => (p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user') && p.is_approved === true);
  const manageEmployeeProfiles = allProfiles.filter((p) => p.role?.toLowerCase() === 'employee' && p.is_approved === true);
  const manageAdminProfiles = allProfiles.filter((p) => {
    const role = (p.role || '').toString().toLowerCase();
    const email = (p.email || '').toString().toLowerCase();
    if (role !== 'admin') return false;
    if (p.is_approved === true) return true;
    if (ADMIN_EMAILS.includes(email)) return true;
    return p.id === user?.id;
  });
  const filteredManageInternProfiles = manageInternProfiles.filter((p) => matchesFirstNameSearch(p, internSearchTerm));
  const filteredManageEmployeeProfiles = manageEmployeeProfiles.filter((p) => matchesFirstNameSearch(p, employeeSearchTerm));
  const filteredManagePendingProfiles = pendingProfiles.filter((p) => matchesFirstNameSearch(p, pendingSearchTerm));
  const filteredManageAdminProfiles = manageAdminProfiles.filter((p) => matchesFirstNameSearch(p, adminSearchTerm));
  const settingsPanels: Array<{ key: SettingsView; label: string; helper: string }> = [
    { key: 'general', label: 'General', helper: 'Account and language' },
    { key: 'history', label: 'History', helper: 'Archived and deleted records' },
    { key: 'security', label: 'Security', helper: 'Login activity and MFA' },
  ];
  const accountHistoryTableRows = accountHistoryRows.filter((row) => {
    const action = (row.action || '').toString().toLowerCase();
    return action === 'archived' || action === 'deleted';
  });
  const projectHistoryTableRows = projectHistoryRows.filter(
    (row) => {
      const action = (row.action || '').toString().toLowerCase();
      return action === 'declined' || action === 'deleted';
    }
  );
  const activeHistoryDeleteKey = historyDeleteTarget ? `${historyDeleteTarget.kind}:${historyDeleteTarget.row.id}` : '';
  const isHistoryDeleteProcessing = Boolean(historyDeleteTarget && historyDeleteActionKey === activeHistoryDeleteKey);
  const securityFallbackRow: LoginActivityItem = {
    id: 'current-session',
    user_email: (user?.email || profile?.email || '').toString(),
    device_type: getDeviceTypeLabel(),
    browser: getBrowserLabel(),
    os: getOsLabel(),
    login_at: profile?.updated_at || new Date().toISOString(),
  };
  const displayedLoginActivityRows = loginActivityRows.length ? loginActivityRows : [securityFallbackRow];
  const getAdminPositionLabel = (profileItem: any) => {
    const dbPosition = (profileItem?.position || '').toString().trim();
    if (dbPosition) return dbPosition;
    const customPosition = adminPositionById[profileItem.id];
    if (customPosition) return customPosition;
    const currentAdminEmail = (profileItem?.email || '').toString().toLowerCase();
    const isCurrentAdmin = profileItem?.id === user?.id || ADMIN_EMAILS.includes(currentAdminEmail);
    return isCurrentAdmin ? 'Manager' : 'Backend';
  };
  const getProfileDisplayId = (profileItem: any) => {
    const isIntern = isInternLikeRole(getNormalizedRole(profileItem));
    const roleGroup: 'intern' | 'employee' = isIntern ? 'intern' : 'employee';
    const roleProfiles = isIntern ? manageInternProfiles : manageEmployeeProfiles;
    const roleIndex = roleProfiles.findIndex((item) => item.id === profileItem.id);
    return formatManageProfileCode(
      profileItem,
      roleIndex >= 0 ? roleIndex : 0,
      roleGroup
    );
  };
  const evaluationHistoryRows = evaluationCandidates
    .map((candidate) => {
      const status = getEvaluationStatus(candidate);
      if (!status) return null;
      const analytics = getEvaluationAnalytics(candidate);
      const displayId = getProfileDisplayId(candidate);

      return {
        id: String(candidate.id),
        displayId,
        profile: candidate,
        name: candidate.full_name || getFirstName(candidate),
        email: candidate.email || 'N/A',
        status,
        score: analytics.score,
        lastEvaluatedAt: candidate.last_evaluated_at || candidate.updated_at || candidate.created_at || '',
      };
    })
    .filter((row): row is {
      id: string;
      displayId: string;
      profile: any;
      name: string;
      email: string;
      status: 'Pass' | 'Failed';
      score: number;
      lastEvaluatedAt: string;
    } => row !== null)
    .sort((a, b) => new Date(b.lastEvaluatedAt || 0).getTime() - new Date(a.lastEvaluatedAt || 0).getTime());
  const filteredEvaluationHistoryRows = evaluationHistoryRows.filter((row) => {
    const term = evaluationHistorySearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      row.displayId.toLowerCase().includes(term) ||
      row.name.toLowerCase().includes(term) ||
      row.email.toLowerCase().includes(term) ||
      row.status.toLowerCase().includes(term)
    );
  });
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
  const totalApplicantsCount = applications.length;
  const totalInternsCount = approvedInternProfiles.length;
  const totalEmployeesCount = approvedEmployeeProfiles.length;
  const totalApprovedMembers = totalInternsCount + totalEmployeesCount;
  const totalApprovalQueue = pendingProfiles.length + totalApprovedMembers;
  const approvalRate = totalApprovalQueue > 0 ? Math.round((totalApprovedMembers / totalApprovalQueue) * 100) : 0;
  const analyticsWeekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const analyticsWeekSeed = analyticsWeekOrder.reduce((acc, day) => {
    acc[day] = { day, applicants: 0, interns: 0, employees: 0, total: 0 };
    return acc;
  }, {} as Record<string, { day: string; applicants: number; interns: number; employees: number; total: number }>);

  applications.forEach((item) => {
    const dateValue = item?.created_at ? new Date(item.created_at) : null;
    if (!dateValue || Number.isNaN(dateValue.getTime())) return;
    const day = analyticsWeekOrder[(dateValue.getDay() + 6) % 7];
    analyticsWeekSeed[day].applicants += 1;
  });

  approvedInternProfiles.forEach((item) => {
    const dateValue = item?.created_at ? new Date(item.created_at) : null;
    if (!dateValue || Number.isNaN(dateValue.getTime())) return;
    const day = analyticsWeekOrder[(dateValue.getDay() + 6) % 7];
    analyticsWeekSeed[day].interns += 1;
  });

  approvedEmployeeProfiles.forEach((item) => {
    const dateValue = item?.created_at ? new Date(item.created_at) : null;
    if (!dateValue || Number.isNaN(dateValue.getTime())) return;
    const day = analyticsWeekOrder[(dateValue.getDay() + 6) % 7];
    analyticsWeekSeed[day].employees += 1;
  });

  let analyticsWeekData = analyticsWeekOrder.map((day) => {
    const dayEntry = analyticsWeekSeed[day];
    return {
      ...dayEntry,
      total: dayEntry.applicants + dayEntry.interns + dayEntry.employees,
    };
  });

  const hasAnalyticsData = analyticsWeekData.some((entry) => entry.total > 0);
  if (!hasAnalyticsData) {
    const applicantPattern = [0.32, 0.46, 0.72, 0.84, 0.58, 0.41, 0.49];
    const internPattern = [0.27, 0.37, 0.56, 0.62, 0.44, 0.33, 0.39];
    const employeePattern = [0.22, 0.3, 0.47, 0.53, 0.38, 0.28, 0.34];

    analyticsWeekData = analyticsWeekOrder.map((day, index) => {
      const applicantsValue = Math.max(1, Math.round(Math.max(totalApplicantsCount, 6) * applicantPattern[index]));
      const internsValue = Math.max(1, Math.round(Math.max(totalInternsCount, 4) * internPattern[index]));
      const employeesValue = Math.max(1, Math.round(Math.max(totalEmployeesCount, 3) * employeePattern[index]));

      return {
        day,
        applicants: applicantsValue,
        interns: internsValue,
        employees: employeesValue,
        total: applicantsValue + internsValue + employeesValue,
      };
    });
  }

  const peakAnalyticsDay = analyticsWeekData.reduce((peak, current) =>
    current.total > peak.total ? current : peak
  , analyticsWeekData[0]);
  const analyticsAveragePerDay = Math.round(
    analyticsWeekData.reduce((sum, entry) => sum + entry.total, 0) / analyticsWeekData.length
  );
  const analyticsLegendItems = [
    { label: 'Applicants', value: totalApplicantsCount, color: '#3b82f6' },
    { label: 'Interns', value: totalInternsCount, color: '#046241' },
    { label: 'Employee', value: totalEmployeesCount, color: '#FFB347' },
  ];
  const getAnalyticsTopLayerKey = (entry: any): 'employees' | 'interns' | 'applicants' | null => {
    if (Number(entry?.applicants || 0) > 0) return 'applicants';
    if (Number(entry?.interns || 0) > 0) return 'interns';
    if (Number(entry?.employees || 0) > 0) return 'employees';
    return null;
  };
  const getAnalyticsLayerRadius = (entry: any, key: 'employees' | 'interns' | 'applicants') => {
    const topLayer = getAnalyticsTopLayerKey(entry);
    return topLayer === key ? [6, 6, 0, 0] : [0, 0, 0, 0];
  };
  const getDashboardTaskCategory = (task: AdminTaskItem): Exclude<DashboardTaskScope, 'all'> => {
    const startSource = task.startedAt || task.createdAt;
    const startTime = new Date(startSource).getTime();
    const deadlineTime = new Date(task.deadline).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(deadlineTime) || deadlineTime < startTime) {
      return 'monthly';
    }
    const diffDays = (deadlineTime - startTime) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 ? 'weekly' : 'monthly';
  };
  const dashboardTaskRows = [...adminTasks].sort(
    (a, b) => new Date(b.createdAt || b.startedAt).getTime() - new Date(a.createdAt || a.startedAt).getTime()
  );
  const dashboardFilteredTaskRows =
    dashboardTaskScope === 'all'
      ? dashboardTaskRows
      : dashboardTaskRows.filter((task) => getDashboardTaskCategory(task) === dashboardTaskScope);
  const dashboardTaskScopeLabel =
    dashboardTaskScope === 'all'
      ? 'All Task'
      : dashboardTaskScope === 'weekly'
      ? 'Weekly Task'
      : 'Monthly Task';
  const filteredAdminTasks = adminTasks
    .filter((task) => task.targetRole === taskRoleFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const createdAssignmentTasks = filteredAdminTasks.filter((task) => !task.assignedProfileId);
  const filteredTaskInternProgressProfiles = approvedInternProfiles
    .filter((profileItem) => matchesFirstNameSearch(profileItem, internProgressSearchTerm))
    .slice()
    .sort((a, b) => getFirstName(a).localeCompare(getFirstName(b), undefined, { sensitivity: 'base' }));
  const toNumericScore = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const criteriaTotalScore =
    toNumericScore(taskCriteria.lifewoodBranding) +
    toNumericScore(taskCriteria.colorPalettes) +
    toNumericScore(taskCriteria.design) +
    toNumericScore(taskCriteria.content);
  const criteriaPassingScore = Math.round(criteriaTotalScore * 0.75 * 100) / 100;
  const taskCalendarMonthStart = new Date(taskCalendarView.getFullYear(), taskCalendarView.getMonth(), 1);
  const taskCalendarMonthLabel = taskCalendarMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' });
  const taskCalendarStartOffset = taskCalendarMonthStart.getDay();
  const taskCalendarDaysInMonth = new Date(taskCalendarView.getFullYear(), taskCalendarView.getMonth() + 1, 0).getDate();
  const taskCalendarDays = Array.from({ length: taskCalendarStartOffset + taskCalendarDaysInMonth }, (_, index) =>
    index < taskCalendarStartOffset ? null : index - taskCalendarStartOffset + 1
  );
  const formatTaskDate = (dateValue: string) => {
    if (!dateValue) return 'N/A';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString();
  };
  const dashboardVisibleMemberProfiles = sortedOfficialMemberProfiles.filter(
    (profileItem) => getNormalizedRole(profileItem) !== 'admin'
  );
  const filteredDashboardVisibleProfiles = dashboardVisibleMemberProfiles.filter((profileItem) => {
    const term = searchTerm.trim().toLowerCase();
    const firstName = getFirstName(profileItem).toLowerCase();
    const matchesSearch = term === '' || firstName.includes(term);
    const roleValue = getNormalizedRole(profileItem);
    const matchesRole =
      roleFilter === 'All' ||
      (roleFilter === 'Employee' && roleValue === 'employee') ||
      (roleFilter === 'Intern' && (roleValue === 'intern' || roleValue === 'user'));
    return matchesSearch && matchesRole;
  });

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
      setEvaluationHistoryFocusId(String(selectedEvaluationUser.id));
      window.setTimeout(() => {
        evaluationHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setEvaluationNotice('Unable to save evaluation right now.');
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const handleDeleteEvaluationRecord = async () => {
    if (!evaluationDeleteProfile) return;

    setIsDeletingEvaluation(true);

    try {
      const now = new Date().toISOString();
      const basePayload: any = {
        grade: null,
        updated_at: now,
      };
      const fullPayload: any = {
        ...basePayload,
        evaluation_result: null,
        evaluation_comment: null,
        last_evaluated_at: null,
      };

      let { error } = await supabase
        .from('profiles')
        .update(fullPayload)
        .eq('id', evaluationDeleteProfile.id);

      if (error && isMissingEvaluationColumnError(error)) {
        const fallback = await supabase
          .from('profiles')
          .update(basePayload)
          .eq('id', evaluationDeleteProfile.id);
        error = fallback.error;
      }

      if (error) throw error;

      setAllProfiles((prev) => prev.map((profileItem) => (
        profileItem.id === evaluationDeleteProfile.id
          ? {
              ...profileItem,
              grade: null,
              evaluation_result: null,
              evaluation_comment: null,
              last_evaluated_at: null,
              updated_at: now,
            }
          : profileItem
      )));

      if (selectedEvaluationUserId === evaluationDeleteProfile.id) {
        setEvaluationDecision('pending');
        setEvaluationComment('');
      }

      await recordAccountHistoryEntry({
        action: 'deleted',
        source: 'evaluation',
        reference_id: evaluationDeleteProfile.id,
        full_name: evaluationDeleteProfile.full_name || null,
        email: evaluationDeleteProfile.email || null,
        notes: 'Evaluation record deleted by admin.',
      });
      if (activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
      }

      setEvaluationNotice('Evaluation record deleted successfully.');
      setEvaluationHistoryFocusId(String(evaluationDeleteProfile.id));
      setEvaluationDeleteProfile(null);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      setEvaluationNotice('Unable to delete evaluation right now.');
    } finally {
      setIsDeletingEvaluation(false);
    }
  };

  const handleProjectSubmissionDecision = async (decision: 'accepted' | 'declined') => {
    if (!selectedProjectSubmission?.id) return;

    setIsProjectDecisionSaving(true);
    setProjectSubmissionNotice('');

    try {
      const preferredTable = selectedProjectSubmission.source_table;
      const candidateTables = preferredTable
        ? [preferredTable, ...PROJECT_SUBMISSION_TABLE_CANDIDATES.filter((table) => table !== preferredTable)]
        : [...PROJECT_SUBMISSION_TABLE_CANDIDATES];

      let updatedTable: (typeof PROJECT_SUBMISSION_TABLE_CANDIDATES)[number] | null = null;
      let latestError: any = null;

      for (const submissionTable of candidateTables) {
        const { error } = await supabase
          .from(submissionTable)
          .update({ status: decision })
          .eq('id', selectedProjectSubmission.id);

        if (!error) {
          updatedTable = submissionTable;
          break;
        }

        latestError = error;
        if (!isMissingProjectSubmissionTableError(error)) {
          throw error;
        }
      }

      if (!updatedTable) {
        throw latestError;
      }

      if (decision === 'declined') {
        await recordProjectHistoryEntry({
          action: 'declined',
          source_table: updatedTable,
          reference_id: selectedProjectSubmission.id,
          full_name: selectedProjectSubmission.full_name || null,
          email: selectedProjectSubmission.email || null,
          project_name: selectedProjectSubmission.project_name || null,
          notes: 'Project submission declined by admin.',
        });
      }

      setProjectSubmissions((prev) =>
        prev.map((submission) =>
          submission.id === selectedProjectSubmission.id
            ? { ...submission, status: decision, source_table: updatedTable }
            : submission
        )
      );
      const decisionMessage = decision === 'accepted'
        ? 'Project submission accepted successfully.'
        : 'Project submission declined successfully.';
      setProjectSubmissionNotice(
        updatedTable === 'project_submission'
          ? `${decisionMessage} (legacy table)`
          : decisionMessage
      );
      if (decision === 'declined' && activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
      }
      setSelectedProjectSubmission(null);
    } catch (error) {
      console.error('Error updating project submission status:', error);
      if (isMissingProjectSubmissionTableError(error)) {
        setProjectSubmissionNotice('Project submission table is missing. Run section 4 of supabase_setup.sql.');
      } else {
        setProjectSubmissionNotice('Unable to update project submission right now.');
      }
    } finally {
      setIsProjectDecisionSaving(false);
    }
  };

  const handleDeleteProjectSubmission = async () => {
    if (!selectedProjectSubmission?.id) return;
    if (!confirm('Are you sure you want to delete this project submission?')) return;

    setIsProjectDecisionSaving(true);
    setProjectSubmissionNotice('');

    try {
      const preferredTable = selectedProjectSubmission.source_table;
      const candidateTables = preferredTable
        ? [preferredTable, ...PROJECT_SUBMISSION_TABLE_CANDIDATES.filter((table) => table !== preferredTable)]
        : [...PROJECT_SUBMISSION_TABLE_CANDIDATES];

      let deletedTable: (typeof PROJECT_SUBMISSION_TABLE_CANDIDATES)[number] | null = null;
      let latestError: any = null;

      for (const submissionTable of candidateTables) {
        const { error } = await supabase
          .from(submissionTable)
          .delete()
          .eq('id', selectedProjectSubmission.id);

        if (!error) {
          deletedTable = submissionTable;
          break;
        }

        latestError = error;
        if (!isMissingProjectSubmissionTableError(error)) {
          throw error;
        }
      }

      if (!deletedTable) {
        throw latestError;
      }

      await recordProjectHistoryEntry({
        action: 'deleted',
        source_table: deletedTable,
        reference_id: selectedProjectSubmission.id,
        full_name: selectedProjectSubmission.full_name || null,
        email: selectedProjectSubmission.email || null,
        project_name: selectedProjectSubmission.project_name || null,
        notes: 'Project submission deleted by admin.',
      });

      setProjectSubmissions((prev) =>
        prev.filter((submission) => submission.id !== selectedProjectSubmission.id)
      );
      setProjectSubmissionNotice(
        deletedTable === 'project_submission'
          ? 'Project deleted successfully. (legacy table)'
          : 'Project deleted successfully.'
      );
      setSelectedProjectSubmission(null);

      if (activeTab === 'Settings' && settingsView === 'history') {
        fetchSettingsHistory();
      }
    } catch (error) {
      console.error('Error deleting project submission:', error);
      if (isMissingProjectSubmissionTableError(error)) {
        setProjectSubmissionNotice('Project submission table is missing. Run section 4 of supabase_setup.sql.');
      } else {
        setProjectSubmissionNotice('Unable to delete project submission right now.');
      }
    } finally {
      setIsProjectDecisionSaving(false);
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
    { icon: '\u{1F4CA}', label: 'Dashboard' },
    { icon: '\u{1F552}', label: 'Analytics' },
    { icon: 'task-custom', label: 'Task' },
    { icon: '\u{1F4DD}', label: 'Evaluation' },
    { icon: '\u{1F4C8}', label: 'Reports' },
    { icon: '\u{1F4C1}', label: 'Projects' },
    { icon: '\u{1F4E9}', label: 'Applicants' },
    { icon: '\u{1F465}', label: 'Manage Users' },
  ];

  const settingsItems = [
    { icon: '\u2699\uFE0F', label: 'Settings' },
  ];

  const renderMenuIcon = (item: { icon: string; label: string }) => {
    if (item.label === 'Task') {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2.5" y="1.8" width="19" height="20.4" rx="2.8" />
            <text x="12" y="6.9" textAnchor="middle" fontSize="4.2" fontWeight="700" fill="currentColor" stroke="none">TASK</text>
            <circle cx="6.4" cy="10.2" r="1.35" />
            <path d="M5.75 10.2l0.45 0.45 0.95-1" />
            <path d="M9.2 10.2h8.3" />
            <circle cx="6.4" cy="14.1" r="1.35" />
            <path d="M5.75 14.1l0.45 0.45 0.95-1" />
            <path d="M9.2 14.1h8.3" />
            <circle cx="6.4" cy="18" r="1.35" />
            <path d="M5.85 17.45l1.1 1.1" />
            <path d="M6.95 17.45l-1.1 1.1" />
            <path d="M9.2 18h8.3" />
          </svg>
        </span>
      );
    }

    return <span className="text-lg">{item.icon}</span>;
  };

  return (
    <div className={`relative min-h-screen flex font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-white text-[#1a1a1a]'}`}>
      {!darkMode && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <LightPillar
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={1}
            rotationSpeed={0.3}
            glowAmount={0.002}
            pillarWidth={3}
            pillarHeight={0.4}
            noiseIntensity={0.5}
            pillarRotation={25}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
          />
        </div>
      )}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/45 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? 'w-72 lg:w-24' : 'w-72 lg:w-64'} border-r flex flex-col p-6 pb-24 lg:pb-6 fixed h-[100dvh] z-20 transition-all duration-300 overflow-y-auto backdrop-blur-xl transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${darkMode ? 'bg-white/10 border-white/20 shadow-[0_0_30px_rgba(15,23,42,0.35)]' : 'bg-white/45 border-white/60 shadow-[0_0_30px_rgba(16,185,129,0.15)]'}`}
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
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false);
                  return;
                }
                setIsSidebarCollapsed((prev) => !prev);
              }}
              className={`rounded-lg p-1 transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'}`}
              title={typeof window !== 'undefined' && window.innerWidth < 1024 ? 'Close sidebar' : isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                    type="button"
                    onClick={() => setActiveTab(item.label)}
                    onMouseUp={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    title={item.label}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-150 ease-out transform-gpu hover:scale-[1.03] active:scale-[1.01] ${
                      activeTab === item.label
                        ? (darkMode ? 'bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-400' : 'bg-emerald-500/15 text-emerald-700 border-l-4 border-emerald-600')
                        : (darkMode ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/15' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-500/12')
                    }`}
                  >
                    {renderMenuIcon(item)}
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
                    type="button"
                    onClick={() => setActiveTab(item.label)}
                    onMouseUp={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    title={item.label}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-150 ease-out transform-gpu hover:scale-[1.03] active:scale-[1.01] ${
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
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Light mode' : 'Dark mode'}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-150 ease-out transform-gpu hover:scale-[1.03] active:scale-[1.01] ${darkMode ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/15' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-500/12'}`}
                >
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    {darkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3a6 6 0 1 0 9 9 8 8 0 1 1-9-9z" />
                      </svg>
                    )}
                  </span>
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
            <div className={`flex items-center justify-between gap-2 p-3 rounded-2xl ${darkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-emerald-100'}`}>
              <div
                className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer group"
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
                <div className="min-w-0 overflow-hidden">
                  <p className={`text-sm font-bold truncate transition-colors ${darkMode ? 'text-slate-200 group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>{profile?.full_name || user.email?.split('@')[0] || 'User'}</p>
                  <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>{profile?.role || 'Intern Access'}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className={`ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors ${darkMode ? 'text-slate-500 hover:bg-slate-700/60 hover:text-emerald-400' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`relative z-10 flex-grow ml-0 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-64'} p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 transition-all duration-300`}>
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
            aria-label="Open sidebar"
          >
            <span className="flex flex-col justify-center gap-0.5 w-4 h-4">
              <span className="h-0.5 rounded-sm bg-current"></span>
              <span className="h-0.5 rounded-sm bg-current"></span>
              <span className="h-0.5 rounded-sm bg-current"></span>
            </span>
          </button>
        </div>
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
              <div className={`rounded-[40px] p-8 shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div>
                    <div className="relative inline-flex items-center gap-2" ref={dashboardTaskScopeMenuRef}>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Weekly Task</h3>
                      <button
                        type="button"
                        onClick={() => setIsDashboardTaskScopeMenuOpen((prev) => !prev)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="Select task view"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {isDashboardTaskScopeMenuOpen && (
                        <div className={`absolute top-full left-0 mt-2 min-w-[150px] rounded-xl border shadow-lg z-30 overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-200'}`}>
                          {[
                            { value: 'all' as const, label: 'All Task' },
                            { value: 'weekly' as const, label: 'Weekly Task' },
                            { value: 'monthly' as const, label: 'Monthly Task' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setDashboardTaskScope(option.value);
                                setIsDashboardTaskScopeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                dashboardTaskScope === option.value
                                  ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                                  : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-emerald-50')
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                      {dashboardFilteredTaskRows.length} task(s) in {dashboardTaskScopeLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDashboardTaskModalOpen(true)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      darkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-100'
                        : 'bg-gray-50 text-gray-400 hover:text-black'
                    }`}
                    title="Open task list"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>

              {/* All Users Table Section */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-black/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold">All Users</h3>
                      <p className="text-sm text-gray-400">Manage and monitor all {dashboardVisibleMemberProfiles.length} platform members</p>
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
                      {filteredDashboardVisibleProfiles.map((p) => {
                        const onlineStatus = getProfileOnlineStatus(p);
                        const isOnline = onlineStatus === 'Online';

                        return (
                          <tr key={p.id} className="border-b border-black/5 transition-colors group [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                  {getProfilePhotoUrl(p) ? (
                                    <img
                                      src={getProfilePhotoUrl(p)}
                                      alt={p.full_name || getFirstName(p)}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    getFirstName(p)[0] || 'U'
                                  )}
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
                                  ? 'bg-orange-50 text-orange-600'
                                  : p.role?.toLowerCase() === 'intern' || p.role?.toLowerCase() === 'user'
                                  ? 'bg-emerald-50 text-emerald-700'
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
                                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs font-medium">{onlineStatus}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${p.efficiency || 0}%` }}
                                  ></div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDashboardViewProfile(p)}
                                  className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDashboardVisibleProfiles.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-sm italic text-gray-400">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'Analytics' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className={`xl:col-span-2 rounded-[32px] p-6 md:p-8 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Analytics</h3>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>Lifewood Report Overview</p>
                  </div>
                  <button className={`text-lg leading-none transition-colors ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}>⋮</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                  <div className="space-y-4">
                    {analyticsLegendItems.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md" style={{ backgroundColor: item.color }} />
                        <div>
                          <p className={`text-3xl font-bold leading-none ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{item.value}</p>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsWeekData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e5e7eb'} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '14px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)',
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                            color: darkMode ? '#f8fafc' : '#111827',
                          }}
                        />
                        <Bar dataKey="employees" stackId="a" fill="#FFB347" barSize={26}>
                          {analyticsWeekData.map((entry, index) => (
                            <Cell key={`analytics-employees-${entry.day}-${index}`} radius={getAnalyticsLayerRadius(entry, 'employees')} />
                          ))}
                        </Bar>
                        <Bar dataKey="interns" stackId="a" fill="#046241" barSize={26}>
                          {analyticsWeekData.map((entry, index) => (
                            <Cell key={`analytics-interns-${entry.day}-${index}`} radius={getAnalyticsLayerRadius(entry, 'interns')} />
                          ))}
                        </Bar>
                        <Bar dataKey="applicants" stackId="a" fill="#3b82f6" barSize={26}>
                          {analyticsWeekData.map((entry, index) => (
                            <Cell key={`analytics-applicants-${entry.day}-${index}`} radius={getAnalyticsLayerRadius(entry, 'applicants')} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`mt-6 rounded-2xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Summary Insight</p>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Peak system activity is on <span className={`font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{peakAnalyticsDay.day}</span> with{' '}
                    <span className={`font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{peakAnalyticsDay.total}</span> total movements.
                    Current approval conversion is <span className={`font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{approvalRate}%</span>, and daily average activity is{' '}
                    <span className={`font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{analyticsAveragePerDay}</span>.
                  </p>
                </div>
              </div>

              <div className={`rounded-[32px] p-6 md:p-8 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>System Snapshot</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>Realtime internal pipeline status</p>
                </div>

                <div className="space-y-3">
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Pending User Approvals</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{pendingProfiles.length}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Pending Applications</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{pendingApplications.length}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Reviewed Applications</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{reviewedApplications.length}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/5'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Active Members</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{officialMemberProfiles.length}</p>
                  </div>
                </div>

                <div className="mt-6 h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsWeekData}>
                      <defs>
                        <linearGradient id="systemActivityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)',
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                          color: darkMode ? '#f8fafc' : '#111827',
                        }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} fill="url(#systemActivityGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="mb-4">
                  <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>User Growth</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Monthly growth trend</p>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)',
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                          color: darkMode ? '#f8fafc' : '#111827',
                        }}
                      />
                      <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2.5} fill="url(#userGrowthGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="mb-4">
                  <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Task Completion Rates</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Completion distribution</p>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskCompletionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {taskCompletionData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)',
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                          color: darkMode ? '#f8fafc' : '#111827',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        iconType="circle"
                        wrapperStyle={{ color: darkMode ? '#cbd5e1' : '#4b5563', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`rounded-[28px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="mb-4">
                  <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Project Progress</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Current team progress by area</p>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#6b7280' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.12)',
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                          color: darkMode ? '#f8fafc' : '#111827',
                        }}
                      />
                      <Bar dataKey="progress" fill="#046241" radius={[6, 6, 0, 0]} barSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Task' ? (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[#123f2f]">Task</h2>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Create and assign tasks for interns or employees.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Audience</label>
                <div className="relative">
                  <select
                    value={taskRoleFilter}
                    onChange={(e) => setTaskRoleFilter(e.target.value as AdminTaskRole)}
                    className={`appearance-none pl-4 pr-11 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-800'
                    }`}
                  >
                    <option value="intern">Interns</option>
                    <option value="employee">Employees</option>
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-4 flex items-center ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
              <div className={`rounded-[28px] p-6 border shadow-sm min-h-[280px] flex flex-col justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>Create Task</p>
                  <h3 className={`text-xl font-bold mt-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>New Assignment</h3>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Add task details for {taskRoleFilter === 'intern' ? 'Interns' : 'Employees'}.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={openCreateTaskModal}
                    className={`w-full h-14 rounded-2xl border-2 border-dashed flex items-center justify-center text-3xl font-semibold transition-colors ${
                      darkMode
                        ? 'border-[#046241]/40 text-[#046241] hover:bg-[#046241]/10'
                        : 'border-[#046241] text-[#046241] hover:bg-[#046241]/10'
                    }`}
                    title="Create task"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={openCreateTaskModal}
                    className="w-full py-3 rounded-xl bg-[#046241] text-white text-sm font-semibold hover:bg-[#046241]/100 transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>

              <div className={`relative rounded-[28px] p-6 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>Create Task</p>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {createdAssignmentTasks.length === 0 ? (
                    <div className={`rounded-xl p-6 border text-center md:col-span-2 xl:col-span-3 ${darkMode ? 'border-slate-700 text-slate-400' : 'border-black/10 text-gray-500'}`}>
                      No tasks yet for {taskRoleFilter === 'intern' ? 'Interns' : 'Employees'}.
                    </div>
                  ) : (
                    createdAssignmentTasks.map((task) => (
                      <div key={task.id} className={`rounded-xl p-4 border aspect-square flex flex-col ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/10'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Started: {formatTaskDate(task.startedAt)}</p>
                            <p className={`text-[11px] font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Deadline: {formatTaskDate(task.deadline)}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${darkMode ? 'bg-[#046241]/20 text-[#046241]' : 'bg-[#046241]/15 text-[#046241]'}`}>
                            {task.entryType}
                          </span>
                        </div>
                        <p className={`text-xs mt-3 flex-1 overflow-auto ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{task.description}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openEditTaskModal(task)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                              darkMode ? 'border-[#046241]/40 text-[#046241] hover:bg-[#046241]/10' : 'border-[#046241] text-[#046241] hover:bg-[#046241]/10'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteTask(task)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                              darkMode ? 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10' : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {taskRoleFilter === 'intern' && (
              <div className={`rounded-[28px] p-5 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>Intern Progress</p>
                  <div className="group relative">
                    <div className="relative h-10 w-10 origin-right group-hover:w-64 focus-within:w-64 transition-all duration-300 overflow-hidden">
                      <input
                        type="text"
                        placeholder="Search first name..."
                        value={internProgressSearchTerm}
                        onChange={(e) => setInternProgressSearchTerm(e.target.value)}
                        className={`w-full h-full rounded-xl border text-sm focus:outline-none transition-all duration-300 pl-4 pr-11 ${
                          darkMode
                            ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-[#046241]'
                            : 'bg-gray-50 border-[#046241]/30 text-gray-900 placeholder:text-gray-400 focus:border-[#046241]'
                        } opacity-0 group-hover:opacity-100 focus:opacity-100`}
                      />
                      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                {approvedInternProfiles.length === 0 ? (
                  <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No approved interns found.</p>
                ) : filteredTaskInternProgressProfiles.length === 0 ? (
                  <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No matching interns found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-h-[520px] overflow-y-auto pr-1">
                    {filteredTaskInternProgressProfiles.map((intern) => {
                        const internCompletion = clampPercentage(intern?.completion, 0);
                        const internEfficiency = clampPercentage(intern?.efficiency, 0);
                        const internOverall = Math.max(0, Math.min(100, Math.round(internCompletion * 0.7 + internEfficiency * 0.3)));
                        const assignedInternTasks = filteredAdminTasks
                          .filter((task) => task.assignedProfileId === intern.id)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const sharedInternTasks = filteredAdminTasks
                          .filter((task) => !task.assignedProfileId)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const internProgressTasks = [...assignedInternTasks, ...sharedInternTasks]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const nearestInternDeadlineTask = internProgressTasks
                          .map((task) => ({ ...task, deadlineTime: new Date(task.deadline).getTime() }))
                          .filter((task) => Number.isFinite(task.deadlineTime))
                          .sort((a, b) => a.deadlineTime - b.deadlineTime)[0];
                        const internTaskAddedLabel = `${internProgressTasks.length} task${internProgressTasks.length === 1 ? '' : 's'} Added`;
                        const internDeadlineStatusText = (() => {
                          if (!nearestInternDeadlineTask) return 'No deadline yet';
                          const now = new Date();
                          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                          const deadlineDay = new Date(nearestInternDeadlineTask.deadline).getTime();
                          const daysLeft = Math.ceil((deadlineDay - today) / (1000 * 60 * 60 * 24));
                          if (daysLeft < 0) return `${Math.abs(daysLeft)} day(s) overdue`;
                          if (daysLeft === 0) return 'Due today';
                          return `${daysLeft} day(s) left`;
                        })();

                        return (
                          <div key={`intern-progress-card-${intern.id}`} className={`relative rounded-2xl p-4 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-black/10'}`}>
                            <button
                              type="button"
                              onClick={() => openCreateTaskModal({ assignee: intern, source: 'intern-card' })}
                              className={`absolute right-3 top-3 w-8 h-8 rounded-full border flex items-center justify-center text-lg font-semibold ${
                                darkMode
                                  ? 'border-[#046241]/40 text-[#046241] hover:bg-[#046241]/15'
                                  : 'border-[#046241] text-[#046241] hover:bg-[#046241]/10'
                              }`}
                              title="Add task"
                            >
                              +
                            </button>
                            <div className="flex items-center gap-2 mb-2 pr-10">
                              <div className={`w-9 h-9 rounded-full overflow-hidden border ${darkMode ? 'border-slate-600 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                                {getProfilePhotoUrl(intern) ? (
                                  <img
                                    src={getProfilePhotoUrl(intern)}
                                    alt={intern.full_name || getFirstName(intern)}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                    {getFirstName(intern)[0]?.toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>
                              <p className={`text-sm font-semibold min-w-0 truncate ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                                {intern.full_name || getFirstName(intern)}
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`relative w-14 h-24 rounded-[16px] border-2 overflow-hidden ${darkMode ? 'border-[#046241]/60 bg-slate-800' : 'border-[#046241] bg-[#046241]/10'}`}>
                                  <div className="absolute bottom-0 left-0 right-0 bg-[#046241]/80 transition-all duration-300" style={{ height: `${internOverall}%` }} />
                                </div>
                                <p className={`text-[10px] ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>{internOverall}%</p>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-[11px] font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Deadline</p>
                                <p className={`text-[11px] mb-2 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>{internDeadlineStatusText}</p>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className={`text-[11px] font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Task added</p>
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-[#046241]/20 text-[#046241]' : 'bg-[#046241]/15 text-[#046241]'}`}>
                                    {internTaskAddedLabel}
                                  </span>
                                </div>
                                <ul className={`text-[10px] space-y-1 max-h-14 overflow-y-auto pr-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                  {internProgressTasks.length === 0 ? (
                                    <li>No intern task yet</li>
                                  ) : (
                                    internProgressTasks.slice(0, 3).map((task) => (
                                      <li key={`intern-progress-${intern.id}-${task.id}`} className="truncate">- {task.title}</li>
                                    ))
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {isTaskModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={closeTaskModal} />
                <div className={`relative w-full max-w-4xl rounded-[28px] p-6 md:p-8 border shadow-2xl max-h-[90vh] overflow-y-auto ${
                  darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'
                }`}>
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {editingTaskId ? `Edit ${taskEntryType}` : `New ${taskEntryType}`}
                      </h3>
                      {taskAssignee && (
                        <p className={`mt-1 text-sm ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>
                          Assign to: {taskAssignee.name}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={closeTaskModal}
                      className={`w-9 h-9 rounded-lg border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      x
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Type</label>
                        <select
                          value={taskEntryType}
                          onChange={(e) => setTaskEntryType(e.target.value as 'Task' | 'Projects')}
                          className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-800'
                          }`}
                        >
                          <option value="Task">Task</option>
                          <option value="Projects">Projects</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Description</label>
                        <textarea
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          rows={4}
                          placeholder="Write the task description..."
                          className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-black/10 text-gray-800 placeholder:text-gray-400'
                          }`}
                        />
                      </div>

                      {taskModalSource === 'new-assignment' && (
                        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-[#046241]/40' : 'border-[#046241]'}`}>
                          <table className="w-full border-collapse">
                            <tbody>
                              <tr>
                                <td className={`align-top p-3 border-r border-b ${darkMode ? 'border-[#046241]/30 bg-slate-900' : 'border-[#046241] bg-white'}`}>
                                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-[#046241]' : 'text-gray-600'}`}>Lifewood Branding</label>
                                  <input
                                    value={taskCriteria.lifewoodBranding}
                                    onChange={(e) => setTaskCriteria((prev) => ({ ...prev, lifewoodBranding: e.target.value }))}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                                      darkMode ? 'bg-slate-800 border-[#046241]/30 text-slate-100' : 'bg-white border-[#046241] text-gray-800'
                                    }`}
                                  />
                                </td>
                                <td className={`align-top p-3 border-b ${darkMode ? 'border-[#046241]/30 bg-slate-900' : 'border-[#046241] bg-white'}`}>
                                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-[#046241]' : 'text-gray-600'}`}>Color Pallets</label>
                                  <input
                                    value={taskCriteria.colorPalettes}
                                    onChange={(e) => setTaskCriteria((prev) => ({ ...prev, colorPalettes: e.target.value }))}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                                      darkMode ? 'bg-slate-800 border-[#046241]/30 text-slate-100' : 'bg-white border-[#046241] text-gray-800'
                                    }`}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className={`align-top p-3 border-r ${darkMode ? 'border-[#046241]/30 bg-slate-900' : 'border-[#046241] bg-white'}`}>
                                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-[#046241]' : 'text-gray-600'}`}>Design</label>
                                  <input
                                    value={taskCriteria.design}
                                    onChange={(e) => setTaskCriteria((prev) => ({ ...prev, design: e.target.value }))}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                                      darkMode ? 'bg-slate-800 border-[#046241]/30 text-slate-100' : 'bg-white border-[#046241] text-gray-800'
                                    }`}
                                  />
                                  <div className="mt-2 space-y-1">
                                    <p className={`text-[11px] font-semibold ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>
                                      Total : {criteriaTotalScore}
                                    </p>
                                    <p className={`text-[11px] font-semibold ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>
                                      Passing Score : {criteriaPassingScore}
                                    </p>
                                  </div>
                                </td>
                                <td className={`align-top p-3 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                                  <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-[#046241]' : 'text-gray-600'}`}>Content</label>
                                  <input
                                    value={taskCriteria.content}
                                    onChange={(e) => setTaskCriteria((prev) => ({ ...prev, content: e.target.value }))}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#046241]/20 ${
                                      darkMode ? 'bg-slate-800 border-[#046241]/30 text-slate-100' : 'bg-white border-[#046241] text-gray-800'
                                    }`}
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>File</label>
                        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium ${
                          darkMode ? 'border-[#046241]/40 text-[#046241] hover:bg-[#046241]/10' : 'border-[#046241] text-[#046241] hover:bg-[#046241]/10'
                        }`}>
                          Choose File
                          <input type="file" className="hidden" onChange={handleTaskAttachmentChange} />
                        </label>
                        <div className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {taskAttachment ? `${taskAttachment.name} (${Math.max(1, Math.round(taskAttachment.size / 1024))} KB)` : 'No file selected'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Set Deadline</label>
                      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-black/10'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => setTaskCalendarView(new Date(taskCalendarView.getFullYear(), taskCalendarView.getMonth() - 1, 1))}
                            className={`w-8 h-8 rounded-lg border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-white'}`}
                          >
                            {'<'}
                          </button>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>{taskCalendarMonthLabel}</p>
                          <button
                            type="button"
                            onClick={() => setTaskCalendarView(new Date(taskCalendarView.getFullYear(), taskCalendarView.getMonth() + 1, 1))}
                            className={`w-8 h-8 rounded-lg border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-white'}`}
                          >
                            {'>'}
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayLabel) => (
                            <p key={dayLabel} className={`text-center text-[11px] font-semibold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                              {dayLabel}
                            </p>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {taskCalendarDays.map((dayValue, index) => {
                            if (!dayValue) {
                              return <div key={`empty-${index}`} className="h-9" />;
                            }

                            const selectedDateValue = `${taskCalendarView.getFullYear()}-${String(taskCalendarView.getMonth() + 1).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`;
                            const isSelected = taskDeadline === selectedDateValue;

                            return (
                              <button
                                key={selectedDateValue}
                                type="button"
                                onClick={() => setTaskDeadline(selectedDateValue)}
                                className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-orange-500 text-white'
                                    : darkMode
                                      ? 'text-slate-200 hover:bg-[#046241]/25 hover:text-[#046241]'
                                      : 'text-gray-700 hover:bg-[#046241]/15 hover:text-[#046241]'
                                }`}
                              >
                                {dayValue}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`mt-3 text-sm font-medium ${taskDeadline ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-slate-400' : 'text-gray-500')}`}>
                        {taskDeadline ? `Deadline selected: ${formatTaskDate(taskDeadline)}` : 'No deadline selected'}
                      </div>
                    </div>
                  </div>

                  {taskFormNotice && (
                    <p className="mt-5 text-sm text-red-500">{taskFormNotice}</p>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={closeTaskModal}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTask}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#046241] text-white hover:bg-[#046241]/100 transition-colors"
                    >
                      {editingTaskId ? 'Update' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {taskPendingDelete && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={closeDeleteTaskModal} />
                <div className={`relative w-full max-w-md rounded-2xl p-6 border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'}`}>
                  <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Delete Task</h4>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeDeleteTaskModal}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteTask}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'Evaluation' ? (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[#123f2f]">Evaluation</h2>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Review progress and finalize Pass or Fail with comments.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <select
                    value={evaluationRoleFilter}
                    onChange={(e) => setEvaluationRoleFilter(e.target.value as 'intern' | 'employee')}
                    className={`appearance-none pl-4 pr-11 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-800'
                    }`}
                  >
                    <option value="intern">Intern</option>
                    <option value="employee">Employee</option>
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-4 flex items-center ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                <div className="relative min-w-[260px]">
                  <select
                    value={selectedEvaluationUserId}
                    onChange={(e) => setSelectedEvaluationUserId(e.target.value)}
                    className={`appearance-none w-full pl-4 pr-11 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-800'
                    }`}
                  >
                    {evaluationCandidates.length === 0 ? (
                      <option value="">No approved users available</option>
                    ) : (
                      evaluationCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.full_name || candidate.email || candidate.id}
                        </option>
                      ))
                    )}
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-4 flex items-center ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
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
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Total Hours</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {Number(selectedEvaluationAnalytics?.totalHours ?? selectedEvaluationUser.hours_spent ?? 0)} hrs
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
                        AI Insight - Score {evaluationInsight.score}/100
                      </p>
                      <p className={`text-base font-bold mb-1 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{evaluationInsight.title}</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{evaluationInsight.detail}</p>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Task Grade Score: {selectedEvaluationAnalytics?.taskGradeScore ?? 'N/A'} | Graded Tasks: {selectedEvaluationAnalytics?.gradedTaskCount ?? 0} | Finished Tasks: {selectedEvaluationAnalytics?.finishedTaskCount ?? 0}/{selectedEvaluationAnalytics?.assignedTaskCount ?? 0}
                      </p>
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

            <div
              ref={evaluationHistoryRef}
              className={`rounded-[36px] p-6 border shadow-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                  {evaluationRoleFilter === 'intern' ? 'Intern Evaluation History' : 'Employee Evaluation History'}
                </h3>
                <div className="group relative">
                  <div className="relative h-10 w-10 origin-right group-hover:w-64 focus-within:w-64 transition-all duration-300 overflow-hidden">
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={evaluationHistorySearchTerm}
                      onChange={(e) => setEvaluationHistorySearchTerm(e.target.value)}
                      className={`w-full h-full rounded-xl border text-sm focus:outline-none transition-all duration-300 pl-4 pr-11 ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400'
                          : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'
                      } opacity-0 group-hover:opacity-100 focus:opacity-100`}
                    />
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {evaluationHistoryRows.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  No evaluation history yet for this role.
                </p>
              ) : filteredEvaluationHistoryRows.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  No matching evaluation history.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>ID</th>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Scores</th>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>View</th>
                        <th className={`py-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvaluationHistoryRows.map((row) => (
                        <tr
                          key={`evaluation-history-${row.id}`}
                          className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/10'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb] ${
                            evaluationHistoryFocusId === row.id
                              ? (darkMode ? 'bg-emerald-500/15' : 'bg-emerald-50')
                              : ''
                          }`}
                        >
                          <td className={`py-3 text-xs font-mono ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.displayId}</td>
                          <td className={`py-3 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{row.name}</td>
                          <td className={`py-3 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{row.email}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              row.status === 'Pass'
                                ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                                : (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className={`py-3 text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{row.score}/100</td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => setEvaluationViewProfile(row.profile)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                darkMode ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              View
                            </button>
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => setEvaluationDeleteProfile(row.profile)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                darkMode ? 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10' : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                              }`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {evaluationViewProfile && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setEvaluationViewProfile(null)} />
                <div className={`relative w-full max-w-2xl rounded-2xl p-6 border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'}`}>
                  <h4 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Evaluation Details</h4>
                  <div className={`mt-4 space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <p><span className="font-semibold">ID:</span> {getProfileDisplayId(evaluationViewProfile)}</p>
                    <p><span className="font-semibold">Name:</span> {evaluationViewProfile.full_name || getFirstName(evaluationViewProfile)}</p>
                    <p><span className="font-semibold">Email:</span> {evaluationViewProfile.email || 'N/A'}</p>
                    <p><span className="font-semibold">Role:</span> {(evaluationViewProfile.role || '').toString()}</p>
                    <p><span className="font-semibold">Status:</span> {getEvaluationStatus(evaluationViewProfile) || 'Pending'}</p>
                    <p><span className="font-semibold">Score:</span> {getEvaluationAnalytics(evaluationViewProfile).score}/100</p>
                    <p><span className="font-semibold">Task Grade Score:</span> {getEvaluationAnalytics(evaluationViewProfile).taskGradeScore ?? 'N/A'}</p>
                    <p><span className="font-semibold">Graded Tasks:</span> {getEvaluationAnalytics(evaluationViewProfile).gradedTaskCount}</p>
                    <p><span className="font-semibold">Finished Tasks:</span> {getEvaluationAnalytics(evaluationViewProfile).finishedTaskCount}/{getEvaluationAnalytics(evaluationViewProfile).assignedTaskCount}</p>
                    <p><span className="font-semibold">Completion:</span> {Math.round(getEvaluationAnalytics(evaluationViewProfile).completion)}%</p>
                    <p><span className="font-semibold">Efficiency:</span> {Math.round(getEvaluationAnalytics(evaluationViewProfile).efficiency)}%</p>
                    <p><span className="font-semibold">Total Hours:</span> {Math.round(getEvaluationAnalytics(evaluationViewProfile).totalHours)} hrs</p>
                    <p><span className="font-semibold">Comment:</span> {evaluationViewProfile.evaluation_comment || 'No comment'}</p>
                    <p><span className="font-semibold">Last Evaluated:</span> {evaluationViewProfile.last_evaluated_at ? new Date(evaluationViewProfile.last_evaluated_at).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEvaluationViewProfile(null)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {evaluationDeleteProfile && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => !isDeletingEvaluation && setEvaluationDeleteProfile(null)} />
                <div className={`relative w-full max-w-md rounded-2xl p-6 border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'}`}>
                  <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Delete Evaluation</h4>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Delete evaluation history for <span className="font-semibold">{evaluationDeleteProfile.full_name || getFirstName(evaluationDeleteProfile)}</span>?
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEvaluationDeleteProfile(null)}
                      disabled={isDeletingEvaluation}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                        darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-60`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteEvaluationRecord}
                      disabled={isDeletingEvaluation}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-60"
                    >
                      {isDeletingEvaluation ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                      <tr key={row.id} className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'} transition-colors [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
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
        ) : activeTab === 'Projects' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold text-[#123f2f]">Projects</h2>
                <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Submitted project ideas from visitors and users.</p>
              </div>
              <div className="flex items-center gap-2">
                {projectSubmissionNotice && (
                  <p className={`text-xs font-semibold ${projectSubmissionNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                    {projectSubmissionNotice}
                  </p>
                )}
                <button
                  type="button"
                  onClick={fetchProjectSubmissions}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-black/10 text-gray-600 hover:bg-gray-50'}`}
                  title="Refresh submitted projects"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </button>
              </div>
            </div>

            <div className={`rounded-[32px] border shadow-sm overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                      <th className={`py-4 px-5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No</th>
                      <th className={`py-4 px-5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Full Name</th>
                      <th className={`py-4 px-5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                      <th className={`py-4 px-5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Project Name</th>
                      <th className={`py-4 px-5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProjectSubmissions ? (
                      <tr>
                        <td colSpan={5} className={`py-10 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading submissions...</td>
                      </tr>
                    ) : projectSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`py-10 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No submitted projects yet.</td>
                      </tr>
                    ) : (
                      projectSubmissions.map((submission, index) => (
                        <tr key={submission.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
                          <td className={`py-4 px-5 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{index + 1}</td>
                          <td className={`py-4 px-5 text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{submission.full_name || 'N/A'}</td>
                          <td className={`py-4 px-5 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{submission.email || 'N/A'}</td>
                          <td className={`py-4 px-5 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{submission.project_name || 'N/A'}</td>
                          <td className="py-4 px-5">
                            <button
                              type="button"
                              onClick={() => setSelectedProjectSubmission(submission)}
                              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
                                (submission.status || 'pending').toString().toLowerCase() === 'accepted'
                                  ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                                  : (submission.status || 'pending').toString().toLowerCase() === 'declined'
                                  ? (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                                  : (darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700')
                              }`}
                            >
                              {(submission.status || 'pending').toString()}
                            </button>
                          </td>
                        </tr>
                      ))
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
                <h2 className="text-3xl font-bold text-[#123f2f]">New Applicants</h2>
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
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Project Applied For</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Date</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApplications.map((app) => (
                      <tr key={app.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
                        <td className={`py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.phone || 'N/A'}</td>
                        <td className="py-4 text-sm font-bold text-lw-green">{getApplicantPositionLabel(app)}</td>
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
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Project Applied For</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Date</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                      <th className={`py-4 text-[10px] font-bold uppercase tracking-widest text-right ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewedApplications.map((app) => (
                      <tr key={app.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
                        <td className={`py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className="py-4 text-sm font-bold text-lw-green">{getApplicantPositionLabel(app)}</td>
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
                        <p className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{getApplicantPositionLabel(selectedApplicant)}</p>
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
        ) : activeTab === 'Settings' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#1a1a1a]'}`}>Settings</h2>
                <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>General account controls, history logs, and security visibility.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
              <aside className={`rounded-[28px] border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <p className={`px-3 pb-3 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-emerald-600/60'}`}>Settings Menu</p>
                <div className="space-y-2">
                  {settingsPanels.map((panel) => {
                    const isActive = settingsView === panel.key;
                    return (
                      <button
                        key={panel.key}
                        type="button"
                        onClick={() => setSettingsView(panel.key)}
                        className={`group w-full rounded-2xl border px-3 py-3 text-left transition-all ${
                          isActive
                            ? (darkMode
                              ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-700')
                            : (darkMode
                              ? 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                              : 'border-transparent bg-gray-50 text-gray-600 hover:border-emerald-100 hover:bg-emerald-50/60 hover:text-emerald-700')
                        }`}
                      >
                        <p className="text-sm font-bold">{panel.label}</p>
                        <p className={`text-[11px] mt-1 ${isActive ? (darkMode ? 'text-emerald-200/80' : 'text-emerald-700/80') : (darkMode ? 'text-slate-500 group-hover:text-slate-400' : 'text-gray-400 group-hover:text-emerald-600/80')}`}>
                          {panel.helper}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className={`rounded-[32px] border p-6 md:p-8 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                {settingsView === 'general' ? (
                  <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>General</h3>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Account profile and app preferences.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Full Name</span>
                        <input
                          type="text"
                          value={settingsFullName}
                          onChange={(e) => setSettingsFullName(e.target.value)}
                          placeholder="Enter full name"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-gray-50 border-black/10 text-gray-900 placeholder:text-gray-400'}`}
                        />
                      </label>
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Name</span>
                        <input
                          type="text"
                          value={settingsNickName}
                          onChange={(e) => setSettingsNickName(e.target.value)}
                          placeholder="Nickname / display name"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-gray-50 border-black/10 text-gray-900 placeholder:text-gray-400'}`}
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Email</span>
                        <input
                          type="email"
                          value={(user?.email || profile?.email || '').toString()}
                          readOnly
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm cursor-not-allowed ${darkMode ? 'bg-slate-900/70 border-slate-700 text-slate-300' : 'bg-gray-100 border-black/10 text-gray-600'}`}
                        />
                      </label>
                    </div>

                    <div className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-black/10 bg-gray-50'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Password</p>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>New Password</span>
                          <input
                            type="password"
                            value={settingsPassword}
                            onChange={(e) => setSettingsPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-black/10 text-gray-900 placeholder:text-gray-400'}`}
                          />
                        </label>
                        <label className="block">
                          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Confirm Password</span>
                          <input
                            type="password"
                            value={settingsConfirmPassword}
                            onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-black/10 text-gray-900 placeholder:text-gray-400'}`}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>App Language</span>
                        <select
                          value={settingsLanguage}
                          onChange={(e) => setSettingsLanguage(e.target.value)}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                        >
                          {APP_LANGUAGE_OPTIONS.map((languageOption) => (
                            <option key={languageOption} value={languageOption}>{languageOption}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {settingsNotice ? (
                        <p className={`text-xs font-semibold ${settingsNotice.toLowerCase().includes('unable') || settingsNotice.toLowerCase().includes('failed') || settingsNotice.toLowerCase().includes('required') || settingsNotice.toLowerCase().includes('match') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-600')}`}>
                          {settingsNotice}
                        </p>
                      ) : <span />}
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {isSavingSettings ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : settingsView === 'history' ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>History</h3>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Deleted accounts, archived applicants, and declined/deleted projects.</p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchSettingsHistory}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-black/10 text-gray-600 hover:bg-gray-50'}`}
                        title="Refresh history"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                      </button>
                    </div>

                    {settingsHistoryNotice ? (
                      <p className={`text-xs font-semibold ${settingsHistoryNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-sky-300' : 'text-sky-700')}`}>
                        {settingsHistoryNotice}
                      </p>
                    ) : null}

                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                      <div className={`px-4 py-3 border-b ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-black/10'}`}>
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Archive and Deleted Accounts</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[680px]">
                          <thead>
                            <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Account</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Source</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Time</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Manage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accountHistoryTableRows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className={`py-10 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No archive or deleted account records yet.</td>
                              </tr>
                            ) : (
                              accountHistoryTableRows.map((row) => {
                                const action = (row.action || '').toString().toLowerCase();
                                const actionClass =
                                  action === 'archived'
                                    ? (darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700')
                                    : (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700');
                                return (
                                  <tr key={row.id} className={`border-b ${darkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-black/5 hover:bg-gray-50'}`}>
                                    <td className="py-3 px-4">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${actionClass}`}>
                                        {action || 'unknown'}
                                      </span>
                                    </td>
                                    <td className={`py-3 px-4 text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{getHistoryDisplayName(row)}</td>
                                    <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.email || 'N/A'}</td>
                                    <td className={`py-3 px-4 text-sm capitalize ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.source || 'account'}</td>
                                    <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{formatDateTimeLabel(row.created_at)}</td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => openDeleteAccountHistoryModal(row)}
                                        disabled={historyDeleteActionKey === `account:${row.id}`}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-60 ${
                                          darkMode
                                            ? 'border border-red-500/70 text-red-300 hover:bg-red-500/10'
                                            : 'border border-red-200 text-red-600 hover:bg-red-50'
                                        }`}
                                      >
                                        {historyDeleteActionKey === `account:${row.id}` ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                      <div className={`px-4 py-3 border-b ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-black/10'}`}>
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Declined and Deleted Projects</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[680px]">
                          <thead>
                            <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Project Name</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Owner</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Table</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Recorded At</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Manage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectHistoryTableRows.length === 0 ? (
                              <tr>
                                <td colSpan={7} className={`py-10 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No declined or deleted project records yet.</td>
                              </tr>
                            ) : (
                              projectHistoryTableRows.map((row) => (
                                <tr key={row.id} className={`border-b ${darkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-black/5 hover:bg-gray-50'}`}>
                                  <td className="py-3 px-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                      (row.action || '').toString().toLowerCase() === 'declined'
                                        ? (darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700')
                                        : (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                                    }`}>
                                      {(row.action || 'unknown').toString()}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-4 text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{row.project_name || 'Untitled Project'}</td>
                                  <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.full_name || 'Unknown'}</td>
                                  <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.email || 'N/A'}</td>
                                  <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{row.source_table || 'project_submissions'}</td>
                                  <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{formatDateTimeLabel(row.created_at)}</td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => openDeleteProjectHistoryModal(row)}
                                      disabled={historyDeleteActionKey === `project:${row.id}`}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-60 ${
                                        darkMode
                                          ? 'border border-red-500/70 text-red-300 hover:bg-red-500/10'
                                          : 'border border-red-200 text-red-600 hover:bg-red-50'
                                      }`}
                                    >
                                      {historyDeleteActionKey === `project:${row.id}` ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {historyDeleteTarget && (
                      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div
                          className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                          onClick={closeHistoryDeleteModal}
                        />
                        <div className={`relative w-full max-w-md rounded-2xl p-6 border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'}`}>
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                            {historyDeleteTarget.title}
                          </h4>
                          <p className={`mt-2 text-sm whitespace-pre-line ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {historyDeleteTarget.message}
                          </p>
                          <div className="mt-5 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={closeHistoryDeleteModal}
                              disabled={isHistoryDeleteProcessing}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                                darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                              } disabled:opacity-60`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmHistoryDelete}
                              disabled={isHistoryDeleteProcessing}
                              className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-60"
                            >
                              {isHistoryDeleteProcessing ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Security</h3>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>MFA options and recent login sessions.</p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchLoginActivity}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-black/10 text-gray-600 hover:bg-gray-50'}`}
                        title="Refresh security logs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                      </button>
                    </div>

                    {settingsSecurityNotice ? (
                      <p className={`text-xs font-semibold ${settingsSecurityNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-sky-300' : 'text-sky-700')}`}>
                        {settingsSecurityNotice}
                      </p>
                    ) : null}

                    <div className={`rounded-2xl border p-5 ${darkMode ? 'border-slate-700 bg-[#111827]' : 'border-black/10 bg-[#0f172a]'}`}>
                      <h4 className="text-white text-xl font-semibold">Multi-factor authentication (MFA)</h4>
                      <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white text-lg">Authenticator app</p>
                            <p className="text-sm text-slate-300">Use one-time codes from an authenticator app.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMfaAppEnabled((prev) => !prev)}
                            className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${isMfaAppEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-1 ${isMfaAppEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white text-lg">Text message</p>
                            <p className="text-sm text-slate-300">Get 6-digit verification codes by SMS.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMfaSmsEnabled((prev) => !prev)}
                            className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${isMfaSmsEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-1 ${isMfaSmsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div>
                          <p className="text-white text-lg">Trusted Devices</p>
                          <p className="text-sm text-slate-300">When you sign in on another device, it appears in the login activity table below.</p>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="px-5 py-2 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                        >
                          Log out of this device
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOutAllDevices}
                          disabled={isSigningOutAll}
                          className="px-5 py-2 rounded-full border border-red-400 text-red-300 font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-60"
                        >
                          {isSigningOutAll ? 'Logging out...' : 'Log out all'}
                        </button>
                      </div>
                    </div>

                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                      <div className={`px-4 py-3 border-b ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-black/10'}`}>
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Login Activity</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[760px]">
                          <thead>
                            <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Device</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Browser</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>OS</th>
                              <th className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Login Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedLoginActivityRows.map((row) => (
                              <tr key={row.id} className={`border-b ${darkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-black/5 hover:bg-gray-50'}`}>
                                <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{row.user_email || user?.email || 'N/A'}</td>
                                <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.device_type || 'Unknown'}</td>
                                <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.browser || 'Unknown'}</td>
                                <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{row.os || 'Unknown'}</td>
                                <td className={`py-3 px-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{formatDateTimeLabel(row.login_at || row.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'Manage Users' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-[#123f2f]">Manage Users</h2>
                {manageUsersNotice ? (
                  <p className={`text-xs font-semibold mt-1 ${manageUsersNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-600')}`}>
                    {manageUsersNotice}
                  </p>
                ) : null}
              </div>
              <button 
                onClick={refreshUsersData}
                className={`p-2 rounded-full shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-black/5 hover:bg-gray-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              </button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 items-start ${expandedManageFrames.length === 0 ? 'gap-10' : 'gap-8'}`}>
              {/* Interns Table */}
              <div className={`rounded-[40px] ${getManageFramePaddingClass('interns')} shadow-sm border transition-colors ${getManageFrameLayoutClass('interns')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <ClickSpark
                  sparkColor={darkMode ? '#ffffff' : '#059669'}
                  sparkSize={12}
                  sparkRadius={18}
                  sparkCount={10}
                  duration={450}
                  extraScale={1.15}
                  excludeSelectors={['.click-spark-no-trigger']}
                >
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
                  <div className="click-spark-no-trigger overflow-x-auto overflow-y-auto max-h-[36rem] pr-1">
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
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
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
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingUser({ ...p })}
                                className="text-emerald-600 hover:text-emerald-800 font-bold text-[10px] uppercase tracking-widest transition-colors"
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                onClick={() => requestManageProfileDeletion(p)}
                                disabled={isDeletingManageProfile && manageDeleteProfile?.id === p.id}
                                className={`font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60 ${darkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-700'}`}
                              >
                                Delete
                              </button>
                            </div>
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
                </ClickSpark>
              </div>

              {/* Pending Approvals Table */}
              <div className={`rounded-[40px] ${getManageFramePaddingClass('pending')} shadow-sm border transition-colors ${getManageFrameLayoutClass('pending')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
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
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
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
              <div className={`rounded-[40px] ${getManageFramePaddingClass('employees')} shadow-sm border transition-colors ${getManageFrameLayoutClass('employees')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <ClickSpark
                  sparkColor={darkMode ? '#ffffff' : '#059669'}
                  sparkSize={12}
                  sparkRadius={18}
                  sparkCount={10}
                  duration={450}
                  extraScale={1.15}
                  excludeSelectors={['.click-spark-no-trigger']}
                >
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
                  <div className="click-spark-no-trigger overflow-x-auto">
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
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
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
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingUser({ ...p })}
                                className="text-emerald-600 hover:text-emerald-800 font-bold text-[10px] uppercase tracking-widest transition-colors"
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                onClick={() => requestManageProfileDeletion(p)}
                                disabled={isDeletingManageProfile && manageDeleteProfile?.id === p.id}
                                className={`font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60 ${darkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-700'}`}
                              >
                                Delete
                              </button>
                            </div>
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
                </ClickSpark>
              </div>

              {/* Admins Table */}
              <div className={`rounded-[40px] ${getManageFramePaddingClass('admins')} shadow-sm border transition-colors ${getManageFrameLayoutClass('admins')} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
                    </div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Admins</h3>
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
                          value={adminSearchTerm}
                          onChange={(e) => setAdminSearchTerm(e.target.value)}
                          className={`w-full h-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none transition-all duration-300 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400' : 'bg-gray-50 border-emerald-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleManageFrameExpansion('admins')}
                      title={isManageFrameExpanded('admins') ? 'Collapse frame' : 'Expand frame'}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-gray-50 border-emerald-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {isManageFrameExpanded('admins') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="max-h-[18rem] overflow-y-auto pr-1 space-y-3">
                    {filteredManageAdminProfiles.map((adminProfile) => (
                      <div
                        key={adminProfile.id}
                        className={`rounded-2xl border p-4 transition-colors ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-black/5 bg-gray-50'}`}
                      >
                        <p className={`text-lg sm:text-xl font-black uppercase tracking-wide ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          {adminProfile.full_name || getFirstName(adminProfile)}
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{adminProfile.email || 'N/A'}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                            {adminProfile.phone || 'No number'}
                          </span>
                          <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${darkMode ? 'bg-sky-500/20 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>
                            {getAdminPositionLabel(adminProfile)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredManageAdminProfiles.length === 0 && (
                      <div className={`py-6 text-center text-sm italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        No admins found
                      </div>
                    )}
                  </div>

                  <div className={`rounded-3xl border p-5 ${darkMode ? 'border-slate-700 bg-slate-900/40' : 'border-black/5 bg-gray-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Add Admin</p>
                    <form onSubmit={handleAddAdmin} className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Name</label>
                        <input
                          type="text"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="Enter full name"
                          className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Email</label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Enter account email"
                          className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Number</label>
                        <input
                          type="text"
                          value={newAdminNumber}
                          onChange={(e) => setNewAdminNumber(e.target.value)}
                          placeholder="Enter phone number"
                          className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Position</label>
                        <div className="relative">
                          <input
                            type="text"
                            list="admin-position-options"
                            value={newAdminPosition}
                            onChange={(e) => setNewAdminPosition(e.target.value)}
                            placeholder="Choose or type position"
                            className={`w-full px-4 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                          />
                          <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                          <datalist id="admin-position-options">
                            {ADMIN_POSITION_OPTIONS.map((option) => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingAdmin}
                        className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmittingAdmin ? 'Saving...' : 'Add Admin'}
                      </button>
                    </form>
                    {adminManageNotice && (
                      <p className={`mt-3 text-xs ${adminManageNotice.toLowerCase().includes('success') ? (darkMode ? 'text-emerald-300' : 'text-emerald-600') : (darkMode ? 'text-amber-300' : 'text-amber-600')}`}>
                        {adminManageNotice}
                      </p>
                    )}
                  </div>
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
        {dashboardViewProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDashboardViewProfile(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-3xl rounded-[32px] p-6 md:p-8 border shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>User Information</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Read-only profile summary.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDashboardViewProfile(null)}
                  className={`w-9 h-9 rounded-lg border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                  x
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Full Name</span>
                  <input
                    readOnly
                    value={dashboardViewProfile.full_name || getFirstName(dashboardViewProfile)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Email</span>
                  <input
                    readOnly
                    value={dashboardViewProfile.email || 'N/A'}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Role</span>
                  <input
                    readOnly
                    value={dashboardViewProfile.role || 'N/A'}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Status</span>
                  <input
                    readOnly
                    value={getProfileOnlineStatus(dashboardViewProfile)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Country</span>
                  <input
                    readOnly
                    value={dashboardViewProfile.country || 'Not set'}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Phone</span>
                  <input
                    readOnly
                    value={dashboardViewProfile.phone || 'N/A'}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Joined</span>
                  <input
                    readOnly
                    value={dashboardViewProfile.created_at ? new Date(dashboardViewProfile.created_at).toLocaleString() : 'N/A'}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Efficiency</span>
                  <input
                    readOnly
                    value={`${Number(dashboardViewProfile.efficiency || 0)}%`}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`}
                  />
                </label>
              </div>
            </motion.div>
          </div>
        )}

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

        {manageDeleteProfile && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={closeManageDeleteModal}
            />
            <div className={`relative w-full max-w-md rounded-2xl p-6 border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'}`}>
              <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Confirm Account Deletion</h4>
              <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Delete this account permanently? This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeManageDeleteModal}
                  disabled={isDeletingManageProfile}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-60`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteManageProfile}
                  disabled={isDeletingManageProfile}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  {isDeletingManageProfile ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProjectSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProjectDecisionSaving && setSelectedProjectSubmission(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-3xl rounded-[32px] p-6 md:p-8 border shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Project Submission</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Review details before deciding.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProjectSubmission(null)}
                  disabled={isProjectDecisionSaving}
                  className={`w-9 h-9 rounded-lg border ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'} disabled:opacity-60`}
                >
                  x
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Full Name</span>
                  <input readOnly value={selectedProjectSubmission.full_name || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Email</span>
                  <input readOnly value={selectedProjectSubmission.email || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Contact Number</span>
                  <input readOnly value={selectedProjectSubmission.contact_number || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Project Name</span>
                  <input readOnly value={selectedProjectSubmission.project_name || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Description</span>
                  <textarea readOnly rows={4} value={selectedProjectSubmission.description || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm resize-none ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Projects link</span>
                  <input readOnly value={selectedProjectSubmission.project_link || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Video / File Link (rive, YouTube, Dropbox)</span>
                  <input readOnly value={selectedProjectSubmission.resource_link || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Upload Video or File</span>
                  <input readOnly value={selectedProjectSubmission.uploaded_file_name || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Main AI Need</span>
                  <input readOnly value={selectedProjectSubmission.main_ai_need || ''} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-50 border-black/10 text-gray-800'}`} />
                </label>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDeleteProjectSubmission}
                  disabled={isProjectDecisionSaving}
                  className="px-6 py-3 rounded-xl border border-red-500 text-red-500 text-sm font-bold hover:bg-red-500/10 disabled:opacity-60"
                >
                  {isProjectDecisionSaving ? 'Saving...' : 'Delete Project'}
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleProjectSubmissionDecision('declined')}
                    disabled={isProjectDecisionSaving}
                    className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
                  >
                    {isProjectDecisionSaving ? 'Saving...' : 'Decline'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProjectSubmissionDecision('accepted')}
                    disabled={isProjectDecisionSaving}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isProjectDecisionSaving ? 'Saving...' : 'Accept'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isDashboardTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDashboardTaskModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-5xl rounded-[40px] p-6 md:p-8 border shadow-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#046241]' : 'text-[#046241]'}`}>Create Task</p>
                  <h3 className={`text-2xl font-bold mt-1 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{dashboardTaskScopeLabel}</h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Task has been given in the Task content.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDashboardTaskModalOpen(false)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className={`rounded-[28px] border p-5 md:p-6 min-h-[260px] max-h-[58vh] overflow-y-auto ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-black/10 bg-white'}`}>
                {dashboardFilteredTaskRows.length === 0 ? (
                  <p className={`text-center mt-10 text-3xl ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    No tasks yet for {taskRoleFilter === 'intern' ? 'Interns' : 'Employees'}.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboardFilteredTaskRows.map((task) => {
                      const category = getDashboardTaskCategory(task);
                      return (
                        <div
                          key={`dashboard-task-${task.id}`}
                          className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-800/70' : 'border-black/10 bg-gray-50'}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{task.title}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                              category === 'weekly'
                                ? (darkMode ? 'bg-[#046241]/20 text-[#046241]' : 'bg-[#046241]/15 text-[#046241]')
                                : (darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700')
                            }`}>
                              {category === 'weekly' ? 'Weekly Task' : 'Monthly Task'}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {task.assignedProfileName ? `Assigned to ${task.assignedProfileName}` : 'Unassigned'} • {task.targetRole === 'intern' ? 'Interns' : 'Employees'}
                          </p>
                          <p className={`text-sm mt-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{task.description}</p>
                          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            Started: {formatTaskDate(task.startedAt)} • Deadline: {formatTaskDate(task.deadline)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

