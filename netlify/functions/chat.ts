import { GoogleGenAI } from '@google/genai';

const OFF_TOPIC_RESPONSE =
  "I appreciate your curiosity! However, I am specialized to assist specifically with Lifewood and the content found on this platform. I'm unable to provide information outside of that scope, but I'd be happy to help you with anything related to our site or your account.";
const LIFEWOOD_OVERVIEW_RESPONSE =
  'Yes. Lifewood is an AI-powered data solutions platform focused on AI initiatives, services, projects, philanthropy, careers, and role-based tools across the Lifewood website.';
const ADMIN_EMAIL = 'damayojholmer@gmail.com';

const WEBSITE_KNOWLEDGE = `
Public/webpage scope:
- Public homepage content and general company information.
- Public navigation links and related information such as AI Initiatives, Philanthropy, Careers, and Internal News.
- Lifewood services and company details visible from public pages.
`;

const USER_DASHBOARD_KNOWLEDGE = `
User dashboard scope:
- Learning dashboard for interns/users with sections: Dashboard, My Progress, Tasks, Performance, Settings.
- Calendar with clickable holidays, holiday tooltips, and holiday background image behavior.
- "All Task" widget with static sample tasks, hover-search input, completion counter, and View action.
- Profile/notification/dark mode controls and sidebar navigation behavior.
`;

const EMPLOYEE_DASHBOARD_KNOWLEDGE = `
Employees dashboard scope:
- Same layout and behavior as User dashboard.
- Employee-oriented "All Task" sample list:
  1) Prepare daily operations report
  2) Attend 10:00 AM team stand-up meeting
  3) Review and reply to pending client emails
  4) Update project tracker and task statuses
  5) Submit end-of-day accomplishment summary
- Calendar, holiday interactions, profile controls, and dashboard sections similar to User.
`;

const ADMIN_DASHBOARD_KNOWLEDGE = `
Admin dashboard scope:
- Manage pending approvals, interns, employees, and application statuses.
- Approve/decline/archive/delete workflows for applications and users.
- Role-based management, user evaluations, reports/analytics, and admin controls.
- Admin-only dashboard navigation and management frames.
`;

type ChatScope = 'public' | 'user' | 'employees' | 'admin';
type ChatUserContext = { id?: string; email?: string; fullName?: string; role?: string };

