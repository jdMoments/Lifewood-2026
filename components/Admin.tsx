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
import Aurora from './Aurora';

const ADMIN_EMAILS = ['damayojholmer@gmail.com', 'jholmerdamayo@gmail.com'];
const EMAILJS_SERVICE_ID = 'service_gtody9o';
const EMAILJS_ACCEPT_TEMPLATE_ID = 'template_0qxt2rp';
const EMAILJS_DECLINE_TEMPLATE_ID = 'template_10tdhwj';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const EMAILJS_PUBLIC_KEY_FALLBACK = 'EXXsfAlITcTrjyHi';
const EMAILJS_TEMPLATE_PARAM_KEY_REGEX = /^[A-Za-z0-9_]+$/;
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

const isMissingInterviewAtColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    message.includes('interview_at') &&
    (
      message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('schema cache') ||
      message.includes('column')
    )
  );
};

const isUnsupportedHiredStatusError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    error?.code === '23514' ||
    error?.code === '22P02' ||
    (message.includes('status') && message.includes('hired') && message.includes('constraint')) ||
    message.includes('applications_status_check')
  );
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
  interview_at?: string | null;
  position?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | 'hired' | 'archived' | string;
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

type ContactMessageItem = {
  id: string;
  created_at?: string | null;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  message?: string | null;
  source_table?: 'inbox_messages' | string | null;
};

type InboxReplyItem = {
  id: string;
  senderName: string;
  senderEmail: string;
  text: string;
  sentAt: string;
};

type ResumeScoreSection = {
  key: string;
  label: string;
  points: number;
  max: number;
  notes: string[];
};

type ResumeAnalysisResult = {
  totalPoints: number;
  maxPoints: number;
  sections: ResumeScoreSection[];
  analyzedAt: string;
};