const sendJson = (statusCode: number, payload: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const normalizeText = (value: string) => value.toLowerCase().trim();

const normalizeRoutePath = (routePath: string) => {
  const trimmed = (routePath || '/').trim();
  if (!trimmed) return '/';

  let normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  normalized = normalized.split('?')[0].split('#')[0].trim().toLowerCase();

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '/';
};

const resolveScopeFromRouteAndContext = (
  routePath: string,
  userContext: ChatUserContext,
  fallbackScope: ChatScope = 'public'
): ChatScope => {
  const normalizedRoute = normalizeRoutePath(routePath);
  const isDashboardRoute =
    normalizedRoute === '/admin' || normalizedRoute === '/user' || normalizedRoute === '/employees';

  if (!isDashboardRoute) return 'public';

  const normalizedRole = (userContext.role || '').trim().toLowerCase();
  const normalizedEmail = (userContext.email || '').trim().toLowerCase();
  const hasAuthIdentity = Boolean((userContext.id || '').trim() || normalizedEmail);
  if (!hasAuthIdentity) return 'public';

  if (normalizedRole === 'admin' || normalizedEmail === ADMIN_EMAIL) return 'admin';
  if (normalizedRole === 'employee') return 'employees';
  if (normalizedRole === 'user' || normalizedRole === 'intern') return 'user';
  return fallbackScope === 'admin' || fallbackScope === 'employees' ? fallbackScope : 'user';
};

const isLikelyUnrelatedTechnicalQuestion = (message: string) => {
  const text = normalizeText(message);
  const mentionsLifewood = text.includes('lifewood');
  const technicalKeywords = [
    'bubble sort',
    'binary search',
    'algorithm',
    'data structure',
    'leetcode',
    'javascript',
    'python',
    'java code',
    'c++',
    'typescript',
    'debug this code',
    'coding problem',
    'compiler',
    'array sorting',
  ];
  return !mentionsLifewood && technicalKeywords.some((keyword) => text.includes(keyword));
};

const isNameQuestion = (message: string) => {
  const text = normalizeText(message);
  return (
    text.includes('what is my name') ||
    text.includes("what's my name") ||
    text.includes('who am i') ||
    text.includes('tell me my name') ||
    text.includes('do you know my name') ||
    text.includes('my full name')
  );
};

const isLifewoodOverviewQuestion = (message: string) => {
  const text = normalizeText(message);
  return (
    text === 'do you know lifewood' ||
    text === 'do you know lifewood?' ||
    text === 'what is lifewood' ||
    text === 'what is lifewood?' ||
    text === 'who is lifewood' ||
    text === 'who is lifewood?' ||
    text === 'tell me about lifewood' ||
    text === 'tell me about lifewood?'
  );
};

const getUserIdentityAnswer = (scope: ChatScope, userContext: ChatUserContext) => {
  if (scope === 'public') return '';
  const preferredName = (userContext.fullName || '').trim();
  const email = (userContext.email || '').trim();
  const fallbackName = email ? email.split('@')[0] : '';
  const name = preferredName || fallbackName;
  return name ? `Your name is ${name}.` : '';
};

const getBaseScopeKnowledge = (scope: ChatScope) => {
  if (scope === 'public') return WEBSITE_KNOWLEDGE;
  if (scope === 'user') return USER_DASHBOARD_KNOWLEDGE;
  if (scope === 'employees') return EMPLOYEE_DASHBOARD_KNOWLEDGE;
  return ADMIN_DASHBOARD_KNOWLEDGE;
};

const getTodayScopeContext = () => {
  const now = new Date();
  const humanDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `Today context for current scope: ${humanDate}.`;
};

const buildChatSystemInstruction = (scope: ChatScope, routePath: string, userContext?: ChatUserContext) => {
  const scopeLabelMap: Record<ChatScope, string> = {
    public: 'Public Website',
    user: 'User Dashboard',
    employees: 'Employees Dashboard',
    admin: 'Admin Dashboard',
  };

  const normalizedRoute = normalizeRoutePath(routePath);
  const scopedKnowledge = getBaseScopeKnowledge(scope);
  const todayScopeContext = getTodayScopeContext();
  const userContextSummary =
    scope === 'public'
      ? 'No authenticated user context in public scope.'
      : `Authenticated user context: name="${(userContext?.fullName || '').trim() || 'unknown'}", email="${
          (userContext?.email || '').trim() || 'unknown'
        }", role="${(userContext?.role || '').trim() || scope}".`;

  return `Role:
You are the Lifewood Intelligent Assistant. Your goal is to provide clear, accurate, and professional information based strictly on the content of the Lifewood platform.

Current scope: ${scopeLabelMap[scope]} (route: ${normalizedRoute}).

Tone and Persona:
- Smart and Analytical: provide insightful and concise answers.
- Appreciative: acknowledge well-defined questions.
- Professional: maintain a polished and helpful demeanor at all times.

Constraint Rules:
- Lifewood Focus: answer only questions related to Lifewood, its services, and content available inside the currently active scope.
- Scope access:
  - If scope is Public Website, you may answer from all public website content.
  - If scope is User Dashboard, answer only from user dashboard content.
  - If scope is Employees Dashboard, answer only from employees dashboard content.
  - If scope is Admin Dashboard, answer only from admin dashboard content.
- If a question is unrelated to Lifewood (for example world news, unrelated coding, or personal advice), return exactly:
${OFF_TOPIC_RESPONSE}
- If a question is Lifewood-related but outside the currently active scope, respond with:
"I can only assist with Lifewood information relevant to your current view and access level. Please ask about the content available in your current area."
- Personal simple support: you may answer simple personal day-to-day concerns in a brief helpful way.
- Unrelated technical topics are out of scope and must use the exact OFF_TOPIC_RESPONSE above.
- If the user asks about their own name and authenticated user context is available, answer using that user context only.
- Keep answers concise, accurate, and professional.
- Answer only what the user asked and avoid unrelated extra details.

Runtime current page context:
${todayScopeContext}

Authenticated user context:
${userContextSummary}

Knowledge base for current scope:
${scopedKnowledge}

If user asks "What is all about Lifewood?", provide a short Lifewood-focused summary from the current scope perspective.`;
};

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return sendJson(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return sendJson(500, { error: 'Missing GEMINI_API_KEY on server' });
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const scopeRaw = typeof body?.scope === 'string' ? body.scope.trim().toLowerCase() : 'public';
    const routePath = typeof body?.routePath === 'string' ? body.routePath.trim() : '/';
    const allowedScopes = new Set(['public', 'user', 'employees', 'admin']);
    const fallbackScope = (allowedScopes.has(scopeRaw) ? scopeRaw : 'public') as ChatScope;

    const userContextRaw = body?.userContext;
    const userContext: ChatUserContext =
      userContextRaw && typeof userContextRaw === 'object'
        ? {
            id: typeof userContextRaw.id === 'string' ? userContextRaw.id : '',
            email: typeof userContextRaw.email === 'string' ? userContextRaw.email : '',
            fullName: typeof userContextRaw.fullName === 'string' ? userContextRaw.fullName : '',
            role: typeof userContextRaw.role === 'string' ? userContextRaw.role : '',
          }
        : {};

    if (!message) {
      return sendJson(400, { error: 'Message is required' });
    }

    const scope = resolveScopeFromRouteAndContext(routePath, userContext, fallbackScope);
    const normalizedRoutePath = normalizeRoutePath(routePath);

    if (isLifewoodOverviewQuestion(message)) {
      return sendJson(200, { text: LIFEWOOD_OVERVIEW_RESPONSE });
    }

    if (isLikelyUnrelatedTechnicalQuestion(message)) {
      return sendJson(200, { text: OFF_TOPIC_RESPONSE });
    }

    if (isNameQuestion(message)) {
      const identityAnswer = getUserIdentityAnswer(scope, userContext);
      if (identityAnswer) {
        return sendJson(200, { text: identityAnswer });
      }
    }

    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: buildChatSystemInstruction(scope, normalizedRoutePath, userContext),
      },
    });
    const response = await chat.sendMessage({ message });

    return sendJson(200, { text: response.text || '' });
  } catch (error: any) {
    console.error('Chat API error:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    const rawMessage = typeof error?.message === 'string' ? error.message : '';
    const lowerMessage = rawMessage.toLowerCase();

    if (status === 403 && lowerMessage.includes('reported as leaked')) {
      return sendJson(403, {
        error: 'Gemini API key was reported as leaked. Please replace GEMINI_API_KEY and redeploy.',
      });
    }

    if (status === 403) {
      return sendJson(403, {
        error: 'Gemini API request is not authorized. Please verify GEMINI_API_KEY.',
      });
    }

    return sendJson(500, { error: 'Chat request failed' });
  }
};