type ProcessedApplicantAiAnalysis = {
  applicantId: string;
  applicantName: string;
  totalPoints: number;
  maxPoints: number;
  skills: string[];
  sections: ResumeScoreSection[];
  analyzedAt: string;
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
type ManageUsersCategoryFilter = 'all' | ManageFrameKey;

const MANAGE_FRAME_ORDER: ManageFrameKey[] = ['interns', 'pending', 'employees', 'admins'];
const ADMIN_POSITION_OPTIONS = ['Manager', 'Hr', 'CEO', 'Senior Developer'];
const APP_LANGUAGE_OPTIONS = ['English', 'Filipino', 'Japanese', 'Mandarin'];
const APPLICANT_PROJECT_FILTER_OPTIONS = [
  'Casual Video Models (Video Data Collection)',
  'Moderator & Voice Participants (Voice Data Collection)',
  'Data Annotator (Iphone User)',
  'Image Data Collector (Capturing Text - Rich Items)',
  'Data Curation (Genealogy Project)',
  'Intern (Applicant to PH only)',
];
const CONTACT_MESSAGE_TABLE = 'inbox_messages' as const;
const INBOX_READ_STORAGE_KEY = 'lifewood_admin_inbox_read_v1';
const INBOX_REPLY_STORAGE_KEY = 'lifewood_admin_inbox_reply_v1';
const INBOX_ARCHIVED_STORAGE_KEY = 'lifewood_admin_inbox_archived_v1';
const INBOX_DELETED_STORAGE_KEY = 'lifewood_admin_inbox_deleted_v1';
const HIRED_STATUS_OVERRIDE_STORAGE_KEY = 'lifewood_admin_hired_status_override_v1';
const HISTORY_HIDDEN_ACCOUNT_STORAGE_KEY = 'lifewood_admin_hidden_account_history_v1';
const HISTORY_HIDDEN_PROJECT_STORAGE_KEY = 'lifewood_admin_hidden_project_history_v1';

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
  const [manageUsersCategoryFilter, setManageUsersCategoryFilter] = useState<ManageUsersCategoryFilter>('all');
  const [isManageUsersCategoryMenuOpen, setIsManageUsersCategoryMenuOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [applications, setApplications] = useState<AdminApplicationItem[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<AdminApplicationItem | null>(null);
  const [acceptApplicantConfirmTarget, setAcceptApplicantConfirmTarget] = useState<AdminApplicationItem | null>(null);
  const [declineApplicantConfirmTarget, setDeclineApplicantConfirmTarget] = useState<AdminApplicationItem | null>(null);
  const [hireApplicantConfirmTarget, setHireApplicantConfirmTarget] = useState<AdminApplicationItem | null>(null);
  const [pendingApplicantNameSearch, setPendingApplicantNameSearch] = useState('');
  const [pendingApplicantProjectFilter, setPendingApplicantProjectFilter] = useState('all');
  const [isPendingApplicantProjectMenuOpen, setIsPendingApplicantProjectMenuOpen] = useState(false);
  const [processedApplicantStatusFilter, setProcessedApplicantStatusFilter] = useState<'all' | 'accepted' | 'declined' | 'hired'>('all');
  const [processedApplicantNameSearch, setProcessedApplicantNameSearch] = useState('');
  const [selectedProcessedApplicantId, setSelectedProcessedApplicantId] = useState('');
  const [processedApplicantAiAnalysis, setProcessedApplicantAiAnalysis] = useState<ProcessedApplicantAiAnalysis | null>(null);
  const [processedApplicantAiCache, setProcessedApplicantAiCache] = useState<Record<string, ProcessedApplicantAiAnalysis>>({});
  const [isLoadingProcessedApplicantAi, setIsLoadingProcessedApplicantAi] = useState(false);
  const [processedApplicantAiNotice, setProcessedApplicantAiNotice] = useState('');
  const [isProcessedApplicantStatusMenuOpen, setIsProcessedApplicantStatusMenuOpen] = useState(false);
  const [resumePreviewApplicant, setResumePreviewApplicant] = useState<AdminApplicationItem | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeAnalysisResult, setResumeAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [resumeAnalysisNotice, setResumeAnalysisNotice] = useState('');
  const [applicantResumePointsById, setApplicantResumePointsById] = useState<Record<string, number>>({});
  const [isLoadingSelectedApplicantResumePoints, setIsLoadingSelectedApplicantResumePoints] = useState(false);
  const [applicantActionNotice, setApplicantActionNotice] = useState('');
  const [applicantSuccessPopup, setApplicantSuccessPopup] = useState<{ title: string; subtitle?: string } | null>(null);
  const [isUpdatingApplicantStatus, setIsUpdatingApplicantStatus] = useState(false);
  const [hiredStatusOverrideIds, setHiredStatusOverrideIds] = useState<string[]>([]);
  const [openApplicantActionMenuId, setOpenApplicantActionMenuId] = useState<string | null>(null);
  const [applicantRowActionId, setApplicantRowActionId] = useState<string | null>(null);
  const [applicantInterviewDate, setApplicantInterviewDate] = useState('');
  const [applicantInterviewTime, setApplicantInterviewTime] = useState('');
  const [isSavingApplicantInterview, setIsSavingApplicantInterview] = useState(false);
  const [isApplicantInterviewSaved, setIsApplicantInterviewSaved] = useState(false);
  const [applicantInterviewSavedAt, setApplicantInterviewSavedAt] = useState<string | null>(null);
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
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [inboxSourceDebug, setInboxSourceDebug] = useState<Array<{ table: string; rows: number; error: string }>>([]);
  const [selectedInboxMessageId, setSelectedInboxMessageId] = useState('');
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [inboxNotice, setInboxNotice] = useState('');
  const [inboxSearchTerm, setInboxSearchTerm] = useState('');
  const [inboxReadFilter, setInboxReadFilter] = useState<'all' | 'read' | 'unread' | 'archived'>('all');
  const [readInboxIds, setReadInboxIds] = useState<string[]>([]);
  const [archivedInboxIds, setArchivedInboxIds] = useState<string[]>([]);
  const [deletedInboxIds, setDeletedInboxIds] = useState<string[]>([]);
  const [openInboxActionMenuId, setOpenInboxActionMenuId] = useState('');
  const [inboxDeleteTargetId, setInboxDeleteTargetId] = useState('');
  const [inboxReplies, setInboxReplies] = useState<Record<string, InboxReplyItem[]>>({});
  const [inboxReplyDraft, setInboxReplyDraft] = useState('');
  const [inboxReplyNotice, setInboxReplyNotice] = useState('');
  const [isInboxReplyComposerOpen, setIsInboxReplyComposerOpen] = useState(false);
  const [selectedInboxReplyView, setSelectedInboxReplyView] = useState<InboxReplyItem | null>(null);
  const [previewInboxMessageId, setPreviewInboxMessageId] = useState('');
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
  const [hiddenAccountHistoryIds, setHiddenAccountHistoryIds] = useState<string[]>([]);
  const [hiddenProjectHistoryIds, setHiddenProjectHistoryIds] = useState<string[]>([]);
  const [loginActivityRows, setLoginActivityRows] = useState<LoginActivityItem[]>([]);
  const [isMfaAppEnabled, setIsMfaAppEnabled] = useState(false);
  const [isMfaSmsEnabled, setIsMfaSmsEnabled] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const [historyDeleteActionKey, setHistoryDeleteActionKey] = useState<string | null>(null);
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState<HistoryDeleteTarget | null>(null);
  const manageUsersCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);
  const applicantActionMenuRef = useRef<HTMLDivElement | null>(null);
  const pendingApplicantProjectMenuRef = useRef<HTMLDivElement | null>(null);
  const processedApplicantStatusMenuRef = useRef<HTMLDivElement | null>(null);
  const applicantSuccessPopupTimerRef = useRef<number | null>(null);
  const inboxLongPressTimerRef = useRef<number | null>(null);
  const inboxPreviewAutoCloseTimerRef = useRef<number | null>(null);
  const suppressNextInboxClickRef = useRef(false);
  const resumeAnalysisRequestRef = useRef(0);
  const evaluationHistoryRef = useRef<HTMLDivElement | null>(null);
  const dashboardTaskScopeMenuRef = useRef<HTMLDivElement | null>(null);

  const showApplicantSuccessPopup = (title: string, subtitle?: string) => {
    if (applicantSuccessPopupTimerRef.current) {
      window.clearTimeout(applicantSuccessPopupTimerRef.current);
    }
    setApplicantSuccessPopup({ title, subtitle });
    applicantSuccessPopupTimerRef.current = window.setTimeout(() => {
      setApplicantSuccessPopup(null);
      applicantSuccessPopupTimerRef.current = null;
    }, 2400);
  };

  useEffect(() => {
    return () => {
      if (applicantSuccessPopupTimerRef.current) {
        window.clearTimeout(applicantSuccessPopupTimerRef.current);
      }
      if (inboxLongPressTimerRef.current) {
        window.clearTimeout(inboxLongPressTimerRef.current);
      }
      if (inboxPreviewAutoCloseTimerRef.current) {
        window.clearTimeout(inboxPreviewAutoCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedApplicant) return;
    resumeAnalysisRequestRef.current += 1;
    setResumePreviewApplicant(null);
    setIsAnalyzingResume(false);
    setResumeAnalysisResult(null);
    setResumeAnalysisNotice('');
    setAcceptApplicantConfirmTarget(null);
    setDeclineApplicantConfirmTarget(null);
    setHireApplicantConfirmTarget(null);
  }, [selectedApplicant]);

  useEffect(() => {
    try {
      const storedReadIds = window.localStorage.getItem(INBOX_READ_STORAGE_KEY);
      if (storedReadIds) {
        const parsed = JSON.parse(storedReadIds);
        if (Array.isArray(parsed)) {
          setReadInboxIds(parsed.filter((value) => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.warn('Unable to restore inbox read state:', error);
    }

    try {
      const storedReplies = window.localStorage.getItem(INBOX_REPLY_STORAGE_KEY);
      if (storedReplies) {
        const parsed = JSON.parse(storedReplies);
        if (parsed && typeof parsed === 'object') {
          const normalized: Record<string, InboxReplyItem[]> = {};
          Object.entries(parsed as Record<string, any>).forEach(([messageId, replyValue], replyIndex) => {
            if (!messageId) return;

            const normalizeOneReply = (value: any, index: number): InboxReplyItem | null => {
              if (!value || typeof value !== 'object') return null;
              const text = asCleanText(value.text);
              if (!text) return null;
              const sentAt = asCleanText(value.sentAt) || new Date().toISOString();
              return {
                id: asCleanText(value.id) || `${messageId}-${sentAt}-${index}`,
                senderName: asCleanText(value.senderName || value.name) || 'Admin',
                senderEmail: asCleanText(value.senderEmail || value.email) || '',
                text,
                sentAt,
              };
            };

            if (Array.isArray(replyValue)) {
              const normalizedItems = replyValue
                .map((entry, index) => normalizeOneReply(entry, index))
                .filter((entry): entry is InboxReplyItem => Boolean(entry));
              if (normalizedItems.length) {
                normalized[messageId] = normalizedItems;
              }
              return;
            }

            const singleReply = normalizeOneReply(replyValue, replyIndex);
            if (singleReply) {
              normalized[messageId] = [singleReply];
            }
          });
          setInboxReplies(normalized);
        }
      }
    } catch (error) {
      console.warn('Unable to restore inbox replies:', error);
    }

    try {
      const storedHiredOverrides = window.localStorage.getItem(HIRED_STATUS_OVERRIDE_STORAGE_KEY);
      if (storedHiredOverrides) {
        const parsed = JSON.parse(storedHiredOverrides);
        if (Array.isArray(parsed)) {
          setHiredStatusOverrideIds(parsed.filter((value) => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.warn('Unable to restore hired status overrides:', error);
    }

    try {
      const storedArchivedInboxIds = window.localStorage.getItem(INBOX_ARCHIVED_STORAGE_KEY);
      if (storedArchivedInboxIds) {
        const parsed = JSON.parse(storedArchivedInboxIds);
        if (Array.isArray(parsed)) {
          setArchivedInboxIds(parsed.filter((value) => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.warn('Unable to restore archived inbox ids:', error);
    }

    try {
      const storedDeletedInboxIds = window.localStorage.getItem(INBOX_DELETED_STORAGE_KEY);
      if (storedDeletedInboxIds) {
        const parsed = JSON.parse(storedDeletedInboxIds);
        if (Array.isArray(parsed)) {
          setDeletedInboxIds(parsed.filter((value) => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.warn('Unable to restore deleted inbox ids:', error);
    }

    try {
      const storedHiddenAccountRows = window.localStorage.getItem(HISTORY_HIDDEN_ACCOUNT_STORAGE_KEY);
      if (storedHiddenAccountRows) {
        const parsed = JSON.parse(storedHiddenAccountRows);
        if (Array.isArray(parsed)) {
          setHiddenAccountHistoryIds(parsed.filter((value) => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.warn('Unable to restore hidden account history rows:', error);
    }

    try {
      const storedHiddenProjectRows = window.localStorage.getItem(HISTORY_HIDDEN_PROJECT_STORAGE_KEY);
      if (storedHiddenProjectRows) {
        const parsed = JSON.parse(storedHiddenProjectRows);
        if (Array.isArray(parsed)) {
          setHiddenProjectHistoryIds(parsed.filter((value) => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.warn('Unable to restore hidden project history rows:', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(INBOX_READ_STORAGE_KEY, JSON.stringify(readInboxIds));
    } catch (error) {
      console.warn('Unable to persist inbox read state:', error);
    }
  }, [readInboxIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(INBOX_REPLY_STORAGE_KEY, JSON.stringify(inboxReplies));
    } catch (error) {
      console.warn('Unable to persist inbox replies:', error);
    }
  }, [inboxReplies]);

  useEffect(() => {
    try {
      window.localStorage.setItem(INBOX_ARCHIVED_STORAGE_KEY, JSON.stringify(archivedInboxIds));
    } catch (error) {
      console.warn('Unable to persist archived inbox ids:', error);
    }
  }, [archivedInboxIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(INBOX_DELETED_STORAGE_KEY, JSON.stringify(deletedInboxIds));
    } catch (error) {
      console.warn('Unable to persist deleted inbox ids:', error);
    }
  }, [deletedInboxIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HIRED_STATUS_OVERRIDE_STORAGE_KEY, JSON.stringify(hiredStatusOverrideIds));
    } catch (error) {
      console.warn('Unable to persist hired status overrides:', error);
    }
  }, [hiredStatusOverrideIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_HIDDEN_ACCOUNT_STORAGE_KEY, JSON.stringify(hiddenAccountHistoryIds));
    } catch (error) {
      console.warn('Unable to persist hidden account history rows:', error);
    }
  }, [hiddenAccountHistoryIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_HIDDEN_PROJECT_STORAGE_KEY, JSON.stringify(hiddenProjectHistoryIds));
    } catch (error) {
      console.warn('Unable to persist hidden project history rows:', error);
    }
  }, [hiddenProjectHistoryIds]);

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
      fetchContactMessages();
      recordCurrentLoginActivity();
      fetchDashboardLoginPresence();
    }
  }, [user, authLoading]);

  const asCleanText = (value: any) => (value || '').toString().trim();
  const withRequestTimeout = async <T,>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), ms)),
    ]);
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
    const rowId = asCleanText(row.id);

    setHistoryDeleteActionKey(`account:${row.id}`);
    setSettingsHistoryNotice('');

    try {
      if (!rowId) {
        setSettingsHistoryNotice('Unable to remove this row from the UI right now.');
        return;
      }

      setHiddenAccountHistoryIds((prev) => (prev.includes(rowId) ? prev : [...prev, rowId]));
      setAccountHistoryRows((prev) => prev.filter((item) => asCleanText(item.id) !== rowId));
      setSettingsHistoryNotice('History row removed from UI only. Database records were not deleted.');
    } catch (error) {
      console.error('Error removing account history entry from UI:', error);
      setSettingsHistoryNotice('Unable to remove this row from the UI right now.');
    } finally {
      setHistoryDeleteActionKey(null);
    }
  };

  const handleDeleteProjectHistoryEntry = async (row: ProjectHistoryItem) => {
    const rowId = asCleanText(row.id);

    setHistoryDeleteActionKey(`project:${row.id}`);
    setSettingsHistoryNotice('');

    try {
      if (!rowId) {
        setSettingsHistoryNotice('Unable to remove this row from the UI right now.');
        return;
      }

      setHiddenProjectHistoryIds((prev) => (prev.includes(rowId) ? prev : [...prev, rowId]));
      setProjectHistoryRows((prev) => prev.filter((item) => asCleanText(item.id) !== rowId));
      setSettingsHistoryNotice('History row removed from UI only. Database records were not deleted.');
    } catch (error) {
      console.error('Error removing project history entry from UI:', error);
      setSettingsHistoryNotice('Unable to remove this row from the UI right now.');
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
      title: 'Remove Account Row from UI',
      message:
        `Remove "${targetName}" from History view?\n\n` +
        `This only hides the row in this admin UI. Data in ${sourceLabel} and history logs will remain in the database.\n` +
        `Action type: ${actionLabel.toUpperCase()}.\n\n` +
        'You can restore it later by clearing local browser storage.',
    });
  };

  const openDeleteProjectHistoryModal = (row: ProjectHistoryItem) => {
    const projectTitle = asCleanText(row.project_name) || 'Untitled Project';
    const actionLabel = (row.action || 'record').toString().toLowerCase();

    setHistoryDeleteTarget({
      kind: 'project',
      row,
      title: 'Remove Project Row from UI',
      message:
        `Remove "${projectTitle}" from History view?\n\n` +
        'This only hides the row in this admin UI. Project and history records remain in the database.\n' +
        `Action type: ${actionLabel.toUpperCase()}.\n\n` +
        'You can restore it later by clearing local browser storage.',
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

  const toDateInputValue = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toTimeInputValue = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatInterviewSchedule = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatInterviewDateForEmail = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatInterviewTimeForEmail = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getHireChanceSummaryByScore = (score: number, maxScore: number) => {
    const safeMax = Math.max(1, maxScore);
    const percent = Math.max(0, Math.min(100, Math.round((score / safeMax) * 100)));
    if (percent >= 85) return 'Excellent score. The chance of being hired is very high.';
    if (percent >= 70) return 'Strong score. The chance of being hired is high.';
    if (percent >= 55) return 'Average score. There is still a moderate chance of being hired.';
    return 'Low score. The chance of being hired is currently low.';
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const getFileExtensionFromUrl = (url?: string | null) => {
    if (!url) return '';
    const cleanUrl = url.split('?')[0].split('#')[0];
    const lastSegment = cleanUrl.split('/').pop() || '';
    const extension = lastSegment.includes('.') ? lastSegment.split('.').pop() || '' : '';
    return extension.toLowerCase();
  };

  const getApplicantResumeDownloadName = (application: Partial<AdminApplicationItem> | null | undefined) => {
    const first = asCleanText(application?.first_name || '').toLowerCase() || 'applicant';
    const last = asCleanText(application?.last_name || '').toLowerCase() || 'resume';
    const extension = getFileExtensionFromUrl(application?.cv_url) || 'pdf';
    return `${first}-${last}-resume.${extension}`;
  };

  const includesAnyKeyword = (text: string, keywords: string[]) =>
    keywords.some((keyword) => text.includes(keyword));

  const extractLargestNumericMention = (text: string, regex: RegExp) => {
    let maxValue = 0;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(text)) !== null) {
      const parsed = Number(match[1]);
      if (!Number.isNaN(parsed)) {
        maxValue = Math.max(maxValue, parsed);
      }
    }
    return maxValue;
  };

  const getApplicantResumeSourceText = async (application: Partial<AdminApplicationItem>) => {
    const metadataText = [
      application?.first_name,
      application?.last_name,
      application?.email,
      application?.phone,
      application?.degree,
      application?.experience,
      application?.position,
      application?.project_applied,
      application?.portfolio_url,
      application?.cv_url,
    ]
      .map((value) => asCleanText(value))
      .filter(Boolean)
      .join('\n');

    const resumeUrl = asCleanText(application?.cv_url);
    if (!resumeUrl) return metadataText;

    try {
      const response = await fetch(resumeUrl);
      if (!response.ok) return metadataText;

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (
        contentType.includes('text') ||
        contentType.includes('json') ||
        contentType.includes('xml')
      ) {
        const responseText = await response.text();
        return `${metadataText}\n${responseText.slice(0, 250000)}`;
      }

      const extension = getFileExtensionFromUrl(resumeUrl);
      if (['pdf', 'txt', 'md', 'csv', 'doc', 'docx'].includes(extension)) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer).slice(0, 900000);
        const decoded = new TextDecoder('latin1').decode(bytes);
        const cleaned = decoded.replace(/[^\x20-\x7E\r\n\t]+/g, ' ');
        return `${metadataText}\n${cleaned}`;
      }
    } catch (error) {
      console.warn('Unable to read resume file for analysis:', error);
    }

    return metadataText;
  };

  const analyzeApplicantResumeByPoints = (
    sourceText: string,
    application: Partial<AdminApplicationItem>
  ): ResumeAnalysisResult => {
    const normalizedText = ` ${sourceText.toLowerCase()} `;
    const appliedRole = getApplicantPositionLabel(application).toLowerCase();

    const frontRoleTerms = ['front end', 'frontend', 'front-end', 'ui developer', 'react developer'];
    const backRoleTerms = ['back end', 'backend', 'back-end', 'api developer', 'server-side', 'server side'];
    const relatedRoleTerms = ['full stack', 'fullstack', 'web developer', 'software developer'];

    const hasFrontRole = includesAnyKeyword(normalizedText, frontRoleTerms);
    const hasBackRole = includesAnyKeyword(normalizedText, backRoleTerms);
    const hasRelatedRole = includesAnyKeyword(normalizedText, relatedRoleTerms);
    const isApplyingFront = includesAnyKeyword(appliedRole, ['front end', 'frontend', 'front-end', 'ui']);
    const isApplyingBack = includesAnyKeyword(appliedRole, ['back end', 'backend', 'back-end', 'api', 'server']);

    const sections: ResumeScoreSection[] = [];
    const pushSection = (key: string, label: string, points: number, max: number, notes: string[]) => {
      sections.push({
        key,
        label,
        points: Math.max(0, Math.min(max, points)),
        max,
        notes: notes.length ? notes : ['No matching signals found.'],
      });
    };

    let roleMatchA = 0;
    const roleMatchANotes: string[] = [];
    if (hasFrontRole) {
      roleMatchA += 30;
      roleMatchANotes.push('Front-End Developer detected (+30)');
    }
    if (hasBackRole) {
      roleMatchA += 30;
      roleMatchANotes.push('Back-End Developer detected (+30)');
    }
    pushSection('role_match_a', 'Role Match A', roleMatchA, 60, roleMatchANotes);

    const feSkillsA = [
      { label: 'HTML', points: 5, keywords: [' html ', 'html5'] },
      { label: 'CSS', points: 5, keywords: [' css ', 'css3'] },
      { label: 'JavaScript', points: 10, keywords: ['javascript', ' js ', 'typescript', 'ts '] },
      { label: 'React / Vue / Angular', points: 10, keywords: ['react', 'vue', 'angular'] },
      { label: 'Tailwind / Bootstrap', points: 5, keywords: ['tailwind', 'bootstrap'] },
      { label: 'Responsive Design', points: 5, keywords: ['responsive', 'media query'] },
    ];
    let fePointsA = 0;
    const feNotesA: string[] = [];
    feSkillsA.forEach((skill) => {
      if (includesAnyKeyword(normalizedText, skill.keywords)) {
        fePointsA += skill.points;
        feNotesA.push(`${skill.label} (+${skill.points})`);
      }
    });
    pushSection('frontend_a', 'Front-End Skills A', fePointsA, 30, feNotesA);

    const beSkillsA = [
      { label: 'Node.js / Express', points: 10, keywords: ['node.js', 'nodejs', 'express'] },
      { label: 'PHP / Laravel', points: 10, keywords: [' php ', 'laravel'] },
      { label: 'Python / Django / FastAPI', points: 10, keywords: [' python ', 'django', 'fastapi'] },
      { label: 'Database', points: 5, keywords: ['mysql', 'postgresql', 'firebase', 'database', 'supabase'] },
      { label: 'API Development', points: 5, keywords: [' api ', 'rest api', 'graphql'] },
    ];
    let bePointsA = 0;
    const beNotesA: string[] = [];
    beSkillsA.forEach((skill) => {
      if (includesAnyKeyword(normalizedText, skill.keywords)) {
        bePointsA += skill.points;
        beNotesA.push(`${skill.label} (+${skill.points})`);
      }
    });
    pushSection('backend_a', 'Back-End Skills A', bePointsA, 30, beNotesA);

    const projectCount = Math.max(
      extractLargestNumericMention(normalizedText, /(\d+)\s*\+?\s*(?:projects?|apps?|websites?)/gi),
      (() => {
        const mentions = (normalizedText.match(/\bproject(s)?\b/g) || []).length;
        if (mentions >= 5) return 5;
        if (mentions >= 3) return 3;
        if (mentions >= 1) return 1;
        return 0;
      })()
    );
    let projectsPointsA = 0;
    if (projectCount >= 5) projectsPointsA = 30;
    else if (projectCount >= 3) projectsPointsA = 20;
    else if (projectCount >= 1) projectsPointsA = 10;
    pushSection(
      'projects_a',
      'Project Experience A',
      projectsPointsA,
      30,
      projectCount > 0 ? [`Detected project count signal: ${projectCount}`] : []
    );

    const toolsA = [
      { label: 'Git / GitHub', points: 5, keywords: ['git', 'github'] },
      { label: 'REST API usage', points: 5, keywords: ['rest api', 'api integration', 'postman'] },
      { label: 'Deployment', points: 5, keywords: ['netlify', 'vercel', 'deployment', 'deployed'] },
      { label: 'Version control workflow', points: 5, keywords: ['version control', 'pull request', 'branch'] },
    ];
    let toolsPointsA = 0;
    const toolsNotesA: string[] = [];
    toolsA.forEach((tool) => {
      if (includesAnyKeyword(normalizedText, tool.keywords)) {
        toolsPointsA += tool.points;
        toolsNotesA.push(`${tool.label} (+${tool.points})`);
      }
    });
    pushSection('tools_a', 'Tools & Technologies A', toolsPointsA, 20, toolsNotesA);

    let educationPointsA = 0;
    const educationNotesA: string[] = [];
    if (includesAnyKeyword(normalizedText, ['information technology', 'computer science', 'bsit', 'bscs'])) {
      educationPointsA += 10;
      educationNotesA.push('IT / Computer Science course (+10)');
    }
    if (includesAnyKeyword(normalizedText, ['capstone', 'thesis'])) {
      educationPointsA += 10;
      educationNotesA.push('Relevant capstone / thesis (+10)');
    }
    pushSection('education_a', 'Education A', educationPointsA, 20, educationNotesA);

    let portfolioPointsA = 0;
    const portfolioNotesA: string[] = [];
    if (asCleanText(application.portfolio_url) || includesAnyKeyword(normalizedText, ['portfolio', 'http://', 'https://'])) {
      portfolioPointsA += 5;
      portfolioNotesA.push('Portfolio / website link (+5)');
    }
    const sectionHeadings = ['summary', 'experience', 'education', 'skills', 'projects', 'certification'];
    const detectedHeadings = sectionHeadings.filter((heading) =>
      normalizedText.includes(` ${heading} `)
    ).length;
    if (detectedHeadings >= 3) {
      portfolioPointsA += 5;
      portfolioNotesA.push('Clean and structured CV (+5)');
    }
    pushSection('portfolio_a', 'Portfolio & Quality A', portfolioPointsA, 10, portfolioNotesA);

    let roleMatchB = 0;
    const roleMatchBNotes: string[] = [];
    if (hasFrontRole && hasBackRole) {
      roleMatchB = 80;
      roleMatchBNotes.push('Both FE + BE detected (Fullstack strong match) (+80)');
    } else if (
      (isApplyingFront && hasFrontRole) ||
      (isApplyingBack && hasBackRole)
    ) {
      roleMatchB = 50;
      roleMatchBNotes.push('Exact role match (+50)');
    } else if (hasRelatedRole || includesAnyKeyword(normalizedText, ['web dev', 'web developer', 'fullstack'])) {
      roleMatchB = 30;
      roleMatchBNotes.push('Related role match (+30)');
    }
    pushSection('role_match_b', 'Role Match B', roleMatchB, 80, roleMatchBNotes);

    const technicalSkillsB = [
      { label: 'HTML', points: 5, keywords: [' html ', 'html5'] },
      { label: 'CSS', points: 5, keywords: [' css ', 'css3'] },
      { label: 'JavaScript', points: 10, keywords: ['javascript', ' js ', 'typescript', 'ts '] },
      { label: 'React / Vue / Angular', points: 15, keywords: ['react', 'vue', 'angular'] },
      { label: 'UI Framework', points: 5, keywords: ['tailwind', 'bootstrap', 'material ui', 'chakra'] },
      { label: 'Node / PHP / Python', points: 15, keywords: ['node.js', 'nodejs', ' php ', 'python', 'laravel', 'django', 'fastapi'] },
      { label: 'Database', points: 10, keywords: ['mysql', 'postgresql', 'firebase', 'supabase', 'database'] },
      { label: 'API Development', points: 10, keywords: [' api ', 'rest api', 'graphql'] },
    ];
    let technicalPointsB = 0;
    const technicalNotesB: string[] = [];
    technicalSkillsB.forEach((skill) => {
      if (includesAnyKeyword(normalizedText, skill.keywords)) {
        technicalPointsB += skill.points;
        technicalNotesB.push(`${skill.label} (+${skill.points})`);
      }
    });
    pushSection('technical_b', 'Technical Skills B', technicalPointsB, 60, technicalNotesB);

    const yearsExperience = extractLargestNumericMention(normalizedText, /(\d+)\s*\+?\s*(?:years?|yrs?)/gi);
    let experiencePointsB = 0;
    const experienceNotesB: string[] = [];
    if (yearsExperience >= 3) {
      experiencePointsB = 60;
      experienceNotesB.push('3+ years experience (+60)');
    } else if (yearsExperience >= 1) {
      experiencePointsB = 40;
      experienceNotesB.push('1-2 years experience (+40)');
    } else if (includesAnyKeyword(normalizedText, ['intern', 'internship', 'ojt'])) {
      experiencePointsB = 20;
      experienceNotesB.push('Internship detected (+20)');
    }
    pushSection('experience_b', 'Experience B', experiencePointsB, 60, experienceNotesB);

    let projectsPointsB = 0;
    const projectsNotesB: string[] = [];
    if (projectCount >= 5) {
      projectsPointsB = 40;
      projectsNotesB.push('5+ projects (+40)');
    } else if (projectCount >= 3) {
      projectsPointsB = 25;
      projectsNotesB.push('3-5 projects (+25)');
    } else if (projectCount >= 1) {
      projectsPointsB = 15;
      projectsNotesB.push('1-2 projects (+15)');
    }
    if (includesAnyKeyword(normalizedText, ['deployed', 'live demo', 'live project', 'netlify', 'vercel', 'production'])) {
      projectsPointsB += 10;
      projectsNotesB.push('Real-world / deployed projects bonus (+10)');
    }
    pushSection('projects_b', 'Projects B', projectsPointsB, 50, projectsNotesB);

    let toolsPointsB = 0;
    const toolsNotesB: string[] = [];
    if (includesAnyKeyword(normalizedText, ['git', 'github'])) {
      toolsPointsB += 5;
      toolsNotesB.push('Git / GitHub (+5)');
    }
    if (includesAnyKeyword(normalizedText, ['cicd', 'ci/cd', 'deployment', 'deployed', 'netlify', 'vercel'])) {
      toolsPointsB += 10;
      toolsNotesB.push('CI/CD / Deployment (+10)');
    }
    if (includesAnyKeyword(normalizedText, ['aws', 'firebase', 'supabase', 'gcp', 'azure', 'cloud'])) {
      toolsPointsB += 10;
      toolsNotesB.push('Cloud platform usage (+10)');
    }
    pushSection('tools_b', 'Tools & Stack B', toolsPointsB, 25, toolsNotesB);

    let educationPointsB = 0;
    const educationNotesB: string[] = [];
    if (includesAnyKeyword(normalizedText, ['information technology', 'computer science', 'bsit', 'bscs'])) {
      educationPointsB += 15;
      educationNotesB.push('IT / CS degree (+15)');
    }
    if (includesAnyKeyword(normalizedText, ['certification', 'certificate', 'udemy', 'coursera', 'aws certified'])) {
      educationPointsB += 5;
      educationNotesB.push('Relevant certifications (+5)');
    }
    pushSection('education_b', 'Education B', educationPointsB, 20, educationNotesB);

    let portfolioPointsB = 0;
    const portfolioNotesB: string[] = [];
    if (asCleanText(application.portfolio_url) || includesAnyKeyword(normalizedText, ['portfolio', 'live demo', 'github.io', 'http://', 'https://'])) {
      portfolioPointsB += 10;
      portfolioNotesB.push('Portfolio / live projects (+10)');
    }
    if (detectedHeadings >= 3) {
      portfolioPointsB += 5;
      portfolioNotesB.push('Clean CV + good structure (+5)');
    }
    pushSection('portfolio_b', 'Portfolio & Quality B', portfolioPointsB, 15, portfolioNotesB);

    let softSkillPoints = 0;
    const softSkillNotes: string[] = [];
    if (includesAnyKeyword(normalizedText, ['communication', 'collaboration', 'teamwork', 'stakeholder'])) {
      softSkillPoints += 5;
      softSkillNotes.push('Clear communication signal (+5)');
    }
    if (
      includesAnyKeyword(normalizedText, ['motivated', 'passionate', 'eager', 'objective', 'goal']) ||
      includesAnyKeyword(normalizedText, [appliedRole])
    ) {
      softSkillPoints += 5;
      softSkillNotes.push('Role alignment / motivation signal (+5)');
    }
    pushSection('soft_b', 'Soft Skills & Fit B', softSkillPoints, 10, softSkillNotes);

    const sectionWeights: Record<string, number> = {
      role_match_a: 10,
      frontend_a: 8,
      backend_a: 8,
      projects_a: 6,
      tools_a: 6,
      education_a: 4,
      portfolio_a: 3,
      role_match_b: 15,
      technical_b: 15,
      experience_b: 10,
      projects_b: 7,
      tools_b: 4,
      education_b: 2,
      portfolio_b: 1,
      soft_b: 1,
    };

    const weightedSections = sections.map((section) => {
      const weight = sectionWeights[section.key] ?? 0;
      const ratio = section.max > 0 ? section.points / section.max : 0;
      const weightedPoints = Math.max(0, Math.min(weight, Math.round(ratio * weight)));
      return {
        ...section,
        points: weightedPoints,
        max: weight,
      };
    });

    const totalPoints = weightedSections.reduce((total, section) => total + section.points, 0);

    return {
      totalPoints,
      maxPoints: 100,
      sections: weightedSections,
      analyzedAt: new Date().toISOString(),
    };
  };

  const extractDetectedResumeSkills = (sourceText: string) => {
    const normalizedText = ` ${sourceText.toLowerCase()} `;
    const skillCatalog: Array<{ label: string; keywords: string[] }> = [
      { label: 'HTML', keywords: [' html ', 'html5'] },
      { label: 'CSS', keywords: [' css ', 'css3'] },
      { label: 'JavaScript', keywords: ['javascript', ' js ', 'typescript', 'ts '] },
      { label: 'React', keywords: ['react'] },
      { label: 'Vue', keywords: ['vue'] },
      { label: 'Angular', keywords: ['angular'] },
      { label: 'Tailwind', keywords: ['tailwind'] },
      { label: 'Bootstrap', keywords: ['bootstrap'] },
      { label: 'Responsive Design', keywords: ['responsive', 'media query'] },
      { label: 'Node.js', keywords: ['node.js', 'nodejs'] },
      { label: 'Express', keywords: ['express'] },
      { label: 'PHP', keywords: [' php ', 'php '] },
      { label: 'Laravel', keywords: ['laravel'] },
      { label: 'Python', keywords: [' python ', 'python3'] },
      { label: 'Django', keywords: ['django'] },
      { label: 'FastAPI', keywords: ['fastapi'] },
      { label: 'MySQL', keywords: ['mysql'] },
      { label: 'PostgreSQL', keywords: ['postgresql'] },
      { label: 'Firebase', keywords: ['firebase'] },
      { label: 'Supabase', keywords: ['supabase'] },
      { label: 'REST API', keywords: ['rest api', 'api integration'] },
      { label: 'GraphQL', keywords: ['graphql'] },
      { label: 'Git', keywords: ['git'] },
      { label: 'GitHub', keywords: ['github'] },
      { label: 'Netlify', keywords: ['netlify'] },
      { label: 'Vercel', keywords: ['vercel'] },
      { label: 'AWS', keywords: ['aws'] },
    ];

    return skillCatalog
      .filter((skillItem) => includesAnyKeyword(normalizedText, skillItem.keywords))
      .map((skillItem) => skillItem.label);
  };

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

  const normalizeContactMessageRecord = (
    record: any,
    index = 0,
    sourceTable: ContactMessageItem['source_table'] = null
  ): ContactMessageItem => {
    const name = asCleanText(
      record?.name ||
      record?.full_name ||
      record?.fullName ||
      record?.sender_name ||
      record?.user_name
    );
    const fullName = asCleanText(record?.full_name || record?.fullName);
    const email = asCleanText(record?.email).toLowerCase();
    const message = asCleanText(record?.message || record?.content || record?.text);
    const createdAt = asCleanText(record?.created_at || record?.createdAt || record?.date_created);
    const rawId = asCleanText(record?.id);
    const fallbackId = `${createdAt || 'contact'}-${email || name || 'guest'}-${index}`;
    const id = rawId ? `${sourceTable || 'contact'}-${rawId}` : `${sourceTable || 'contact'}-${fallbackId}`;

    return {
      ...record,
      id,
      created_at: createdAt || null,
      name: name || null,
      full_name: fullName || null,
      email: email || null,
      message: message || null,
      source_table: sourceTable || null,
    };
  };

  const getInboxSenderName = (messageItem?: Partial<ContactMessageItem> | null) => {
    const directName = asCleanText(messageItem?.name || messageItem?.full_name);
    if (directName) return directName;
    return '';
  };

  const markInboxMessageAsRead = (messageId: string) => {
    if (!messageId) return;
    setReadInboxIds((previousIds) => (previousIds.includes(messageId) ? previousIds : [...previousIds, messageId]));
  };

  const clearInboxLongPressTimer = () => {
    if (inboxLongPressTimerRef.current) {
      window.clearTimeout(inboxLongPressTimerRef.current);
      inboxLongPressTimerRef.current = null;
    }
  };

  const clearInboxPreviewAutoCloseTimer = () => {
    if (inboxPreviewAutoCloseTimerRef.current) {
      window.clearTimeout(inboxPreviewAutoCloseTimerRef.current);
      inboxPreviewAutoCloseTimerRef.current = null;
    }
  };

  const handleInboxRowPointerDown = (messageId: string) => {
    clearInboxLongPressTimer();
    clearInboxPreviewAutoCloseTimer();
    suppressNextInboxClickRef.current = false;
    inboxLongPressTimerRef.current = window.setTimeout(() => {
      setPreviewInboxMessageId(messageId);
      suppressNextInboxClickRef.current = true;
      clearInboxPreviewAutoCloseTimer();
      inboxPreviewAutoCloseTimerRef.current = window.setTimeout(() => {
        setPreviewInboxMessageId('');
      }, 5000);
    }, 1000);
  };

  const handleInboxRowPointerEnd = () => {
    clearInboxLongPressTimer();
    clearInboxPreviewAutoCloseTimer();
    setPreviewInboxMessageId('');
  };

  const handleSelectInboxMessage = (messageId: string) => {
    setSelectedInboxMessageId(messageId);
    markInboxMessageAsRead(messageId);
    setPreviewInboxMessageId('');
    setInboxReplyNotice('');
  };

  const handleInboxRowClick = (messageId: string) => {
    if (suppressNextInboxClickRef.current) {
      suppressNextInboxClickRef.current = false;
      return;
    }
    setOpenInboxActionMenuId('');
    handleSelectInboxMessage(messageId);
  };

  const handleArchiveInboxMessage = (messageId: string) => {
    if (!messageId) return;
    setArchivedInboxIds((previousIds) => (previousIds.includes(messageId) ? previousIds : [...previousIds, messageId]));
    setOpenInboxActionMenuId('');
    if (selectedInboxMessageId === messageId) {
      setSelectedInboxMessageId('');
      setSelectedInboxReplyView(null);
      setIsInboxReplyComposerOpen(false);
    }
    if (previewInboxMessageId === messageId) {
      setPreviewInboxMessageId('');
    }
    setInboxNotice('Message archived.');
  };

  const handleRestoreInboxMessage = (messageId: string) => {
    if (!messageId) return;
    setArchivedInboxIds((previousIds) => previousIds.filter((itemId) => itemId !== messageId));
    setOpenInboxActionMenuId('');
    setInboxNotice('Message restored to Inbox.');
  };

  const openInboxDeleteModal = (messageId: string) => {
    if (!messageId) return;
    setOpenInboxActionMenuId('');
    setInboxDeleteTargetId(messageId);
  };

  const closeInboxDeleteModal = () => {
    setInboxDeleteTargetId('');
  };

  const handleConfirmInboxDelete = () => {
    if (!inboxDeleteTargetId) return;
    const targetId = inboxDeleteTargetId;

    setDeletedInboxIds((previousIds) => (previousIds.includes(targetId) ? previousIds : [...previousIds, targetId]));
    setReadInboxIds((previousIds) => previousIds.filter((itemId) => itemId !== targetId));
    setArchivedInboxIds((previousIds) => previousIds.filter((itemId) => itemId !== targetId));
    setContactMessages((previousMessages) => previousMessages.filter((messageItem) => messageItem.id !== targetId));
    setInboxReplies((previousReplies) => {
      if (!previousReplies[targetId]) return previousReplies;
      const nextReplies = { ...previousReplies };
      delete nextReplies[targetId];
      return nextReplies;
    });

    if (selectedInboxMessageId === targetId) {
      setSelectedInboxMessageId('');
      setSelectedInboxReplyView(null);
      setIsInboxReplyComposerOpen(false);
    }
    if (previewInboxMessageId === targetId) {
      setPreviewInboxMessageId('');
    }

    setInboxDeleteTargetId('');
    setOpenInboxActionMenuId('');
    setInboxNotice('Message deleted.');
  };

  const handleSendInboxReply = () => {
    if (!selectedInboxMessageId) {
      setInboxReplyNotice('Select a message first.');
      return;
    }

    const replyText = asCleanText(inboxReplyDraft);
    if (!replyText) {
      setInboxReplyNotice('Reply message cannot be empty.');
      return;
    }

    const senderName = asCleanText(
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Admin'
    );
    const senderEmail = asCleanText(user?.email || profile?.email).toLowerCase();
    const sentAt = new Date().toISOString();

    setInboxReplies((previousReplies) => ({
      ...previousReplies,
      [selectedInboxMessageId]: [
        ...(previousReplies[selectedInboxMessageId] || []),
        {
          id: `${selectedInboxMessageId}-${sentAt}-${Math.random().toString(36).slice(2, 8)}`,
          senderName: senderName || 'Admin',
          senderEmail: senderEmail || '',
          text: replyText,
          sentAt,
        },
      ],
    }));
    markInboxMessageAsRead(selectedInboxMessageId);
    setInboxReplyNotice('Reply saved in Inbox.');
    setInboxReplyDraft('');
    setIsInboxReplyComposerOpen(false);
  };

  const fetchContactMessages = async () => {
    setIsLoadingInbox(true);
    setInboxNotice('');
    setInboxSourceDebug([]);
    try {
      const tableResults = await Promise.all(
        [CONTACT_MESSAGE_TABLE].map(async (tableName) => {
          try {
            const primaryQuery = Promise.resolve(
              supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(2000)
            );
            const primary = await withRequestTimeout(
              primaryQuery,
              30000,
              `Inbox request timeout (${tableName})`
            );

            if (!primary.error) {
              return { tableName, data: primary.data || [], error: null as any };
            }

            const primaryMessage = `${primary.error?.message || ''}`.toLowerCase();
            if (primaryMessage.includes('timeout') || (primaryMessage.includes('created_at') && primaryMessage.includes('does not exist'))) {
              const retryQuery = Promise.resolve(
                supabase
                  .from(tableName)
                  .select('*')
                  .limit(2000)
              );
              const retry = await withRequestTimeout(
                retryQuery,
                15000,
                `Inbox retry timeout (${tableName})`
              );
              if (!retry.error) {
                return { tableName, data: retry.data || [], error: null as any };
              }
              return { tableName, data: [] as any[], error: retry.error };
            }

            return { tableName, data: [] as any[], error: primary.error };
          } catch (tableError: any) {
            return { tableName, data: [] as any[], error: tableError };
          }
        })
      );

      setInboxSourceDebug(
        tableResults.map((item) => ({
          table: item.tableName,
          rows: Array.isArray(item.data) ? item.data.length : 0,
          error: item.error
            ? asCleanText(item.error?.message || item.error?.details || item.error?.hint || String(item.error))
            : '',
        }))
      );

      const successfulTables = tableResults
        .filter((item) => !item.error)
        .map((item) => item.tableName);
      const latestError = tableResults.find((item) => item.error)?.error || null;

      if (!successfulTables.length) {
        throw latestError || new Error('Inbox source table is missing');
      }

      const mergedRows: ContactMessageItem[] = tableResults.flatMap((item) =>
        (item.data || []).map((record: any, index: number) =>
          normalizeContactMessageRecord(record, index, item.tableName)
        )
      );

      const normalizedMessages = mergedRows
        .map((row) => {
          const resolvedName = getInboxSenderName(row);
          return {
            ...row,
            name: resolvedName || null,
          };
        })
        .filter(
          (row: ContactMessageItem) =>
            Boolean(
              asCleanText(row.name || row.full_name) ||
              asCleanText(row.email) ||
              asCleanText(row.message)
            )
        )
        .sort((a, b) => {
          const first = new Date(a.created_at || '').getTime();
          const second = new Date(b.created_at || '').getTime();
          if (Number.isNaN(first) && Number.isNaN(second)) return 0;
          if (Number.isNaN(first)) return 1;
          if (Number.isNaN(second)) return -1;
          return second - first;
        });

      setContactMessages(normalizedMessages);
      setSelectedInboxMessageId((previousId) => {
        if (previousId && normalizedMessages.some((row) => row.id === previousId)) {
          return previousId;
        }
        return '';
      });
      setInboxNotice('');
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      setInboxNotice(
        errorMessage
          ? `Unable to load inbox messages right now. (${errorMessage})`
          : 'Unable to load inbox messages right now.'
      );
    } finally {
      setIsLoadingInbox(false);
    }
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

      setApplications(
        normalizedApplications.map((application) =>
          hiredStatusOverrideIds.includes(application.id) &&
          normalizeApplicationStatus(application.status) === 'accepted'
            ? { ...application, status: 'hired' }
            : application
        )
      );
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

  useEffect(() => {
    if (!selectedApplicant) {
      setApplicantInterviewDate('');
      setApplicantInterviewTime('');
      setIsApplicantInterviewSaved(false);
      setApplicantInterviewSavedAt(null);
      return;
    }

    setApplicantInterviewDate(toDateInputValue(selectedApplicant.interview_at));
    setApplicantInterviewTime(toTimeInputValue(selectedApplicant.interview_at));
    setIsApplicantInterviewSaved(Boolean(selectedApplicant.interview_at));
    setApplicantInterviewSavedAt(selectedApplicant.interview_at || null);
  }, [selectedApplicant?.id, selectedApplicant?.interview_at]);

  useEffect(() => {
    if (!selectedApplicant?.id) {
      setIsLoadingSelectedApplicantResumePoints(false);
      return;
    }

    const currentStatus = normalizeApplicationStatus(selectedApplicant.status);
    const shouldShowResumePoints = currentStatus === 'accepted' || currentStatus === 'hired';
    if (!shouldShowResumePoints) {
      setIsLoadingSelectedApplicantResumePoints(false);
      return;
    }

    if (typeof applicantResumePointsById[selectedApplicant.id] === 'number') {
      setIsLoadingSelectedApplicantResumePoints(false);
      return;
    }

    let isCancelled = false;
    const loadResumePoints = async () => {
      setIsLoadingSelectedApplicantResumePoints(true);
      try {
        const sourceText = await getApplicantResumeSourceText(selectedApplicant);
        const result = analyzeApplicantResumeByPoints(sourceText, selectedApplicant);
        if (isCancelled) return;
        setApplicantResumePointsById((prev) => ({
          ...prev,
          [selectedApplicant.id]: result.totalPoints,
        }));
      } catch (error) {
        console.error('Error loading selected applicant resume points:', error);
      } finally {
        if (!isCancelled) {
          setIsLoadingSelectedApplicantResumePoints(false);
        }
      }
    };

    loadResumePoints();

    return () => {
      isCancelled = true;
    };
  }, [selectedApplicant, applicantResumePointsById]);

  useEffect(() => {
    const visibleMessages = contactMessages.filter((messageItem) => !deletedInboxIds.includes(messageItem.id));
    if (!visibleMessages.length) {
      if (selectedInboxMessageId) {
        setSelectedInboxMessageId('');
      }
      if (previewInboxMessageId) {
        setPreviewInboxMessageId('');
      }
      return;
    }

    if (!visibleMessages.some((messageItem) => messageItem.id === selectedInboxMessageId)) {
      setSelectedInboxMessageId('');
    }

    if (previewInboxMessageId && !visibleMessages.some((messageItem) => messageItem.id === previewInboxMessageId)) {
      setPreviewInboxMessageId('');
    }
  }, [contactMessages, deletedInboxIds, selectedInboxMessageId, previewInboxMessageId]);

  useEffect(() => {
    if (!selectedInboxMessageId) {
      setInboxReplyDraft('');
      setInboxReplyNotice('');
      setIsInboxReplyComposerOpen(false);
      setSelectedInboxReplyView(null);
      return;
    }
    setInboxReplyDraft('');
    setInboxReplyNotice('');
  }, [selectedInboxMessageId]);

  useEffect(() => {
    if (!selectedProcessedApplicantId) return;
    if (applications.some((application) => application.id === selectedProcessedApplicantId)) return;
    setSelectedProcessedApplicantId('');
    setProcessedApplicantAiAnalysis(null);
    setProcessedApplicantAiNotice('');
  }, [selectedProcessedApplicantId, applications]);

  useEffect(() => {
    if (!hiredStatusOverrideIds.length) return;
    setApplications((previous) =>
      previous.map((application) =>
        hiredStatusOverrideIds.includes(application.id) &&
        normalizeApplicationStatus(application.status) === 'accepted'
          ? { ...application, status: 'hired' }
          : application
      )
    );
  }, [hiredStatusOverrideIds]);

  useEffect(() => {
    if (!isLoadingInbox) return;
    const timer = window.setTimeout(() => {
      setIsLoadingInbox(false);
      setInboxNotice((previous) =>
        previous || 'Inbox loading took too long. Please click refresh.'
      );
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [isLoadingInbox]);

  useEffect(() => {
    if (!previewInboxMessageId) return;

    const handleReleasePreview = () => {
      clearInboxLongPressTimer();
      setPreviewInboxMessageId('');
    };

    window.addEventListener('pointerup', handleReleasePreview);
    window.addEventListener('mouseup', handleReleasePreview);
    window.addEventListener('touchend', handleReleasePreview);
    window.addEventListener('blur', handleReleasePreview);

    return () => {
      window.removeEventListener('pointerup', handleReleasePreview);
      window.removeEventListener('mouseup', handleReleasePreview);
      window.removeEventListener('touchend', handleReleasePreview);
      window.removeEventListener('blur', handleReleasePreview);
    };
  }, [previewInboxMessageId]);

  useEffect(() => {
    if (!openInboxActionMenuId) return;

    const handleActionMenuEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenInboxActionMenuId('');
    };

    window.addEventListener('keydown', handleActionMenuEscape);
    return () => {
      window.removeEventListener('keydown', handleActionMenuEscape);
    };
  }, [openInboxActionMenuId]);

  useEffect(() => {
    if (!inboxDeleteTargetId) return;

    const handleDeleteModalEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setInboxDeleteTargetId('');
    };

    window.addEventListener('keydown', handleDeleteModalEscape);
    return () => {
      window.removeEventListener('keydown', handleDeleteModalEscape);
    };
  }, [inboxDeleteTargetId]);

  useEffect(() => {
    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (acceptApplicantConfirmTarget) {
        setAcceptApplicantConfirmTarget(null);
        return;
      }

      if (declineApplicantConfirmTarget) {
        setDeclineApplicantConfirmTarget(null);
        return;
      }

      if (hireApplicantConfirmTarget) {
        setHireApplicantConfirmTarget(null);
        return;
      }

      if (resumePreviewApplicant) {
        resumeAnalysisRequestRef.current += 1;
        setResumePreviewApplicant(null);
        setIsAnalyzingResume(false);
        setResumeAnalysisResult(null);
        setResumeAnalysisNotice('');
        return;
      }

      if (selectedApplicant) {
        setSelectedApplicant(null);
      }
    };

    window.addEventListener('keydown', handleEscapeClose);
    return () => {
      window.removeEventListener('keydown', handleEscapeClose);
    };
  }, [selectedApplicant, resumePreviewApplicant, acceptApplicantConfirmTarget, declineApplicantConfirmTarget, hireApplicantConfirmTarget]);

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

  const normalizeApplicationStatus = (status?: string): 'pending' | 'accepted' | 'declined' | 'hired' | 'archived' => {
    const normalized = (status || '').toString().trim().toLowerCase();
    if (
      normalized === 'accepted' ||
      normalized === 'declined' ||
      normalized === 'hired' ||
      normalized === 'archived' ||
      normalized === 'pending'
    ) {
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inbox_messages' },
        () => {
          fetchContactMessages();
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
    if (activeTab === 'Inbox') {
      fetchContactMessages();
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
    if (manageUsersCategoryFilter === 'all') {
      setExpandedManageFrames([]);
      return;
    }
    setExpandedManageFrames([manageUsersCategoryFilter]);
  }, [manageUsersCategoryFilter]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (manageUsersCategoryMenuRef.current && !manageUsersCategoryMenuRef.current.contains(event.target as Node)) {
        setIsManageUsersCategoryMenuOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (applicantActionMenuRef.current && !applicantActionMenuRef.current.contains(event.target as Node)) {
        setOpenApplicantActionMenuId(null);
      }
      if (pendingApplicantProjectMenuRef.current && !pendingApplicantProjectMenuRef.current.contains(event.target as Node)) {
        setIsPendingApplicantProjectMenuOpen(false);
      }
      if (processedApplicantStatusMenuRef.current && !processedApplicantStatusMenuRef.current.contains(event.target as Node)) {
        setIsProcessedApplicantStatusMenuOpen(false);
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

  const getConfiguredEmailJsKeys = () =>
    Array.from(
      new Set(
        [
          (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim(),
          (import.meta.env.VITE_EMAILJS_API_KEY as string | undefined)?.trim(),
          EMAILJS_PUBLIC_KEY_FALLBACK,
        ].filter((key): key is string => Boolean(key))
      )
    );

  const sendEmailJsTemplate = async (templateId: string, templateParams: Record<string, any>) => {
    const configuredKeys = getConfiguredEmailJsKeys();
    if (!configuredKeys.length) {
      throw new Error('Missing EmailJS public key');
    }

    const sanitizedTemplateParams = Object.fromEntries(
      Object.entries(templateParams)
        .filter(([key, value]) => EMAILJS_TEMPLATE_PARAM_KEY_REGEX.test(key) && value !== undefined && value !== null)
        .map(([key, value]) => [
          key,
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
            ? value
            : String(value),
        ])
    );

    const basePayload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: templateId,
      template_params: sanitizedTemplateParams,
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

      const normalizedParsedError = parsedError.toLowerCase();
      if (
        normalizedParsedError.includes('dynamic variables are corrupted') ||
        (normalizedParsedError.includes('template') && normalizedParsedError.includes('corrupted'))
      ) {
        throw new Error(
          'EmailJS template has invalid dynamic variables. Use only letters, numbers, or underscore (example: {{project_name}}), and remove variables with spaces like {{projects Name}}.'
        );
      }

      throw new Error(parsedError);
    };

    let lastError: unknown = null;
    for (const key of configuredKeys) {
      try {
        await sendRequest({
          ...basePayload,
          public_key: key,
        });
        return;
      } catch (publicKeyError) {
        lastError = publicKeyError;
      }

      try {
        await sendRequest({
          ...basePayload,
          user_id: key,
        });
        return;
      } catch (userIdError) {
        lastError = userIdError;
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : '';
    throw new Error(errorMessage || 'EmailJS failed');
  };

  const sendApplicationDecisionEmail = async (application: any, status: 'accepted' | 'declined') => {
    const applicantName = `${application?.first_name || ''} ${application?.last_name || ''}`.trim() || 'Applicant';
    const applicantEmail = (application?.email || '').toString().trim();
    if (!applicantEmail) {
      throw new Error('Applicant email is empty');
    }

    const titleValue =
      (application?.project_applied || application?.position || getApplicantPositionValue(application) || 'Lifewood Position')
        .toString()
        .trim() || 'Lifewood Position';
    const interviewDate = formatInterviewDateForEmail(application?.interview_at);
    const interviewTime = formatInterviewTimeForEmail(application?.interview_at);
    const interviewSchedule = formatInterviewSchedule(application?.interview_at);
    const isAccepted = status === 'accepted';
    const templateId = isAccepted ? EMAILJS_ACCEPT_TEMPLATE_ID : EMAILJS_DECLINE_TEMPLATE_ID;

    const baseTemplateParams = {
      name: applicantName,
      title: titleValue,
      position_applied: titleValue,
      Position_Applied: titleValue,
      projects_name: titleValue,
      projectsName: titleValue,
      project_name: titleValue,
      email: applicantEmail,
      to_name: applicantName,
      to_email: applicantEmail,
      user_email: applicantEmail,
      recipient: applicantEmail,
      reply_to: applicantEmail,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      project_applied: titleValue,
    };

    if (isAccepted) {
      await sendEmailJsTemplate(templateId, {
        ...baseTemplateParams,
        accepted: 'yes',
        rejected: '',
        accepted_flag: 'yes',
        rejected_flag: '',
        application_status: 'Accepted',
        decision_message: `Congratulations ${applicantName}, your application has been accepted.`,
        decision_date: new Date().toLocaleDateString(),
        interview_date: interviewDate || 'To be announced',
        interview_time: interviewTime || 'To be announced',
        Date: interviewDate || 'To be announced',
        Time: interviewTime || 'To be announced',
        interview_datetime: interviewSchedule || 'To be announced',
        interview_schedule: interviewSchedule || 'To be announced',
        schedule_date: interviewDate || 'To be announced',
        schedule_time: interviewTime || 'To be announced',
      });
      return;
    }

    await sendEmailJsTemplate(templateId, {
      ...baseTemplateParams,
      accepted: '',
      rejected: 'yes',
      accepted_flag: '',
      rejected_flag: 'yes',
      application_status: isAccepted ? 'Accepted' : 'Rejected',
      decision_message: isAccepted
        ? `Congratulations ${applicantName}, your application has been accepted.`
        : `Thank you ${applicantName} for applying. Your application was not selected this cycle.`,
      decision_date: new Date().toLocaleDateString(),
    });
  };

  const sendApplicationHiredEmail = async (application: any) => {
    const applicantName = `${application?.first_name || ''} ${application?.last_name || ''}`.trim() || 'Applicant';
    const applicantEmail = (application?.email || '').toString().trim();
    if (!applicantEmail) {
      throw new Error('Applicant email is empty');
    }

    const titleValue =
      (application?.project_applied || application?.position || getApplicantPositionValue(application) || 'Lifewood Position')
        .toString()
        .trim() || 'Lifewood Position';

    const safeName = escapeHtml(applicantName);
    const safeTitle = escapeHtml(titleValue);
    const emailHtml = `<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; color: #333;">
  
  <a href="https://lifewood-2026-jholmer.netlify.app/" target="_blank" style="text-decoration: none;">
    <img src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429" 
         alt="Lifewood Logo" 
         style="height: 40px; margin-bottom: 10px;" />
  </a>

  <p style="padding-top: 16px; border-top: 1px solid #eaeaea;">
    Dear ${safeName},
  </p>

  <p>
    We are pleased to inform you that you have successfully passed the interview for the position of "<strong>${safeTitle}</strong>" at Lifewood.  
    Your qualifications and experience align well with the requirements for the role, and we are excited to welcome you to the team.
  </p>

  <p>
    We are excited to inform you that you can start on Monday.  
    Should you have any questions or require additional information, do not hesitate to reach out.
  </p>

  <p>
    We look forward to working with you and achieving great things together.
  </p>

  <div style="margin: 24px 0;">
    <a href="https://lifewood-2026-jholmer.netlify.app/" target="_blank"
       style="background-color: #1f7a3a; color: #fff; padding: 12px 20px; 
              text-decoration: none; border-radius: 6px; font-weight: 600;">
      Visit Lifewood Website
    </a>
  </div>

  <p>
    Should you have any inquiries, please feel free to contact us. We are happy to assist you.
  </p>

  <p style="padding-top: 16px; border-top: 1px solid #eaeaea;">
    Best regards,<br/>
    The Lifewood Team
  </p>

  <p style="font-size: 13px; color: #666; margin-top: 20px;">
    Address: Ground Floor i2 Building, Jose Del Mar Street Cebu IT Park, Asia Town, Salinas Drive Apas Lahug, Cebu City, 6000
  </p>

</div>`;

    const hireTemplateId =
      (import.meta.env.VITE_EMAILJS_HIRE_TEMPLATE_ID as string | undefined)?.trim() || EMAILJS_ACCEPT_TEMPLATE_ID;

    await sendEmailJsTemplate(hireTemplateId, {
      name: applicantName,
      title: titleValue,
      to_name: applicantName,
      to_email: applicantEmail,
      email: applicantEmail,
      user_email: applicantEmail,
      recipient: applicantEmail,
      reply_to: applicantEmail,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      project_applied: titleValue,
      application_status: 'Hired',
      accepted: 'yes',
      accepted_flag: 'yes',
      rejected: '',
      rejected_flag: '',
      decision_date: new Date().toLocaleDateString(),
      decision_message: `Congratulations ${applicantName}, you are hired at Lifewood.`,
      message_html: emailHtml,
      html_content: emailHtml,
      email_body_html: emailHtml,
    });
  };

  const sendProjectDecisionEmail = async (
    submission: ProjectSubmissionItem,
    decision: 'accepted' | 'declined'
  ) => {
    const recipientEmail = (submission?.email || '').toString().trim();
    if (!recipientEmail) {
      throw new Error('Project submitter email is empty');
    }

    const recipientName = (submission?.full_name || '').toString().trim() || 'Applicant';
    const projectName = (submission?.project_name || '').toString().trim() || 'Submitted Project';
    const isAccepted = decision === 'accepted';
    const templateId = isAccepted ? EMAILJS_ACCEPT_TEMPLATE_ID : EMAILJS_DECLINE_TEMPLATE_ID;

    await sendEmailJsTemplate(templateId, {
      name: recipientName,
      title: projectName,
      accepted: isAccepted,
      rejected: !isAccepted,
      accepted_flag: isAccepted ? 'yes' : '',
      rejected_flag: !isAccepted ? 'yes' : '',
      projects_name: projectName,
      projectsName: projectName,
      project_name: projectName,
      email: recipientEmail,
      to_name: recipientName,
      to_email: recipientEmail,
      user_email: recipientEmail,
      recipient: recipientEmail,
      reply_to: recipientEmail,
      applicant_name: recipientName,
      applicant_email: recipientEmail,
      project_applied: projectName,
      application_status: isAccepted ? 'Accepted' : 'Rejected',
      decision_message: isAccepted
        ? `Congratulations ${recipientName}, your project submission was accepted.`
        : `Thank you ${recipientName} for your submission. It was not selected this cycle.`,
      decision_date: new Date().toLocaleDateString(),
    });
  };

  if (authLoading && !user) return null;

  if (!user) return null;

  const handleCloseResumePreviewModal = () => {
    resumeAnalysisRequestRef.current += 1;
    setResumePreviewApplicant(null);
    setIsAnalyzingResume(false);
    setResumeAnalysisResult(null);
    setResumeAnalysisNotice('');
  };

  const handleConfirmResumeAnalysis = () => {
    if (!resumePreviewApplicant || !resumeAnalysisResult) return;
    const applicantName = `${resumePreviewApplicant.first_name || ''} ${resumePreviewApplicant.last_name || ''}`
      .replace(/\s+/g, ' ')
      .trim() || 'Applicant';
    setApplicantResumePointsById((prev) => ({
      ...prev,
      [resumePreviewApplicant.id]: resumeAnalysisResult.totalPoints,
    }));
    setApplicantActionNotice(
      `Resume analysis confirmed for ${applicantName}: ${resumeAnalysisResult.totalPoints} points.`
    );
    handleCloseResumePreviewModal();
  };

  const handleOpenResumePreviewModal = async (application: AdminApplicationItem) => {
    if (!application?.cv_url) {
      setApplicantActionNotice('No resume file uploaded for this applicant.');
      return;
    }

    const requestId = resumeAnalysisRequestRef.current + 1;
    resumeAnalysisRequestRef.current = requestId;
    setResumePreviewApplicant(application);
    setResumeAnalysisResult(null);
    setResumeAnalysisNotice('');
    setIsAnalyzingResume(true);

    try {
      const sourceText = await getApplicantResumeSourceText(application);
      const result = analyzeApplicantResumeByPoints(sourceText, application);
      await new Promise((resolve) => window.setTimeout(resolve, 1400));

      if (resumeAnalysisRequestRef.current !== requestId) return;
      setResumeAnalysisResult(result);
      const currentStatus = normalizeApplicationStatus(application.status);
      const isProcessedView = currentStatus === 'accepted' || currentStatus === 'hired';
      if (isProcessedView) {
        setApplicantResumePointsById((prev) => ({
          ...prev,
          [application.id]: result.totalPoints,
        }));
        setResumeAnalysisNotice('');
      } else {
        setResumeAnalysisNotice('AI Analyze completed.');
      }
    } catch (error) {
      console.error('Error analyzing applicant resume:', error);
      if (resumeAnalysisRequestRef.current !== requestId) return;
      const errorMessage = error instanceof Error ? error.message : '';
      setResumeAnalysisNotice(
        errorMessage
          ? `AI Analyze failed. (${errorMessage})`
          : 'AI Analyze failed for this resume.'
      );
    } finally {
      if (resumeAnalysisRequestRef.current === requestId) {
        setIsAnalyzingResume(false);
      }
    }
  };

  const handleSaveApplicantInterviewSchedule = async () => {
    if (!selectedApplicant?.id) return;
    if (!applicantInterviewDate || !applicantInterviewTime) {
      setApplicantActionNotice('Please select both interview date and time.');
      return;
    }

    const localDateTime = new Date(`${applicantInterviewDate}T${applicantInterviewTime}:00`);
    if (Number.isNaN(localDateTime.getTime())) {
      setApplicantActionNotice('Interview schedule is invalid. Please try again.');
      return;
    }

    const interviewAtIso = localDateTime.toISOString();

    setIsSavingApplicantInterview(true);
    setApplicantActionNotice('');

    try {
      const { error } = await supabase
        .from('applications')
        .update({ interview_at: interviewAtIso })
        .eq('id', selectedApplicant.id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplicant.id ? { ...app, interview_at: interviewAtIso } : app
        )
      );
      setSelectedApplicant((prev) =>
        prev && prev.id === selectedApplicant.id
          ? { ...prev, interview_at: interviewAtIso }
          : prev
      );
      setIsApplicantInterviewSaved(true);
      setApplicantInterviewSavedAt(interviewAtIso);
      setApplicantActionNotice('');
      showApplicantSuccessPopup('Schedule Saved', formatInterviewSchedule(interviewAtIso));
    } catch (error) {
      console.error('Error saving interview schedule:', error);
      if (isMissingInterviewAtColumnError(error)) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplicant.id ? { ...app, interview_at: interviewAtIso } : app
          )
        );
        setSelectedApplicant((prev) =>
          prev && prev.id === selectedApplicant.id
            ? { ...prev, interview_at: interviewAtIso }
            : prev
        );
        setIsApplicantInterviewSaved(true);
        setApplicantInterviewSavedAt(interviewAtIso);
        setApplicantActionNotice('');
        showApplicantSuccessPopup('Schedule Saved', 'Saved for this session');
      } else {
        const errorMessage =
          error instanceof Error && error.message
            ? error.message.replace(/\s+/g, ' ').slice(0, 180)
            : '';
        setApplicantActionNotice(errorMessage ? `Unable to save interview schedule right now. (${errorMessage})` : 'Unable to save interview schedule right now.');
      }
    } finally {
      setIsSavingApplicantInterview(false);
    }
  };

  const handleUpdateApplicationStatus = async (application: any, status: 'accepted' | 'declined') => {
    if (!application?.id) return;

    if (status === 'accepted' && selectedApplicant?.id === application.id) {
      if (!isApplicantInterviewSaved || !selectedApplicant.interview_at) {
        setApplicantActionNotice('Please save the interview schedule first before accepting this application.');
        return;
      }
    }

    setIsUpdatingApplicantStatus(true);
    setApplicantActionNotice('');

    try {
      let nextInterviewAt: string | null = application?.interview_at || null;
      const canUseModalInterviewInput =
        status === 'accepted' &&
        selectedApplicant?.id === application.id &&
        applicantInterviewDate &&
        applicantInterviewTime;

      if (canUseModalInterviewInput) {
        const modalDateTime = new Date(`${applicantInterviewDate}T${applicantInterviewTime}:00`);
        if (!Number.isNaN(modalDateTime.getTime())) {
          nextInterviewAt = modalDateTime.toISOString();
        }
      }

      let interviewColumnMissing = false;

      if (status === 'accepted' && nextInterviewAt) {
        const { error: interviewStatusError } = await supabase
          .from('applications')
          .update({ status, interview_at: nextInterviewAt })
          .eq('id', application.id);

        if (interviewStatusError) {
          if (isMissingInterviewAtColumnError(interviewStatusError)) {
            interviewColumnMissing = true;
            const { error: statusOnlyError } = await supabase
              .from('applications')
              .update({ status })
              .eq('id', application.id);
            if (statusOnlyError) throw statusOnlyError;
          } else {
            throw interviewStatusError;
          }
        }
      } else {
        const { error: statusOnlyError } = await supabase
          .from('applications')
          .update({ status })
          .eq('id', application.id);
        if (statusOnlyError) throw statusOnlyError;
      }

      const updatedApplication = { ...application, status, interview_at: nextInterviewAt };
      setApplications((prev) => prev.map((app) => app.id === application.id ? { ...app, status, interview_at: nextInterviewAt } : app));

      try {
        await sendApplicationDecisionEmail(updatedApplication, status);
        const acceptedScheduleLabel = formatInterviewSchedule(nextInterviewAt);
        setApplicantActionNotice('');
        if (status === 'accepted') {
          showApplicantSuccessPopup('Application Accepted', acceptedScheduleLabel || 'Email sent to applicant');
        } else {
          showApplicantSuccessPopup('Application Declined', 'Email sent to applicant');
        }
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

  const handleRequestAcceptApplicant = (application: AdminApplicationItem) => {
    if (!application?.id) return;
    setAcceptApplicantConfirmTarget(application);
  };

  const handleConfirmAcceptApplicant = async () => {
    if (!acceptApplicantConfirmTarget?.id) return;
    const targetApplication = acceptApplicantConfirmTarget;
    setAcceptApplicantConfirmTarget(null);
    await handleUpdateApplicationStatus(targetApplication, 'accepted');
  };

  const handleRequestDeclineApplicant = (application: AdminApplicationItem) => {
    if (!application?.id) return;
    setDeclineApplicantConfirmTarget(application);
  };

  const handleConfirmDeclineApplicant = async () => {
    if (!declineApplicantConfirmTarget?.id) return;
    const targetApplication = declineApplicantConfirmTarget;
    setDeclineApplicantConfirmTarget(null);
    await handleUpdateApplicationStatus(targetApplication, 'declined');
  };

  const handleRequestHireApplicant = (application: AdminApplicationItem) => {
    if (!application?.id) return;
    setHireApplicantConfirmTarget(application);
  };

  const handleConfirmHireApplicant = async () => {
    if (!hireApplicantConfirmTarget?.id) return;
    const targetApplication = hireApplicantConfirmTarget;
    setHireApplicantConfirmTarget(null);
    await handleMarkApplicationAsHired(targetApplication);
  };

  const handleMarkApplicationAsHired = async (application: any) => {
    if (!application?.id) return;

    if (normalizeApplicationStatus(application.status) !== 'accepted') {
      setApplicantActionNotice('Only accepted applicants can be marked as hired.');
      return;
    }

    setApplicantRowActionId(application.id);
    setApplicantActionNotice('');

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'hired' })
        .eq('id', application.id);

      if (error) {
        if (isUnsupportedHiredStatusError(error)) {
          setHiredStatusOverrideIds((previous) =>
            previous.includes(application.id) ? previous : [...previous, application.id]
          );
          setApplications((prev) =>
            prev.map((app) => (app.id === application.id ? { ...app, status: 'hired' } : app))
          );
          setSelectedApplicant((prev) =>
            prev && prev.id === application.id ? { ...prev, status: 'hired' } : prev
          );
          setOpenApplicantActionMenuId(null);
          showApplicantSuccessPopup('Applicant Hired', `${application?.first_name || ''} ${application?.last_name || ''}`.trim() || 'Applicant');
          try {
            await sendApplicationHiredEmail({ ...application, status: 'hired' });
            setApplicantActionNotice('Applicant marked as hired. Hired email sent to applicant account.');
          } catch (emailError) {
            console.error('Hire email send error:', emailError);
            const errorMessage =
              emailError instanceof Error && emailError.message
                ? emailError.message.replace(/\s+/g, ' ').slice(0, 180)
                : 'Unknown EmailJS error';
            setApplicantActionNotice(`Applicant marked as hired, but hire email was not sent. (${errorMessage})`);
          }
          return;
        }
        throw error;
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === application.id ? { ...app, status: 'hired' } : app))
      );
      setSelectedApplicant((prev) =>
        prev && prev.id === application.id ? { ...prev, status: 'hired' } : prev
      );
      setOpenApplicantActionMenuId(null);
      showApplicantSuccessPopup('Applicant Hired', `${application?.first_name || ''} ${application?.last_name || ''}`.trim() || 'Applicant');
      try {
        await sendApplicationHiredEmail({ ...application, status: 'hired' });
        setApplicantActionNotice('Applicant marked as hired. Hired email sent to applicant account.');
      } catch (emailError) {
        console.error('Hire email send error:', emailError);
        const errorMessage =
          emailError instanceof Error && emailError.message
            ? emailError.message.replace(/\s+/g, ' ').slice(0, 180)
            : 'Unknown EmailJS error';
        setApplicantActionNotice(`Applicant marked as hired, but hire email was not sent. (${errorMessage})`);
      }
    } catch (error) {
      console.error('Error marking applicant as hired:', error);
      setApplicantActionNotice('Unable to mark applicant as hired right now.');
    } finally {
      setApplicantRowActionId(null);
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

  const handleAnalyzeProcessedApplicant = async (application: AdminApplicationItem) => {
    if (!application?.id) return;

    setSelectedProcessedApplicantId(application.id);
    setProcessedApplicantAiNotice('');

    const cachedResult = processedApplicantAiCache[application.id];
    if (cachedResult) {
      setProcessedApplicantAiAnalysis(cachedResult);
      return;
    }

    setIsLoadingProcessedApplicantAi(true);
    try {
      const sourceText = await getApplicantResumeSourceText(application);
      const analysis = analyzeApplicantResumeByPoints(sourceText, application);
      const skills = extractDetectedResumeSkills(sourceText);
      const applicantName =
        `${asCleanText(application.first_name)} ${asCleanText(application.last_name)}`.trim() || 'Applicant';

      const result: ProcessedApplicantAiAnalysis = {
        applicantId: application.id,
        applicantName,
        totalPoints: analysis.totalPoints,
        maxPoints: analysis.maxPoints,
        skills,
        sections: analysis.sections,
        analyzedAt: analysis.analyzedAt,
      };

      setProcessedApplicantAiCache((prev) => ({
        ...prev,
        [application.id]: result,
      }));
      setProcessedApplicantAiAnalysis(result);
      setApplicantResumePointsById((prev) => ({
        ...prev,
        [application.id]: analysis.totalPoints,
      }));
      if (!asCleanText(application.cv_url)) {
        setProcessedApplicantAiNotice('No CV file found. Showing AI analysis from submitted profile details.');
      }
    } catch (error) {
      console.error('Error running AI Lifewood analysis for processed applicant:', error);
      setProcessedApplicantAiAnalysis(null);
      setProcessedApplicantAiNotice('Unable to analyze this applicant right now.');
    } finally {
      setIsLoadingProcessedApplicantAi(false);
    }
  };

  const buildProcessedApplicantSummary = (
    analysis: ProcessedApplicantAiAnalysis,
    status: 'pending' | 'accepted' | 'declined' | 'hired' | 'archived' | null
  ) => {
    const applicantName = analysis.applicantName || 'This applicant';
    const topSkills = analysis.skills.slice(0, 3);
    const skillSummary = topSkills.length
      ? `key skills include ${topSkills.join(', ')}`
      : 'skill keywords are limited in the CV text';
    const sentenceOne = `${applicantName} scored ${analysis.totalPoints}/${analysis.maxPoints} in AI Lifewood Analysis, and ${skillSummary}.`;

    let sentenceTwo = `${applicantName} is currently under processed review.`;
    if (status === 'hired') {
      sentenceTwo = `${applicantName} is Hired.`;
    } else if (status === 'accepted') {
      sentenceTwo = `${applicantName} is Accepted and ready for hiring review.`;
    } else if (status === 'declined') {
      sentenceTwo = `${applicantName} is Declined based on the current evaluation.`;
    } else if (status === 'archived') {
      sentenceTwo = `${applicantName} is currently Archived.`;
    }

    return [sentenceOne, sentenceTwo];
  };

  const evaluationCandidates = getEvaluationCandidates();
  const selectedEvaluationUser =
    evaluationCandidates.find((candidate) => candidate.id === selectedEvaluationUserId) || null;
  const selectedEvaluationAnalytics = selectedEvaluationUser ? getEvaluationAnalytics(selectedEvaluationUser) : null;
  const visibleInboxMessages = contactMessages.filter((messageItem) => !deletedInboxIds.includes(messageItem.id));
  const filteredInboxMessages = visibleInboxMessages.filter((messageItem) => {
    const query = inboxSearchTerm.trim().toLowerCase();
    const isArchivedMessage = archivedInboxIds.includes(messageItem.id);
    const isReadMessage = readInboxIds.includes(messageItem.id);
    if (inboxReadFilter === 'archived') {
      if (!isArchivedMessage) return false;
    } else {
      if (isArchivedMessage) return false;
      if (inboxReadFilter === 'read' && !isReadMessage) return false;
      if (inboxReadFilter === 'unread' && isReadMessage) return false;
    }
    if (!query) return true;
    const name = getInboxSenderName(messageItem).toLowerCase();
    const firstName = name.split(/\s+/).filter(Boolean)[0] || '';
    return name.includes(query) || firstName.includes(query);
  });
  const inboxSearchableNames: string[] = [
    ...new Set<string>(
      visibleInboxMessages
        .map((messageItem) => asCleanText(getInboxSenderName(messageItem)))
        .filter((name) => Boolean(name))
    ),
  ].sort((firstName, secondName) => firstName.localeCompare(secondName));
  const inboxSearchQuery = inboxSearchTerm.trim();
  const inboxAutocompleteName = inboxSearchQuery
    ? inboxSearchableNames.find((name) => {
        const lowerName = name.toLowerCase();
        const lowerFirstName = (name.split(/\s+/).filter(Boolean)[0] || '').toLowerCase();
        const lowerQuery = inboxSearchQuery.toLowerCase();
        return (
          (lowerFirstName.startsWith(lowerQuery) || lowerName.startsWith(lowerQuery)) &&
          lowerName !== lowerQuery
        );
      }) || ''
    : '';
  const inboxAutocompleteSuffix =
    inboxAutocompleteName && inboxSearchQuery
      ? inboxAutocompleteName.slice(inboxSearchQuery.length)
      : '';
  const selectedInboxMessage =
    visibleInboxMessages.find((messageItem) => messageItem.id === selectedInboxMessageId) || null;
  const isSelectedInboxMessageRead = selectedInboxMessage ? readInboxIds.includes(selectedInboxMessage.id) : false;
  const selectedInboxMessageForDetails = isSelectedInboxMessageRead ? selectedInboxMessage : null;
  const selectedInboxReplies = selectedInboxMessageForDetails ? (inboxReplies[selectedInboxMessageForDetails.id] || []) : [];
  const previewInboxMessage =
    visibleInboxMessages.find((messageItem) => messageItem.id === previewInboxMessageId) || null;
  const openInboxActionMessage =
    visibleInboxMessages.find((messageItem) => messageItem.id === openInboxActionMenuId) || null;
  const isOpenInboxActionMessageArchived = openInboxActionMessage
    ? archivedInboxIds.includes(openInboxActionMessage.id)
    : false;
  const inboxDeleteTargetMessage =
    visibleInboxMessages.find((messageItem) => messageItem.id === inboxDeleteTargetId) || null;
  const currentAdminName = asCleanText(
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Admin'
  );
  const currentAdminEmail = asCleanText(user?.email || profile?.email).toLowerCase();
  const unreadInboxCount = visibleInboxMessages.reduce(
    (total, messageItem) =>
      archivedInboxIds.includes(messageItem.id) || readInboxIds.includes(messageItem.id) ? total : total + 1,
    0
  );
  const pendingApplications = applications.filter((app) => normalizeApplicationStatus(app.status) === 'pending');
  const filteredPendingApplications = pendingApplications.filter((app) => {
    const selectedProjectFilter = asCleanText(pendingApplicantProjectFilter).toLowerCase();
    const project = asCleanText(getApplicantPositionLabel(app)).toLowerCase();
    if (selectedProjectFilter && selectedProjectFilter !== 'all' && project !== selectedProjectFilter) {
      return false;
    }
    const query = pendingApplicantNameSearch.trim().toLowerCase();
    if (!query) return true;
    const fullName = `${asCleanText(app.first_name)} ${asCleanText(app.last_name)}`.trim().toLowerCase();
    const email = asCleanText(app.email).toLowerCase();
    return fullName.includes(query) || email.includes(query) || project.includes(query);
  });
  const declinedApplications = applications.filter((app) => normalizeApplicationStatus(app.status) === 'declined');
  const acceptedApplications = applications.filter((app) => normalizeApplicationStatus(app.status) === 'accepted');
  const hiredApplications = applications.filter((app) => normalizeApplicationStatus(app.status) === 'hired');
  const selectedApplicantStatus = selectedApplicant ? normalizeApplicationStatus(selectedApplicant.status) : 'pending';
  const isPendingApplicantModal = selectedApplicantStatus === 'pending';
  const applicantModalLabelClass = isPendingApplicantModal
    ? (darkMode
        ? "font-['Montserrat'] text-xs font-extrabold uppercase tracking-[0.18em] mb-1.5 text-emerald-300"
        : "font-['Montserrat'] text-xs font-extrabold uppercase tracking-[0.18em] mb-1.5 text-emerald-700")
    : (darkMode
        ? 'text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500'
        : 'text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400');
  const applicantModalValueClass = isPendingApplicantModal
    ? (darkMode
        ? "font-['Montserrat'] text-[15px] font-semibold text-slate-100"
        : "font-['Montserrat'] text-[15px] font-semibold text-gray-900")
    : 'text-[13px] font-medium';
  const applicantModalFieldCardClass = isPendingApplicantModal
    ? (darkMode
        ? 'rounded-2xl border border-emerald-500/30 bg-slate-900/65 px-4 py-3 shadow-[0_14px_26px_-22px_rgba(16,185,129,0.55),0_8px_14px_-10px_rgba(0,0,0,0.5)]'
        : 'rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_14px_26px_-22px_rgba(16,185,129,0.42),0_8px_14px_-10px_rgba(15,23,42,0.35)]')
    : (darkMode
        ? 'rounded-2xl border border-slate-700 bg-slate-900/55 px-4 py-3 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.65)]'
        : 'rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.25)]');
  const selectedApplicantResumePoints = selectedApplicant ? applicantResumePointsById[selectedApplicant.id] : undefined;
  const isSelectedApplicantProcessed = selectedApplicantStatus === 'accepted' || selectedApplicantStatus === 'hired';
  const acceptConfirmApplicantName = acceptApplicantConfirmTarget
    ? `${asCleanText(acceptApplicantConfirmTarget.first_name)} ${asCleanText(acceptApplicantConfirmTarget.last_name)}`.trim() || 'this applicant'
    : 'this applicant';
  const declineConfirmApplicantName = declineApplicantConfirmTarget
    ? `${asCleanText(declineApplicantConfirmTarget.first_name)} ${asCleanText(declineApplicantConfirmTarget.last_name)}`.trim() || 'this applicant'
    : 'this applicant';
  const hireConfirmApplicantName = hireApplicantConfirmTarget
    ? `${asCleanText(hireApplicantConfirmTarget.first_name)} ${asCleanText(hireApplicantConfirmTarget.last_name)}`.trim() || 'this applicant'
    : 'this applicant';
  const isResumePreviewProcessedApplicant = resumePreviewApplicant
    ? (() => {
        const previewStatus = normalizeApplicationStatus(resumePreviewApplicant.status);
        return previewStatus === 'accepted' || previewStatus === 'hired';
      })()
    : false;
  const reviewedApplications = applications.filter((app) => normalizeApplicationStatus(app.status) !== 'pending');
  const filteredProcessedApplicants = reviewedApplications
    .filter((app) => {
      const normalizedStatus = normalizeApplicationStatus(app.status);
      if (
        processedApplicantStatusFilter !== 'all' &&
        !(
          normalizedStatus === processedApplicantStatusFilter ||
          (processedApplicantStatusFilter === 'accepted' && normalizedStatus === 'hired')
        )
      ) {
        return false;
      }
      const query = processedApplicantNameSearch.trim().toLowerCase();
      if (!query) return true;
      const fullName = `${asCleanText(app.first_name)} ${asCleanText(app.last_name)}`.trim().toLowerCase();
      return fullName.includes(query);
    })
    .sort((a, b) => {
      const firstName = `${asCleanText(a.first_name)} ${asCleanText(a.last_name)}`.trim().toLowerCase();
      const secondName = `${asCleanText(b.first_name)} ${asCleanText(b.last_name)}`.trim().toLowerCase();
      return firstName.localeCompare(secondName);
    });
  const selectedProcessedApplicant =
    reviewedApplications.find((application) => application.id === selectedProcessedApplicantId) || null;
  const selectedProcessedApplicantStatus = selectedProcessedApplicant
    ? normalizeApplicationStatus(selectedProcessedApplicant.status)
    : null;
  const processedApplicantSummarySentences = processedApplicantAiAnalysis
    ? buildProcessedApplicantSummary(processedApplicantAiAnalysis, selectedProcessedApplicantStatus)
    : null;
  const processedApplicantStatusLabel =
    processedApplicantStatusFilter === 'accepted'
      ? 'Accepted'
      : processedApplicantStatusFilter === 'hired'
        ? 'Hired'
      : processedApplicantStatusFilter === 'declined'
        ? 'Decline'
        : 'All';
  const processedApplicantStatusOptions: Array<{ value: 'all' | 'accepted' | 'declined' | 'hired'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'hired', label: 'Hired' },
    { value: 'declined', label: 'Decline' },
  ];
  const pendingApplicantProjectFilterLabel =
    pendingApplicantProjectFilter === 'all' ? 'All Projects' : pendingApplicantProjectFilter;
  const pendingApplicantProjectOptions = [
    { value: 'all', label: 'All Projects' },
    ...APPLICANT_PROJECT_FILTER_OPTIONS.map((projectName) => ({
      value: projectName,
      label: projectName,
    })),
  ];
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
  const manageUsersCategoryOptions: Array<{ label: string; value: ManageUsersCategoryFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Intern', value: 'interns' },
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Employees', value: 'employees' },
    { label: 'Admins', value: 'admins' },
  ];
  const shouldShowManageFrame = (frame: ManageFrameKey) =>
    manageUsersCategoryFilter === 'all' || manageUsersCategoryFilter === frame;
  const manageUsersCountByCategory = {
    interns: filteredManageInternProfiles.length,
    pending: filteredManagePendingProfiles.length,
    employees: filteredManageEmployeeProfiles.length,
    admins: filteredManageAdminProfiles.length,
  };
  const settingsPanels: Array<{ key: SettingsView; label: string; helper: string }> = [
    { key: 'general', label: 'General', helper: 'Account and language' },
    { key: 'history', label: 'History', helper: 'Archived and deleted records' },
    { key: 'security', label: 'Security', helper: 'Login activity and MFA' },
  ];
  const accountHistoryTableRows = accountHistoryRows.filter((row) => {
    const action = (row.action || '').toString().toLowerCase();
    const rowId = asCleanText(row.id);
    if (!rowId) return false;
    return (action === 'archived' || action === 'deleted') && !hiddenAccountHistoryIds.includes(rowId);
  });
  const projectHistoryTableRows = projectHistoryRows.filter(
    (row) => {
      const action = (row.action || '').toString().toLowerCase();
      const rowId = asCleanText(row.id);
      if (!rowId) return false;
      return (action === 'declined' || action === 'deleted') && !hiddenProjectHistoryIds.includes(rowId);
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
      let emailNotice = '';
      try {
        await sendProjectDecisionEmail(
          { ...selectedProjectSubmission, status: decision, source_table: updatedTable },
          decision
        );
      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : '';
        emailNotice = errorMessage
          ? ` but decision email was not sent. (${errorMessage})`
          : ' but decision email was not sent.';
      }

      const decisionMessage =
        decision === 'accepted'
          ? 'Project submission accepted successfully.'
          : 'Project submission declined successfully.';
      const tableSuffix = updatedTable === 'project_submission' ? ' (legacy table)' : '';
      setProjectSubmissionNotice(`${decisionMessage}${tableSuffix}${emailNotice}`);
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
    { icon: '\u{1F4EC}', label: 'Inbox' },
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
    <div className={`relative min-h-screen flex font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-[#f5eedb] text-[#1a1a1a]'}`}>
      {!darkMode && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f5eedb] to-[#fffaf0]" />
          <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-white/45 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[#efe1c2] blur-3xl" />
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
        className={`${isSidebarCollapsed ? 'w-72 lg:w-24' : 'w-72 lg:w-64'} border-r flex flex-col p-6 pb-24 lg:pb-6 fixed h-[100dvh] z-20 transition-all duration-300 overflow-y-auto backdrop-blur-xl transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${darkMode ? 'bg-white/25 border-white/30 shadow-[0_0_30px_rgba(15,23,42,0.35)]' : 'bg-white/55 border-white/70 shadow-[0_0_30px_rgba(16,185,129,0.15)]'}`}
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
                    {!isSidebarCollapsed && item.label === 'Inbox' && unreadInboxCount > 0 ? (
                      <span className={`ml-auto min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        darkMode ? 'bg-emerald-500/25 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {unreadInboxCount}
                      </span>
                    ) : null}
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
        <div className={`pointer-events-none absolute inset-0 ${darkMode ? 'opacity-20' : 'opacity-30'}`}>
          <Aurora
            amplitude={0.9}
            blend={0.45}
            speed={0.8}
            colorStops={darkMode ? ['#1d4ed8', '#10b981', '#0f172a'] : ['#046241', '#f5eedb', '#7ccf9c']}
          />
        </div>
        {!darkMode && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-[#f5eedb]/35 to-[#f5eedb]/20" />}

        <div className="relative z-10">
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#046241]/10 text-[#046241]">
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
              <div className="inline-block bg-white rounded-2xl border border-black/5 px-5 py-3 shadow-sm">
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
              <div className="inline-block bg-white rounded-2xl border border-black/5 px-5 py-3 shadow-sm">
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
              <div className="inline-block bg-white rounded-2xl border border-black/5 px-5 py-3 shadow-sm">
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
            {applicantActionNotice &&
            (applicantActionNotice.toLowerCase().includes('unable') ||
              applicantActionNotice.toLowerCase().includes('not sent') ||
              applicantActionNotice.toLowerCase().includes('please') ||
              applicantActionNotice.toLowerCase().includes('invalid') ||
              applicantActionNotice.toLowerCase().includes('missing')) ? (
              <p className={`text-xs font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                {applicantActionNotice}
              </p>
            ) : null}

            <AnimatePresence>
              {applicantSuccessPopup && (
                <motion.div
                  initial={{ opacity: 0, y: -14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`fixed right-5 top-24 z-[90] w-[290px] rounded-2xl border p-4 shadow-2xl ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src="https://img.icons8.com/color/96/ok--v1.png"
                      alt="Success"
                      className="w-10 h-10 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {applicantSuccessPopup.title}
                      </p>
                      {applicantSuccessPopup.subtitle ? (
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {applicantSuccessPopup.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`group relative overflow-hidden rounded-[32px] p-8 border transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] shadow-[0_10px_22px_-18px_rgba(16,185,129,0.45)] ${darkMode ? 'bg-slate-800/75 border-slate-700 hover:border-orange-500/40' : 'bg-white/75 border-emerald-200/70 hover:border-orange-500/25'}`}>
                <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-70" />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-orange-500/10 text-orange-300' : 'bg-orange-50 text-orange-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v6"/><path d="M14 2v6"/><path d="M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M9 16h6"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-orange-300 bg-orange-500/20' : 'text-orange-600 bg-orange-50'}`}>Awaiting</span>
                </div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Pending Applicants</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{pendingApplications.length}</h3>
              </div>

              <div className={`group relative overflow-hidden rounded-[32px] p-8 border transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] shadow-[0_10px_22px_-18px_rgba(16,185,129,0.45)] ${darkMode ? 'bg-slate-800/75 border-slate-700 hover:border-red-500/40' : 'bg-white/75 border-emerald-200/70 hover:border-red-500/25'}`}>
                <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-70" />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-red-300 bg-red-500/20' : 'text-red-600 bg-red-50'}`}>Decline</span>
                </div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Decline Applicants</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{declinedApplications.length}</h3>
              </div>

              <div className={`group relative overflow-hidden rounded-[32px] p-8 border transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] shadow-[0_10px_22px_-18px_rgba(16,185,129,0.45)] ${darkMode ? 'bg-slate-800/75 border-slate-700 hover:border-emerald-500/40' : 'bg-white/75 border-emerald-200/70 hover:border-emerald-500/30'}`}>
                <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-70" />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-emerald-300 bg-emerald-500/20' : 'text-emerald-600 bg-emerald-50'}`}>Accepted</span>
                </div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Accepted Applicants</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{acceptedApplications.length}</h3>
              </div>

              <div className={`group relative overflow-hidden rounded-[32px] p-8 border transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] shadow-[0_10px_22px_-18px_rgba(16,185,129,0.45)] ${darkMode ? 'bg-slate-800/75 border-slate-700 hover:border-sky-500/40' : 'bg-white/75 border-emerald-200/70 hover:border-sky-500/25'}`}>
                <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-70" />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M8 16V8"/><path d="M12 16V4"/><path d="M16 16v-6"/></svg>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${darkMode ? 'text-sky-300 bg-sky-500/20' : 'text-sky-600 bg-sky-50'}`}>Hired</span>
                </div>
                <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Hired Applicants</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-emerald-900'}`}>{hiredApplications.length}</h3>
              </div>
            </div>

            <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                  <div>
                    <h3 className={`text-3xl font-extrabold leading-tight ${darkMode ? 'text-slate-100' : 'text-[#123f2f]'}`}>New Applicants</h3>
                    <p className={`text-sm font-semibold mt-4 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Pending Applicants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:ml-auto">
                  <div className="relative shrink-0" ref={pendingApplicantProjectMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsPendingApplicantProjectMenuOpen((previous) => !previous)}
                      className={`relative h-10 w-auto whitespace-nowrap rounded-xl border-2 px-3 pr-8 text-xs font-extrabold inline-flex items-center justify-center text-center focus:outline-none shadow-[0_5px_0_rgba(6,58,40,0.18),0_11px_18px_-12px_rgba(2,54,35,0.8)] transition-all active:translate-y-[1px] active:shadow-[0_3px_0_rgba(6,58,40,0.2),0_7px_14px_-12px_rgba(2,54,35,0.7)] ${
                        darkMode
                          ? 'bg-slate-900 border-emerald-500/60 text-emerald-300'
                          : 'bg-white border-emerald-400 text-emerald-800'
                      }`}
                      title="Filter pending applicants by project applied"
                    >
                      <span>{pendingApplicantProjectFilterLabel}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`shrink-0 transition-transform ${isPendingApplicantProjectMenuOpen ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </button>
                    <AnimatePresence>
                      {isPendingApplicantProjectMenuOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className={`absolute top-[calc(100%+6px)] left-0 z-30 min-w-full w-max max-h-[260px] overflow-y-auto rounded-xl border shadow-lg ${
                            darkMode ? 'bg-slate-900 border-emerald-500/30' : 'bg-white border-gray-200'
                          }`}
                        >
                          {pendingApplicantProjectOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setPendingApplicantProjectFilter(option.value);
                                setIsPendingApplicantProjectMenuOpen(false);
                              }}
                              className={`block w-full whitespace-nowrap text-center px-3 py-2 text-xs font-bold transition-colors ${
                                pendingApplicantProjectFilter === option.value
                                  ? darkMode
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-emerald-50 text-emerald-700'
                                  : darkMode
                                    ? 'text-emerald-300 hover:bg-slate-800'
                                    : 'text-emerald-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <div className={`group flex items-center h-10 rounded-xl border overflow-hidden transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    <motion.div
                      className={`w-10 h-10 inline-flex items-center justify-center ${darkMode ? 'text-slate-300' : 'text-gray-500'}`}
                      title="Search pending applicants"
                      whileHover={{ y: [0, -2.5, 0], rotate: [0, 5, -4, 0] }}
                      transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.3-4.3"/>
                      </svg>
                    </motion.div>
                    <input
                      type="text"
                      value={pendingApplicantNameSearch}
                      onChange={(e) => setPendingApplicantNameSearch(e.target.value)}
                      placeholder="Search name..."
                      className={`w-0 px-0 opacity-0 group-hover:w-44 group-hover:px-3 group-hover:opacity-100 focus:w-44 focus:px-3 focus:opacity-100 transition-all duration-200 text-sm h-10 border-0 focus:outline-none ${
                        darkMode ? 'bg-slate-900 text-slate-100 placeholder:text-slate-500' : 'bg-white text-gray-900 placeholder:text-gray-400'
                      }`}
                    />
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                    {filteredPendingApplications.length} pending
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Phone</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Project Applied For</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Date</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingApplications.map((app) => (
                      <tr key={app.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb]`}>
                        <td className={`py-4 text-center font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className={`py-4 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.phone || 'N/A'}</td>
                        <td className={`py-4 text-center text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-[#046241]'}`}>{getApplicantPositionLabel(app)}</td>
                        <td className={`py-4 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="py-4 text-center">
                          <motion.button
                            onClick={() => setSelectedApplicant(app)}
                            title="Review application and choose Accept or Decline"
                            whileTap={{ scale: 0.92 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="inline-flex text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#f59e0b]/40 bg-white text-[#d97706] shadow-[0_4px_0_#fde7c2,0_10px_16px_-12px_rgba(180,83,9,0.45)] transition-all hover:bg-[#f59e0b] hover:text-white hover:shadow-[0_4px_0_#d97706,0_10px_16px_-12px_rgba(180,83,9,0.75)] active:translate-y-[1px] active:shadow-[0_2px_0_#d97706,0_8px_14px_-12px_rgba(180,83,9,0.7)] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b]/40 focus-visible:ring-offset-0"
                          >
                            Pending
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                    {filteredPendingApplications.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`py-12 text-center italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No pending applications</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`rounded-[40px] p-8 shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Processed Applicants</h3>
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                  <div className="relative shrink-0" ref={processedApplicantStatusMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsProcessedApplicantStatusMenuOpen((prev) => !prev)}
                      className={`relative h-10 w-auto whitespace-nowrap rounded-xl border-2 px-3 pr-8 text-xs font-extrabold uppercase tracking-widest inline-flex items-center justify-center text-center focus:outline-none shadow-[0_5px_0_rgba(6,58,40,0.18),0_11px_18px_-12px_rgba(2,54,35,0.8)] transition-all active:translate-y-[1px] active:shadow-[0_3px_0_rgba(6,58,40,0.2),0_7px_14px_-12px_rgba(2,54,35,0.7)] ${
                        darkMode
                          ? 'bg-slate-900 border-emerald-500/60 text-emerald-300'
                          : 'bg-white border-emerald-400 text-emerald-800'
                      }`}
                      title="Filter processed applicants by status"
                    >
                      <span>{processedApplicantStatusLabel}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`shrink-0 transition-transform ${isProcessedApplicantStatusMenuOpen ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </button>
                    <AnimatePresence>
                      {isProcessedApplicantStatusMenuOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className={`absolute top-[calc(100%+6px)] left-0 z-30 w-max rounded-xl border overflow-hidden shadow-lg ${
                            darkMode ? 'bg-slate-900 border-emerald-500/30' : 'bg-white border-gray-200'
                          }`}
                        >
                          {processedApplicantStatusOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setProcessedApplicantStatusFilter(option.value);
                                setIsProcessedApplicantStatusMenuOpen(false);
                              }}
                              className={`block w-full whitespace-nowrap text-center px-3 py-2 text-xs font-extrabold uppercase tracking-widest transition-colors ${
                                processedApplicantStatusFilter === option.value
                                  ? darkMode
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-emerald-50 text-emerald-700'
                                  : darkMode
                                    ? 'text-emerald-300 hover:bg-slate-800'
                                    : 'text-emerald-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <div className={`group flex items-center h-10 rounded-xl border overflow-hidden transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-10 h-10 inline-flex items-center justify-center ${darkMode ? 'text-slate-300' : 'text-gray-500'}`} title="Search by name">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.3-4.3"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={processedApplicantNameSearch}
                      onChange={(e) => setProcessedApplicantNameSearch(e.target.value)}
                      placeholder="Search name..."
                      className={`w-0 px-0 opacity-0 group-hover:w-44 group-hover:px-3 group-hover:opacity-100 focus:w-44 focus:px-3 focus:opacity-100 transition-all duration-200 text-sm h-10 border-0 focus:outline-none ${
                        darkMode ? 'bg-slate-900 text-slate-100 placeholder:text-slate-500' : 'bg-white text-gray-900 placeholder:text-gray-400'
                      }`}
                    />
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {filteredProcessedApplicants.length} records
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-black/5'}`}>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Name</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Email</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Project Applied For</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Date</th>
                      <th className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status</th>
                      <th className={`py-4 text-center w-[120px] text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Action</th>
                      <th className="py-4 text-center w-[70px]">
                        <span className="sr-only">More actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProcessedApplicants.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => handleAnalyzeProcessedApplicant(app)}
                        className={`border-b transition-colors cursor-pointer ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-[#f5eedb] ${
                          selectedProcessedApplicantId === app.id ? (darkMode ? '[&>td]:bg-emerald-500/10' : '[&>td]:bg-emerald-50/80') : ''
                        }`}
                      >
                        <td className={`py-4 text-center font-medium ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{app.first_name} {app.last_name}</td>
                        <td className={`py-4 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{app.email}</td>
                        <td className={`py-4 text-center text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-[#046241]'}`}>{getApplicantPositionLabel(app)}</td>
                        <td className={`py-4 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(app.updated_at || app.created_at).toLocaleDateString()}</td>
                        <td className="py-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {(() => {
                              const currentStatus = normalizeApplicationStatus(app.status);
                              const isAcceptedStatus = currentStatus === 'accepted';
                              const isHiredStatus = currentStatus === 'hired';

                              return (
                                <span
                                  className={`inline-flex min-w-[78px] justify-center text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-none ${
                                    isHiredStatus
                                      ? darkMode
                                        ? 'bg-blue-500/20 text-blue-200'
                                        : 'bg-blue-100 text-blue-700'
                                      : isAcceptedStatus
                                        ? darkMode
                                          ? 'bg-emerald-500/15 text-emerald-300'
                                          : 'bg-emerald-50 text-emerald-700'
                                        : darkMode
                                          ? 'bg-orange-500/20 text-orange-300'
                                          : 'bg-orange-50 text-orange-600'
                                  }`}
                                >
                                  {isHiredStatus ? 'Hired' : isAcceptedStatus ? 'Accepted' : 'Decline'}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="mx-auto inline-flex h-[32px] w-[74px] items-center justify-center whitespace-nowrap">
                            {(normalizeApplicationStatus(app.status) === 'accepted' || normalizeApplicationStatus(app.status) === 'hired') ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedApplicant(app);
                                }}
                                className="inline-flex text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#046241]/40 bg-white text-[#046241] shadow-[0_4px_0_#cde7dc,0_10px_16px_-12px_rgba(2,54,35,0.9)] transition-all hover:bg-[#046241] hover:text-white hover:shadow-[0_4px_0_#034731,0_10px_16px_-12px_rgba(2,54,35,0.95)] active:translate-y-[1px] active:shadow-[0_2px_0_#034731,0_8px_14px_-12px_rgba(2,54,35,0.85)]"
                                title="View accepted applicant schedule and resume points"
                              >
                                View
                              </button>
                            ) : (
                              <span className="inline-flex h-full w-full" aria-hidden="true" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="relative inline-flex items-center justify-center" ref={openApplicantActionMenuId === app.id ? applicantActionMenuRef : null}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenApplicantActionMenuId((prev) => (prev === app.id ? null : app.id));
                              }}
                              disabled={applicantRowActionId === app.id}
                              title="More actions"
                              className={`w-7 h-7 shrink-0 rounded-full border inline-flex items-center justify-center transition-colors disabled:opacity-50 ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="1"/>
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="12" cy="16" r="1"/>
                              </svg>
                            </button>
                            {openApplicantActionMenuId === app.id && (
                              <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 w-32 rounded-xl border shadow-xl z-20 p-1 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleArchiveApplication(app);
                                  }}
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
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteApplication(app);
                                  }}
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
                    {filteredProcessedApplicants.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`py-12 text-center italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No processed applications yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={`mt-6 rounded-[28px] border p-5 ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h4 className={`text-lg font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>AI Lifewood Analysis</h4>
                  </div>
                  {selectedProcessedApplicant ? (
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                      {`${selectedProcessedApplicant.first_name || ''} ${selectedProcessedApplicant.last_name || ''}`.replace(/\s+/g, ' ').trim() || 'Selected applicant'}
                    </span>
                  ) : null}
                </div>

                <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <div className="mb-3">
                    <img
                      src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429"
                      alt="Lifewood"
                      className="h-4 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {isLoadingProcessedApplicantAi ? (
                    <div className="py-6 flex items-center gap-3">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      <p className={`text-sm font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Analyzing CV with AI Lifewood...</p>
                    </div>
                  ) : processedApplicantAiAnalysis && processedApplicantSummarySentences ? (
                    <>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                        {processedApplicantSummarySentences[0]}
                      </p>
                      <p className={`text-sm leading-relaxed mt-2 font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {processedApplicantSummarySentences[1]}
                      </p>
                    </>
                  ) : (
                    <p className={`py-6 text-sm italic ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      AI summary will appear here.
                    </p>
                  )}
                </div>

                {processedApplicantAiNotice ? (
                  <p className={`mt-3 text-xs font-semibold ${processedApplicantAiNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                    {processedApplicantAiNotice}
                  </p>
                ) : null}
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
                    initial={{ opacity: 0, scale: 0.98, y: 120 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 120 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 24, mass: 0.9 }}
                    className={`relative w-full max-w-3xl rounded-[34px] p-8 shadow-xl max-h-[90vh] overflow-y-auto ${
                      isPendingApplicantModal
                        ? (darkMode
                            ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-emerald-500/40 text-slate-100 shadow-[0_28px_52px_-30px_rgba(16,185,129,0.55),0_14px_28px_-20px_rgba(15,23,42,0.82)]'
                            : 'bg-white border border-emerald-200 text-gray-900 shadow-[0_28px_52px_-30px_rgba(16,185,129,0.45),0_14px_28px_-20px_rgba(15,23,42,0.45)]')
                        : (darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-900')
                    }`}
                  >
                    {isPendingApplicantModal ? (
                      <div className={`mb-7 rounded-[24px] border px-6 py-5 ${
                        darkMode
                          ? 'bg-gradient-to-br from-emerald-500/15 via-slate-900/80 to-emerald-900/15 border-emerald-400/35 shadow-[0_14px_26px_-20px_rgba(16,185,129,0.6)]'
                          : 'bg-gradient-to-br from-white to-emerald-50 border-emerald-300 shadow-[0_12px_22px_-18px_rgba(16,185,129,0.55)]'
                      }`}>
                        <h4 className={`font-['Montserrat'] text-[26px] leading-tight font-extrabold ${
                          darkMode ? 'text-emerald-300' : 'text-emerald-800'
                        }`}>
                          Pending Applicant Review
                        </h4>
                        <p className={`font-['Montserrat'] mt-2 text-[14px] font-semibold ${
                          darkMode ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                          Review applicant details, set interview schedule, and finalize your approval decision.
                        </p>
                      </div>
                    ) : null}

                    <button
                      onClick={() => setSelectedApplicant(null)}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
                      title="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>

                    <div className="mb-8 pr-10">
                      <div>
                        <h3 className={`${isPendingApplicantModal ? "font-['Montserrat'] text-[28px] font-extrabold mb-1" : 'text-xl font-bold mb-1'}`}>
                          {selectedApplicant.first_name} {selectedApplicant.last_name}
                        </h3>
                        <p className={`${isPendingApplicantModal ? "font-['Montserrat'] text-[15px] font-bold" : 'text-xs font-medium'} ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {getApplicantPositionLabel(selectedApplicant)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-7 mb-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className={applicantModalFieldCardClass}>
                          <p className={applicantModalLabelClass}>Email</p>
                          <p className={applicantModalValueClass}>{selectedApplicant.email || 'N/A'}</p>
                        </div>
                        <div className={applicantModalFieldCardClass}>
                          <p className={applicantModalLabelClass}>Phone</p>
                          <p className={applicantModalValueClass}>{selectedApplicant.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className={applicantModalFieldCardClass}>
                          <p className={applicantModalLabelClass}>Project Applied For</p>
                          <p className={applicantModalValueClass}>{getApplicantPositionLabel(selectedApplicant)}</p>
                        </div>
                        <div className={applicantModalFieldCardClass}>
                          <p className={applicantModalLabelClass}>Age</p>
                          <p className={applicantModalValueClass}>{selectedApplicant.age ?? 'N/A'}</p>
                        </div>
                        <div className={applicantModalFieldCardClass}>
                          <p className={applicantModalLabelClass}>Degree / Field</p>
                          <p className={applicantModalValueClass}>{selectedApplicant.degree || 'N/A'}</p>
                        </div>
                        <div className={applicantModalFieldCardClass}>
                          <p className={applicantModalLabelClass}>Submitted</p>
                          <p className={applicantModalValueClass}>
                            {selectedApplicant.created_at ? new Date(selectedApplicant.created_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className={applicantModalFieldCardClass}>
                        <p className={applicantModalLabelClass}>Relevant Experience</p>
                        <p className={`${isPendingApplicantModal ? "font-['Montserrat'] text-[16px] font-medium leading-relaxed" : 'text-sm leading-relaxed'} ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          {selectedApplicant.experience || 'N/A'}
                        </p>
                      </div>

                      <div className={`p-5 rounded-[24px] border ${
                        isPendingApplicantModal
                          ? (darkMode
                              ? 'bg-slate-900/70 border-emerald-500/35 shadow-[0_18px_36px_-24px_rgba(16,185,129,0.75)]'
                              : 'bg-white border-emerald-200 shadow-[0_18px_36px_-24px_rgba(16,185,129,0.55)]')
                          : (darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100')
                      }`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <div>
                              <p className={`${isPendingApplicantModal ? "font-['Montserrat'] text-lg font-extrabold" : 'text-sm font-bold'}`}>Curriculum Vitae</p>
                              <p className={`${isPendingApplicantModal ? "font-['Montserrat'] text-xs font-semibold" : 'text-[10px]'} ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {selectedApplicant.cv_url ? 'Uploaded resume file' : 'No resume uploaded'}
                              </p>
                            </div>
                          </div>
                          {selectedApplicant.cv_url ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenResumePreviewModal(selectedApplicant)}
                                className={`inline-flex items-center gap-1.5 ${isPendingApplicantModal ? "font-['Montserrat'] text-sm font-extrabold" : 'text-xs font-bold'} text-emerald-500 hover:text-emerald-400 transition-colors`}
                              >
                                View File
                              </button>
                              {!isSelectedApplicantProcessed ? (
                                <a
                                  href={selectedApplicant.cv_url}
                                  download={getApplicantResumeDownloadName(selectedApplicant)}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                                    darkMode
                                      ? 'border-slate-600 text-slate-200 hover:bg-slate-700'
                                      : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                                  }`}
                                  title="Download resume"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <span className={`text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>N/A</span>
                          )}
                        </div>
                      </div>

                      <div className={`p-5 rounded-[24px] border ${
                        isPendingApplicantModal
                          ? (darkMode
                              ? 'bg-slate-900/70 border-emerald-500/35 shadow-[0_18px_36px_-24px_rgba(16,185,129,0.75)]'
                              : 'bg-white border-emerald-200 shadow-[0_18px_36px_-24px_rgba(16,185,129,0.55)]')
                          : (darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100')
                      }`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className={`${isPendingApplicantModal ? "font-['Montserrat'] text-sm font-extrabold uppercase tracking-[0.16em]" : 'text-[10px] font-bold uppercase tracking-widest'} ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                              Interview Schedule
                            </p>
                            <p className={`${isPendingApplicantModal ? "font-['Montserrat'] text-[15px] font-medium mt-1.5" : 'text-xs mt-1'} ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {isSelectedApplicantProcessed
                                ? 'Schedule and AI scan points from pending review.'
                                : 'Set calendar date and interview time while status is pending.'}
                            </p>
                          </div>
                          {selectedApplicant.interview_at ? (
                            <span className={`inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                              isApplicantInterviewSaved
                                ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                                : (darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
                            }`}>
                              {isApplicantInterviewSaved ? 'Saved' : 'Unsaved'}
                            </span>
                          ) : null}
                        </div>

                        {isSelectedApplicantProcessed ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                              <span className={`${isPendingApplicantModal ? 'text-xs font-extrabold uppercase tracking-[0.14em]' : 'text-[10px] font-bold uppercase tracking-widest'} ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Saved Schedule</span>
                              <input
                                readOnly
                                value={selectedApplicant.interview_at ? formatInterviewSchedule(selectedApplicant.interview_at) : 'No schedule saved'}
                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 ${isPendingApplicantModal ? "font-['Montserrat'] text-base font-semibold bg-white border-emerald-200 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_20px_-18px_rgba(16,185,129,0.55)]" : `text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}`}
                              />
                            </label>
                            <label className="block">
                              <span className={`${isPendingApplicantModal ? 'text-xs font-extrabold uppercase tracking-[0.14em]' : 'text-[10px] font-bold uppercase tracking-widest'} ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>AI Resume Points</span>
                              <input
                                readOnly
                                value={
                                  isLoadingSelectedApplicantResumePoints
                                    ? 'Loading points...'
                                    : typeof selectedApplicantResumePoints === 'number'
                                      ? `${selectedApplicantResumePoints} / 100`
                                      : 'Not available'
                                }
                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 ${isPendingApplicantModal ? "font-['Montserrat'] text-base font-bold bg-white border-emerald-200 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_20px_-18px_rgba(16,185,129,0.55)]" : `text-sm font-semibold ${darkMode ? 'bg-slate-900 border-slate-700 text-emerald-300' : 'bg-white border-gray-200 text-emerald-700'}`}`}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                              <span className={`${isPendingApplicantModal ? 'text-xs font-extrabold uppercase tracking-[0.14em]' : 'text-[10px] font-bold uppercase tracking-widest'} ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Date</span>
                              <input
                                type="date"
                                value={applicantInterviewDate}
                                onChange={(e) => {
                                  setApplicantInterviewDate(e.target.value);
                                  setIsApplicantInterviewSaved(false);
                                  setApplicantInterviewSavedAt(null);
                                }}
                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 ${isPendingApplicantModal ? "font-['Montserrat'] text-base font-semibold bg-white border-emerald-200 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_20px_-18px_rgba(16,185,129,0.55)]" : `text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                              />
                            </label>
                            <label className="block">
                              <span className={`${isPendingApplicantModal ? 'text-xs font-extrabold uppercase tracking-[0.14em]' : 'text-[10px] font-bold uppercase tracking-widest'} ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Time</span>
                              <input
                                type="time"
                                value={applicantInterviewTime}
                                onChange={(e) => {
                                  setApplicantInterviewTime(e.target.value);
                                  setIsApplicantInterviewSaved(false);
                                  setApplicantInterviewSavedAt(null);
                                }}
                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 ${isPendingApplicantModal ? "font-['Montserrat'] text-base font-semibold bg-white border-emerald-200 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_20px_-18px_rgba(16,185,129,0.55)]" : `text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                              />
                            </label>
                          </div>
                        )}

                        {selectedApplicant.interview_at ? (
                          <p className={`mt-3 text-xs font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            Current schedule: {formatInterviewSchedule(selectedApplicant.interview_at)}
                          </p>
                        ) : null}

                        {isApplicantInterviewSaved && applicantInterviewSavedAt ? (
                          <p className={`mt-1 text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            Saved at: {formatInterviewSchedule(applicantInterviewSavedAt)}
                          </p>
                        ) : null}

                        {!isSelectedApplicantProcessed ? (
                          <button
                            type="button"
                            onClick={handleSaveApplicantInterviewSchedule}
                            disabled={isSavingApplicantInterview || isUpdatingApplicantStatus}
                            className={`mt-4 w-full py-2.5 rounded-xl bg-emerald-600 text-white ${isPendingApplicantModal ? "font-['Montserrat'] text-sm font-extrabold tracking-[0.12em]" : 'text-xs font-bold uppercase tracking-widest'} hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {isSavingApplicantInterview ? 'Saving Schedule...' : isApplicantInterviewSaved ? 'Saved' : 'Save Interview Schedule'}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {selectedApplicantStatus === 'pending' ? (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleRequestDeclineApplicant(selectedApplicant)}
                          disabled={isUpdatingApplicantStatus}
                          title="Decline this applicant and send decline email"
                          className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-extrabold text-base tracking-[0.08em] hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isUpdatingApplicantStatus ? 'Processing...' : 'Decline'}
                        </button>
                        <button
                          onClick={() => handleRequestAcceptApplicant(selectedApplicant)}
                          disabled={isUpdatingApplicantStatus || !isApplicantInterviewSaved || !selectedApplicant.interview_at}
                          title={isApplicantInterviewSaved ? "Accept this applicant and send acceptance email" : "Save interview schedule first, then accept"}
                          className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-base tracking-[0.08em] hover:bg-emerald-700 shadow-xl shadow-emerald-700/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isUpdatingApplicantStatus ? 'Processing...' : 'Accept'}
                        </button>
                      </div>
                    ) : selectedApplicantStatus === 'accepted' ? (
                      <div className="flex gap-4">
                        <button
                          onClick={() => setSelectedApplicant(null)}
                          className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          Close
                        </button>
                        <button
                          onClick={() => handleRequestHireApplicant(selectedApplicant)}
                          disabled={applicantRowActionId === selectedApplicant.id}
                          title="Mark this accepted applicant as hired"
                          className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {applicantRowActionId === selectedApplicant.id ? 'Processing...' : 'Hire'}
                        </button>
                      </div>
                    ) : selectedApplicantStatus === 'hired' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-4 rounded-2xl bg-blue-100 text-blue-700 font-bold text-sm cursor-not-allowed"
                      >
                        Hired
                      </button>
                    ) : null}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {acceptApplicantConfirmTarget ? (
                <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setAcceptApplicantConfirmTarget(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className={`text-sm font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Confirm Action
                    </p>
                    <p className={`mt-3 text-base font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {`Are you sure to Accept ${acceptConfirmApplicantName}`}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAcceptApplicantConfirmTarget(null)}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmAcceptApplicant}
                        disabled={isUpdatingApplicantStatus}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Yes
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {declineApplicantConfirmTarget ? (
                <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setDeclineApplicantConfirmTarget(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className={`text-sm font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Confirm Action
                    </p>
                    <p className={`mt-3 text-base font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {`Are you sure to Decline ${declineConfirmApplicantName}`}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDeclineApplicantConfirmTarget(null)}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeclineApplicant}
                        disabled={isUpdatingApplicantStatus}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Yes
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {hireApplicantConfirmTarget ? (
                <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setHireApplicantConfirmTarget(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className={`text-sm font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Confirm Action
                    </p>
                    <p className={`mt-3 text-base font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {`Are you sure to Hired ${hireConfirmApplicantName}.`}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setHireApplicantConfirmTarget(null)}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmHireApplicant}
                        disabled={Boolean(hireApplicantConfirmTarget?.id && applicantRowActionId === hireApplicantConfirmTarget.id)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Yes
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {resumePreviewApplicant && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleCloseResumePreviewModal}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    className={`relative w-full max-w-6xl h-[90vh] rounded-[30px] border shadow-2xl overflow-hidden ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-900'
                    }`}
                  >
                    <div className={`h-16 px-6 border-b flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-black/10'}`}>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Resume Viewer</p>
                        <p className="text-sm font-semibold">
                          {`${resumePreviewApplicant.first_name || ''} ${resumePreviewApplicant.last_name || ''}`.replace(/\s+/g, ' ').trim() || 'Applicant'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseResumePreviewModal}
                        className={`w-9 h-9 rounded-xl border inline-flex items-center justify-center transition-colors ${
                          darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Exit resume preview"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] h-[calc(90vh-64px)]">
                      <div className={`p-4 border-r h-full ${darkMode ? 'border-slate-700 bg-slate-950/30' : 'border-black/10 bg-gray-50'}`}>
                        <div className={`w-full h-full rounded-2xl overflow-hidden border ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                          {resumePreviewApplicant.cv_url ? (
                            <iframe
                              title="Applicant resume file"
                              src={resumePreviewApplicant.cv_url}
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className={`text-sm italic ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No resume file available.</p>
                            </div>
                          )}
                        </div>
                        {resumePreviewApplicant.cv_url && !isResumePreviewProcessedApplicant ? (
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {getApplicantResumeDownloadName(resumePreviewApplicant)}
                            </p>
                            <a
                              href={resumePreviewApplicant.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                            >
                              Open In New Tab
                            </a>
                          </div>
                        ) : null}
                      </div>

                      <div className="p-5 h-full overflow-y-auto">
                        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>AI Analyze Points</p>
                          {isAnalyzingResume ? (
                            <div className="mt-4 flex items-center gap-3">
                              <span className={`inline-block w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin`} />
                              <p className={`text-sm font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                Loading AI Analyze...
                              </p>
                            </div>
                          ) : null}

                          {resumeAnalysisResult ? (
                            <div className="mt-4 flex flex-col items-center gap-4">
                              {(() => {
                                const score = resumeAnalysisResult.totalPoints;
                                const maxScore = Math.max(1, resumeAnalysisResult.maxPoints);
                                const scorePercent = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
                                const radius = 54;
                                const circumference = 2 * Math.PI * radius;
                                const dashOffset = circumference - (scorePercent / 100) * circumference;

                                return (
                                  <>
                                    <div className="relative h-44 w-44">
                                      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140" aria-label="Scored earn progress">
                                        <circle
                                          cx="70"
                                          cy="70"
                                          r={radius}
                                          fill="none"
                                          stroke={darkMode ? '#334155' : '#d1d5db'}
                                          strokeWidth="12"
                                        />
                                        <circle
                                          cx="70"
                                          cy="70"
                                          r={radius}
                                          fill="none"
                                          stroke="#10b981"
                                          strokeWidth="12"
                                          strokeLinecap="round"
                                          strokeDasharray={circumference}
                                          strokeDashoffset={dashOffset}
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className={`text-3xl font-black ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                          {score}
                                        </p>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                          Scored Earn
                                        </p>
                                      </div>
                                    </div>
                                    <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                      {score} / {maxScore} ({scorePercent}%)
                                    </p>
                                    {isResumePreviewProcessedApplicant ? (
                                      <p className={`text-xs text-center leading-relaxed max-w-xs ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                        {getHireChanceSummaryByScore(score, maxScore)}
                                      </p>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          ) : null}

                          {!isAnalyzingResume && !resumeAnalysisResult && resumeAnalysisNotice ? (
                            <p className={`mt-3 text-xs font-semibold ${resumeAnalysisNotice.toLowerCase().includes('failed') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                              {resumeAnalysisNotice}
                            </p>
                          ) : null}
                        </div>

                        {!isResumePreviewProcessedApplicant ? (
                          <div className="mt-5 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleCloseResumePreviewModal}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors ${
                                darkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Exit
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmResumeAnalysis}
                              disabled={isAnalyzingResume || !resumeAnalysisResult}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Confirm
                            </button>
                            {resumeAnalysisNotice ? (
                              <p className={`text-xs font-semibold ${resumeAnalysisNotice.toLowerCase().includes('failed') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                                {resumeAnalysisNotice}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : activeTab === 'Inbox' ? (
          <div className="space-y-6">
            <div className={`rounded-[28px] border-2 p-4 md:p-5 shadow-[0_8px_0_rgba(0,0,0,0.28),0_24px_32px_-22px_rgba(0,0,0,0.95)] ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/20'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-[#123f2f]'}`}>INBOX</h2>
                  <p className={`mt-6 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Message from the User Concerns
                  </p>
                  <span className="sr-only">{inboxSourceDebug.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-72">
                    {inboxAutocompleteSuffix ? (
                      <div className={`pointer-events-none absolute inset-y-0 left-0 right-0 px-3 flex items-center text-sm ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        <span className="text-transparent whitespace-pre">{inboxSearchQuery}</span>
                        <span className="italic whitespace-pre">{inboxAutocompleteSuffix}</span>
                      </div>
                    ) : null}
                    <input
                      type="text"
                      value={inboxSearchTerm}
                      onChange={(e) => setInboxSearchTerm(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Tab' && inboxAutocompleteName) {
                          event.preventDefault();
                          setInboxSearchTerm(inboxAutocompleteName);
                        }
                      }}
                      placeholder="Search name..."
                      className={`relative z-10 h-11 w-full rounded-xl border-2 px-3 py-2 text-sm shadow-[0_5px_0_rgba(0,0,0,0.23),0_14px_18px_-14px_rgba(0,0,0,0.95)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-black/20 text-gray-900 placeholder:text-gray-400'
                      }`}
                    />
                  </div>
                  {inboxNotice ? (
                    <p className={`text-xs font-semibold ${inboxNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                      {inboxNotice}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {openInboxActionMenuId ? (
                <motion.div
                  className="fixed inset-0 z-[118] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/30 backdrop-blur-[4px]"
                    onClick={() => setOpenInboxActionMenuId('')}
                    aria-label="Close inbox actions menu"
                  />
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 14, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`relative w-full max-w-sm rounded-[24px] border p-5 shadow-2xl ${
                      darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <h3 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      Message Actions
                    </h3>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {getInboxSenderName(openInboxActionMessage) || 'Selected message'}
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!openInboxActionMenuId) return;
                          if (isOpenInboxActionMessageArchived) {
                            handleRestoreInboxMessage(openInboxActionMenuId);
                            return;
                          }
                          handleArchiveInboxMessage(openInboxActionMenuId);
                        }}
                        className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold text-left transition-colors ${
                          darkMode
                            ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {isOpenInboxActionMessageArchived ? 'Restore' : 'Archive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openInboxDeleteModal(openInboxActionMenuId)}
                        className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold text-left transition-colors ${
                          darkMode
                            ? 'border-red-500/40 text-red-300 hover:bg-red-500/10'
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenInboxActionMenuId('')}
                        className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold text-left transition-colors ${
                          darkMode
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-[330px_1fr] gap-4">
              <aside className="rounded-[30px] border border-[#9CFCC1] bg-[#046241] p-5 shadow-[0_24px_55px_-25px_rgba(4,98,65,0.95)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] mb-3 text-[#d7ffe8]">
                  Inbox Names
                </p>
                <p className="mt-[0.7rem] mb-2 text-[10px] text-[#d7ffe8]/90">
                  Please Read the Messages
                </p>
                <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#d7ffe8]">
                    <button
                      type="button"
                      onClick={() => setInboxReadFilter('all')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${
                        inboxReadFilter === 'all'
                          ? 'bg-white text-[#046241] border border-white'
                          : 'bg-transparent text-[#d7ffe8] border border-[#9CFCC1]/70 hover:bg-white/10'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setInboxReadFilter('read')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${
                        inboxReadFilter === 'read'
                          ? 'bg-white text-[#046241] border border-white'
                          : 'bg-transparent text-[#d7ffe8] border border-[#9CFCC1]/70 hover:bg-white/10'
                      }`}
                    >
                      read
                    </button>
                    <button
                      type="button"
                      onClick={() => setInboxReadFilter('unread')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${
                        inboxReadFilter === 'unread'
                          ? 'bg-[#FFC370] text-[#5f3a00] border border-[#efb35a]'
                          : 'bg-transparent text-[#d7ffe8] border border-[#9CFCC1]/70 hover:bg-white/10'
                      }`}
                    >
                      unread
                    </button>
                    <button
                      type="button"
                      onClick={() => setInboxReadFilter('archived')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${
                        inboxReadFilter === 'archived'
                          ? 'bg-[#e5f9ef] text-[#046241] border border-[#9CFCC1]'
                          : 'bg-transparent text-[#d7ffe8] border border-[#9CFCC1]/70 hover:bg-white/10'
                      }`}
                    >
                      Archived
                    </button>
                </div>

                <div className="rounded-[22px] border border-[#9CFCC1] bg-[#f3fff8] p-2 max-h-[370px] overflow-y-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
                  {isLoadingInbox ? (
                    <p className="py-10 text-center text-sm text-[#3f6f59]">
                      Loading contact messages...
                    </p>
                  ) : filteredInboxMessages.length === 0 ? (
                    <p className="py-10 text-center text-sm italic text-[#5d7d6d]">
                      No contact messages found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredInboxMessages.map((messageItem) => {
                        const senderName = getInboxSenderName(messageItem) || 'N/A';
                        const messagePreview = asCleanText(messageItem.message) || 'No message';
                        const isUnread = !readInboxIds.includes(messageItem.id);
                        const isSelected = selectedInboxMessageId === messageItem.id;
                        return (
                          <motion.div
                            key={messageItem.id}
                            onClick={() => handleInboxRowClick(messageItem.id)}
                            onPointerDown={() => handleInboxRowPointerDown(messageItem.id)}
                            onPointerUp={handleInboxRowPointerEnd}
                            onPointerLeave={handleInboxRowPointerEnd}
                            onPointerCancel={handleInboxRowPointerEnd}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return;
                              event.preventDefault();
                              handleInboxRowClick(messageItem.id);
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                            role="button"
                            tabIndex={0}
                            className={`w-full relative rounded-2xl border px-4 py-3 text-left transition-colors min-h-[82px] shadow-[0_10px_20px_-16px_rgba(15,23,42,0.45)] cursor-pointer ${
                              isUnread
                                ? 'bg-[#FFC370] border-[#efb35a] hover:bg-[#ffcf89]'
                                : 'bg-[#F9F7F7] border-[#9CFCC1] hover:bg-[#ffffff]'
                            } ${isSelected ? 'ring-2 ring-[#34d399]' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-sm whitespace-normal break-words ${isUnread ? 'font-bold text-[#1e293b]' : 'font-normal text-[#4b5563]'}`}>
                                  {senderName}
                                </p>
                                <p className={`text-xs mt-0.5 whitespace-normal break-words ${isUnread ? 'font-semibold text-[#6a3f00]' : 'font-normal text-[#6b7280]'}`}>
                                  {messagePreview}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isUnread ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ffe3b7] text-[#6a3f00]">
                                    Unread
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#6b7280] border border-[#d1d5db]">
                                    Read
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onPointerDown={(event) => event.stopPropagation()}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenInboxActionMenuId((previousId) => (previousId === messageItem.id ? '' : messageItem.id));
                                  }}
                                  className="h-7 w-7 rounded-full border border-[#d1d5db] bg-white text-[#4b5563] inline-flex items-center justify-center hover:bg-[#f3f4f6] transition-colors"
                                  aria-label={`Actions for ${senderName}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="1" />
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="16" r="1" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              <section className="rounded-[28px] border border-[#9CFCC1] bg-[#046241] p-5 md:p-6 shadow-[0_24px_55px_-25px_rgba(4,98,65,0.95)] min-h-[420px]">
                {!selectedInboxMessageForDetails ? (
                  <div className="h-full min-h-[320px] flex items-center justify-center">
                    <p className="text-sm italic text-emerald-100/80">
                      Message Details Empty. Click a message to read.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedInboxMessageForDetails.id}
                      initial={{ opacity: 0, x: 10, scale: 0.965 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold text-[#d7ffe8]">
                          Message Details
                        </h3>
                        <p className="text-xs text-emerald-100/80">
                          {formatDateTimeLabel(selectedInboxMessageForDetails.created_at)}
                        </p>
                      </div>

                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#d7ffe8]">
                          Full Name
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={getInboxSenderName(selectedInboxMessageForDetails) || 'N/A'}
                          className="mt-2 w-full rounded-2xl border border-[#9CFCC1] bg-[#f6fff9] px-4 py-3 text-sm text-[#063a28] shadow-[0_12px_22px_-12px_rgba(2,54,35,0.85),inset_0_1px_0_rgba(255,255,255,0.75)]"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#d7ffe8]">
                          Email
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={selectedInboxMessageForDetails.email || 'N/A'}
                          className="mt-2 w-full rounded-2xl border border-[#9CFCC1] bg-[#f6fff9] px-4 py-3 text-sm text-[#063a28] shadow-[0_12px_22px_-12px_rgba(2,54,35,0.85),inset_0_1px_0_rgba(255,255,255,0.75)]"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#d7ffe8]">
                          Message
                        </span>
                        <textarea
                          readOnly
                          value={selectedInboxMessageForDetails.message || 'N/A'}
                          rows={9}
                          className="mt-2 w-full rounded-2xl border border-[#9CFCC1] bg-[#f6fff9] px-4 py-3 text-sm text-[#063a28] whitespace-pre-wrap resize-none shadow-[0_12px_22px_-12px_rgba(2,54,35,0.85),inset_0_1px_0_rgba(255,255,255,0.75)]"
                        />
                      </label>

                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d7ffe8]">
                            Reply
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setInboxReplyDraft('');
                              setInboxReplyNotice('');
                              setIsInboxReplyComposerOpen(true);
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                              darkMode
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title="Reply to this message"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                            Reply
                          </button>
                        </div>
                        {inboxReplyNotice ? (
                          <p className={`mt-2 text-xs font-semibold ${inboxReplyNotice.toLowerCase().includes('empty') || inboxReplyNotice.toLowerCase().includes('select') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-700')}`}>
                            {inboxReplyNotice}
                          </p>
                        ) : null}
                      </div>

                      <div className="pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-[#d7ffe8]">
                          Sent Replies
                        </p>
                        {selectedInboxReplies.length === 0 ? (
                          <div className={`rounded-xl border px-3 py-3 text-xs italic ${darkMode ? 'border-slate-700 bg-slate-900/40 text-slate-500' : 'border-black/10 bg-gray-50 text-gray-400'}`}>
                            No replies yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedInboxReplies.map((replyItem) => (
                              <button
                                key={replyItem.id}
                                type="button"
                                onClick={() => setSelectedInboxReplyView(replyItem)}
                                className={`rounded-xl border p-3 text-left transition-colors ${
                                  darkMode
                                    ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-700/40'
                                    : 'border-black/10 bg-white hover:bg-gray-50'
                                }`}
                              >
                                <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                  {replyItem.senderName || currentAdminName || 'Admin'}
                                </p>
                                <p className={`mt-1 text-xs line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                  {replyItem.text}
                                </p>
                                <p className={`mt-2 text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                  {formatDateTimeLabel(replyItem.sentAt)}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </section>
            </div>

            <AnimatePresence>
              {previewInboxMessage ? (
                <motion.div
                  className="fixed inset-0 z-[125] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-black/35 backdrop-blur-[6px]" />
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0.9 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0.9 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="relative w-full max-w-4xl min-h-[420px] rounded-[28px] border border-[#9CFCC1] bg-white/92 p-5 md:p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className="text-xl font-bold text-[#046241]">Message Preview</h3>
                      <p className="text-xs text-[#4b5563] italic">Release to close</p>
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#046241]">Full Name</span>
                        <input
                          readOnly
                          value={getInboxSenderName(previewInboxMessage) || 'N/A'}
                          className="mt-2 w-full rounded-2xl border border-[#9CFCC1] bg-white px-4 py-3 text-sm text-[#063a28] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#046241]">Email</span>
                        <input
                          readOnly
                          value={previewInboxMessage.email || 'N/A'}
                          className="mt-2 w-full rounded-2xl border border-[#9CFCC1] bg-white px-4 py-3 text-sm text-[#063a28] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#046241]">Message</span>
                        <textarea
                          readOnly
                          value={previewInboxMessage.message || 'N/A'}
                          rows={10}
                          className="mt-2 w-full rounded-2xl border border-[#9CFCC1] bg-white px-4 py-3 text-sm text-[#063a28] whitespace-pre-wrap resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                        />
                      </label>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {inboxDeleteTargetId ? (
                <motion.div
                  className="fixed inset-0 z-[126] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/45 backdrop-blur-[4px]"
                    onClick={closeInboxDeleteModal}
                    aria-label="Close delete confirmation"
                  />
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 14, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`relative w-full max-w-md rounded-[24px] border p-5 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                  >
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      Confirm Delete
                    </h3>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Delete message from <span className="font-semibold">{getInboxSenderName(inboxDeleteTargetMessage) || 'this user'}</span>? This cannot be undone.
                    </p>
                    <div className="mt-5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeInboxDeleteModal}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-colors ${
                          darkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmInboxDelete}
                        className="px-3 py-2 rounded-lg border border-red-700 bg-red-600 text-white text-xs font-bold uppercase tracking-wide transition-colors hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {isInboxReplyComposerOpen && selectedInboxMessageForDetails ? (
                <motion.div
                  className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                    onClick={() => setIsInboxReplyComposerOpen(false)}
                    aria-label="Close reply modal"
                  />
                  <motion.div
                    initial={{ y: 24, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 18, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`relative w-full max-w-2xl rounded-[28px] border p-6 md:p-7 shadow-2xl ${darkMode ? 'bg-slate-900/95 border-emerald-500/35' : 'bg-white border-emerald-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Reply Message</h3>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Send a reply to {getInboxSenderName(selectedInboxMessageForDetails) || 'this user'}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInboxReplyComposerOpen(false)}
                        className={`h-9 w-9 rounded-lg border text-lg leading-none ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-black/10 text-gray-500 hover:bg-gray-50'}`}
                        aria-label="Close"
                      >
                        x
                      </button>
                    </div>

                    <div className="mt-5 space-y-4">
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Name</span>
                        <input
                          type="text"
                          readOnly
                          value={currentAdminName || 'Admin'}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm cursor-not-allowed ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gray-100 border-black/10 text-gray-700'}`}
                        />
                      </label>

                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Email</span>
                        <input
                          type="text"
                          readOnly
                          value={currentAdminEmail || 'N/A'}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm cursor-not-allowed ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gray-100 border-black/10 text-gray-700'}`}
                        />
                      </label>

                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Message</span>
                        <textarea
                          value={inboxReplyDraft}
                          onChange={(e) => setInboxReplyDraft(e.target.value)}
                          rows={7}
                          placeholder="Type your reply..."
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/25 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-black/10 text-gray-900 placeholder:text-gray-400'}`}
                        />
                      </label>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsInboxReplyComposerOpen(false)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-black/10 text-gray-600 hover:bg-gray-50'}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSendInboxReply}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {selectedInboxReplyView ? (
                <motion.div
                  className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                    onClick={() => setSelectedInboxReplyView(null)}
                    aria-label="Close reply preview"
                  />
                  <motion.div
                    initial={{ y: 16, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 12, opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`relative w-full max-w-2xl rounded-[24px] border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-black/10'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Sent Reply</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedInboxReplyView(null)}
                        className={`h-9 w-9 rounded-lg border text-lg leading-none ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-black/10 text-gray-500 hover:bg-gray-50'}`}
                        aria-label="Close"
                      >
                        x
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Name</span>
                        <input
                          type="text"
                          readOnly
                          value={selectedInboxReplyView.senderName || 'Admin'}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gray-100 border-black/10 text-gray-700'}`}
                        />
                      </label>
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Email</span>
                        <input
                          type="text"
                          readOnly
                          value={selectedInboxReplyView.senderEmail || 'N/A'}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gray-100 border-black/10 text-gray-700'}`}
                        />
                      </label>
                      <label className="block">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Message</span>
                        <textarea
                          readOnly
                          value={selectedInboxReplyView.text}
                          rows={7}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm whitespace-pre-wrap resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-black/10 text-gray-900'}`}
                        />
                      </label>
                      <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        Sent: {formatDateTimeLabel(selectedInboxReplyView.sentAt)}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
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
                                        {historyDeleteActionKey === `account:${row.id}` ? 'Removing...' : 'Delete'}
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
                                      {historyDeleteActionKey === `project:${row.id}` ? 'Removing...' : 'Delete'}
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
                              {isHistoryDeleteProcessing ? 'Removing...' : 'Remove from UI'}
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
            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`inline-flex h-11 items-center rounded-xl border px-5 shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
                  <h2 className={`text-2xl font-bold leading-none ${darkMode ? 'text-slate-100' : 'text-[#123f2f]'}`}>Manage Users</h2>
                </div>
                <div className="relative min-w-[220px]" ref={manageUsersCategoryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsManageUsersCategoryMenuOpen((prev) => !prev)}
                    className={`relative w-full h-11 rounded-xl border px-3 pr-9 text-sm font-bold text-left transition-colors ${
                      darkMode
                        ? 'bg-slate-800 border-slate-600 text-slate-100 hover:border-emerald-400/70'
                        : 'bg-white border-emerald-200 text-gray-900 hover:border-emerald-300'
                    }`}
                  >
                    {manageUsersCategoryOptions.find((option) => option.value === manageUsersCategoryFilter)?.label || 'All'}
                    <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </button>
                  {isManageUsersCategoryMenuOpen ? (
                    <div className={`absolute top-[calc(100%+6px)] left-0 z-30 w-full rounded-xl border shadow-lg overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-200'}`}>
                      {manageUsersCategoryOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setManageUsersCategoryFilter(option.value);
                            setIsManageUsersCategoryMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            manageUsersCategoryFilter === option.value
                              ? darkMode
                                ? 'bg-emerald-500/20 text-emerald-200'
                                : 'bg-emerald-50 text-emerald-700'
                              : darkMode
                                ? 'text-slate-200 hover:bg-slate-800'
                                : 'text-gray-700 hover:bg-emerald-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={`h-11 rounded-xl border px-4 inline-flex items-center text-xs font-bold tracking-wide ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-black/5 text-gray-700'}`}>
                  Interns: {manageUsersCountByCategory.interns}
                </div>
                <div className={`h-11 rounded-xl border px-4 inline-flex items-center text-xs font-bold tracking-wide ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-black/5 text-gray-700'}`}>
                  Pending Approval: {manageUsersCountByCategory.pending}
                </div>
                <div className={`h-11 rounded-xl border px-4 inline-flex items-center text-xs font-bold tracking-wide ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-black/5 text-gray-700'}`}>
                  Employees: {manageUsersCountByCategory.employees}
                </div>
                <div className={`h-11 rounded-xl border px-4 inline-flex items-center text-xs font-bold tracking-wide ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-black/5 text-gray-700'}`}>
                  Admins: {manageUsersCountByCategory.admins}
                </div>
                <button
                  onClick={refreshUsersData}
                  title="Refresh users"
                  className={`h-11 w-11 rounded-xl shadow-sm border inline-flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-black/5 hover:bg-gray-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </button>
              </div>
              {manageUsersNotice ? (
                <p className={`text-xs font-semibold ${manageUsersNotice.toLowerCase().includes('unable') ? (darkMode ? 'text-orange-300' : 'text-orange-600') : (darkMode ? 'text-emerald-300' : 'text-emerald-600')}`}>
                  {manageUsersNotice}
                </p>
              ) : null}
            </div>

            <div className={`grid grid-cols-1 ${manageUsersCategoryFilter === 'all' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} items-start ${expandedManageFrames.length === 0 ? 'gap-10' : 'gap-8'}`}>
              {/* Interns Table */}
              <div className={`${shouldShowManageFrame('interns') ? 'block' : 'hidden'} rounded-[40px] ${getManageFramePaddingClass('interns')} shadow-sm border transition-all duration-300 ${getManageFrameLayoutClass('interns')} ${manageUsersCategoryFilter === 'interns' ? 'lg:scale-[1.02] lg:origin-top' : ''} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
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
              <div className={`${shouldShowManageFrame('pending') ? 'block' : 'hidden'} rounded-[40px] ${getManageFramePaddingClass('pending')} shadow-sm border transition-all duration-300 ${getManageFrameLayoutClass('pending')} ${manageUsersCategoryFilter === 'pending' ? 'lg:scale-[1.02] lg:origin-top' : ''} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
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
                        <tr key={p.id} className={`border-b transition-colors ${darkMode ? 'border-slate-700' : 'border-black/5'} [&>td]:transition-colors [&:hover>td]:bg-white`}>
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
              <div className={`${shouldShowManageFrame('employees') ? 'block' : 'hidden'} rounded-[40px] ${getManageFramePaddingClass('employees')} shadow-sm border transition-all duration-300 ${getManageFrameLayoutClass('employees')} ${manageUsersCategoryFilter === 'employees' ? 'lg:scale-[1.02] lg:origin-top' : ''} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
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
              <div className={`${shouldShowManageFrame('admins') ? 'block' : 'hidden'} rounded-[40px] ${getManageFramePaddingClass('admins')} shadow-sm border transition-all duration-300 ${getManageFrameLayoutClass('admins')} ${manageUsersCategoryFilter === 'admins' ? 'lg:scale-[1.02] lg:origin-top' : ''} ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-black/5'}`}>
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
        </div>
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
