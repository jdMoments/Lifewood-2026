import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';

const OFF_TOPIC_RESPONSE =
  "I appreciate your curiosity! However, I am specialized to assist specifically with Lifewood and the content found on this platform. I'm unable to provide information outside of that scope, but I'd be happy to help you with anything related to our site or your account.";
const LIFEWOOD_OVERVIEW_RESPONSE =
  'Yes. Lifewood is an AI-powered data solutions platform focused on AI initiatives, services, projects, philanthropy, careers, and role-based tools across the Lifewood website.';

const WEBSITE_KNOWLEDGE = `
Public/webpage scope:
- Public homepage content and general company information.
- Public navigation links and related information such as AI Initiatives, Philanthropy, and Careers.
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

const readFileSafely = (relativePath: string) => {
  try {
    const absolutePath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    console.warn(`[ChatScopeScan] Unable to read ${relativePath}:`, error);
    return '';
  }
};

const extractKeyStringsFromSource = (source: string, maxItems = 220) => {
  if (!source) return [];

  const literalRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  const unique = new Set<string>();
  const results: string[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = literalRegex.exec(source)) !== null) {
    const rawValue = (match[1] ?? match[2] ?? '').replace(/\\n/g, ' ').replace(/\\t/g, ' ').trim();
    if (!rawValue) continue;
    if (rawValue.length < 3 || rawValue.length > 120) continue;
    if (!/[a-zA-Z]/.test(rawValue)) continue;
    if (/^(\.\/|\.\.\/|https?:\/\/|#[/a-zA-Z]|[a-zA-Z0-9_-]+\.[a-z]{2,})/.test(rawValue)) continue;
    if (/(import|from|export|const|let|var|function|return)\b/.test(rawValue)) continue;
    if (unique.has(rawValue)) continue;

    unique.add(rawValue);
    results.push(rawValue);
    if (results.length >= maxItems) break;
  }

  return results;
};

const buildScopedKnowledgeFromFiles = (
  scopeLabel: string,
  baseKnowledge: string,
  relativeFiles: string[],
  maxChars = 12000
) => {
  const fileSections: string[] = [];

  for (const relativePath of relativeFiles) {
    const source = readFileSafely(relativePath);
    if (!source) continue;

    const strings = extractKeyStringsFromSource(source, 140);
    if (!strings.length) continue;

    const fileName = path.basename(relativePath);
    const lines = strings.map((value) => `- ${value}`).join('\n');
    fileSections.push(`[${fileName}] scanned key content:\n${lines}`);
  }

  if (!fileSections.length) return baseKnowledge;

  const scannedBlock = fileSections.join('\n\n');
  const combined = `${baseKnowledge}\n\nScanned live content from project files (${scopeLabel}):\n${scannedBlock}`;
  return combined.length > maxChars ? combined.slice(0, maxChars) : combined;
};

type ChatScope = 'public' | 'user' | 'employees' | 'admin';
type ChatUserContext = { id?: string; email?: string; fullName?: string; role?: string };

const getScopeSourceFiles = (scope: ChatScope) => {
  if (scope === 'public') {
    return [
      'components/HomePage.tsx',
      'components/Hero.tsx',
      'components/About.tsx',
      'components/Stats.tsx',
      'components/AIDataServices.tsx',
      'components/Clients.tsx',
      'components/VisionMission.tsx',
      'components/CTA.tsx',
      'components/ContactUs.tsx',
    ];
  }
  if (scope === 'user') return ['components/User.tsx'];
  if (scope === 'employees') return ['components/Employees.tsx'];
  return ['components/Admin.tsx'];
};

const getBaseScopeKnowledge = (scope: ChatScope) => {
  if (scope === 'public') return WEBSITE_KNOWLEDGE;
  if (scope === 'user') return USER_DASHBOARD_KNOWLEDGE;
  if (scope === 'employees') return EMPLOYEE_DASHBOARD_KNOWLEDGE;
  return ADMIN_DASHBOARD_KNOWLEDGE;
};

const getScopeKnowledgeFromFiles = (scope: ChatScope) => {
  const scopeLabelMap: Record<typeof scope, string> = {
    public: 'Public Website',
    user: 'User Dashboard',
    employees: 'Employees Dashboard',
    admin: 'Admin Dashboard',
  };
  const charLimit = scope === 'admin' || scope === 'public' ? 12000 : 10000;
  return buildScopedKnowledgeFromFiles(
    scopeLabelMap[scope],
    getBaseScopeKnowledge(scope),
    getScopeSourceFiles(scope),
    charLimit
  );
};

type ParsedHoliday = { month: number; day: number; name: string; type: string };

const normalizeText = (value: string) => value.toLowerCase().trim();

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

const parseHolidayEntriesFromSource = (source: string): ParsedHoliday[] => {
  if (!source) return [];
  const holidayRegex =
    /\{\s*month:\s*(\d+),\s*day:\s*(\d+),\s*name:\s*(['"`])([\s\S]*?)\3,\s*type:\s*(['"`])([\s\S]*?)\5[\s\S]*?\}/g;
  const holidays: ParsedHoliday[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = holidayRegex.exec(source)) !== null) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    const name = (match[4] || '').trim();
    const type = (match[6] || '').trim();
    if (!Number.isFinite(month) || !Number.isFinite(day) || !name || !type) continue;
    holidays.push({ month, day, name, type });
  }

  return holidays;
};

const getTodayScopeContext = (scope: ChatScope) => {
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();
  const humanDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const pageFiles = getScopeSourceFiles(scope);
  const primaryScopeFile = pageFiles[0] || '';
  const scopeSource = primaryScopeFile ? readFileSafely(primaryScopeFile) : '';
  const holidays = parseHolidayEntriesFromSource(scopeSource);

  if (holidays.length > 0) {
    const todayHoliday = holidays.find((holiday) => holiday.month === todayMonth && holiday.day === todayDay);
    if (todayHoliday) {
      return `Today context for current scope: ${humanDate} (day ${todayDay}). It is ${todayHoliday.name} and classified as ${todayHoliday.type}.`;
    }
    return `Today context for current scope: ${humanDate} (day ${todayDay}). No holiday matches this date in the current page holiday list, so it is a regular working day.`;
  }

  return `Today context for current scope: ${humanDate} (day ${todayDay}).`;
};

const buildChatSystemInstruction = (scope: ChatScope, routePath: string, userContext?: ChatUserContext) => {
  const scopeLabelMap: Record<typeof scope, string> = {
    public: 'Public Website',
    user: 'User Dashboard',
    employees: 'Employees Dashboard',
    admin: 'Admin Dashboard',
  };

  const scopedKnowledge = getScopeKnowledgeFromFiles(scope);
  const todayScopeContext = getTodayScopeContext(scope);
  const userContextSummary =
    scope === 'public'
      ? 'No authenticated user context in public scope.'
      : `Authenticated user context: name="${(userContext?.fullName || '').trim() || 'unknown'}", email="${
          (userContext?.email || '').trim() || 'unknown'
        }", role="${(userContext?.role || '').trim() || scope}".`;

  return `Role:
You are the Lifewood Intelligent Assistant. Your goal is to provide clear, accurate, and professional information based strictly on the content of the Lifewood platform.

Current scope: ${scopeLabelMap[scope]} (route: ${routePath}).

Tone and Persona:
- Smart and Analytical: provide insightful and concise answers.
- Appreciative: acknowledge well-defined questions (for example: "That's a great question regarding our site structure...").
- Professional: maintain a polished and helpful demeanor at all times.

Contextual Knowledge Boundaries:
- Public/Webpage View: if the user is not logged in, your knowledge is strictly limited to the public homepage, navigation bar links (AI Initiatives, Philanthropy, Careers), and general company information.
- User Dashboard View: once a user is logged in, you can answer from User Side content while still retaining knowledge of public site and navbar.
- Employee/Admin View: if the user is Admin or Employee, your scope includes internal documentation, administrative controls, and employee-specific content relevant to their view.

Constraint Rules:
- Lifewood Focus: answer only questions related to Lifewood, its services, its content, and the specific page the user is currently viewing.
- If a question is unrelated to Lifewood (for example world news, unrelated coding, or personal advice), return exactly:
${OFF_TOPIC_RESPONSE}
- If a question is Lifewood-related but outside the currently active scope, respond with:
"I can only assist with Lifewood information relevant to your current view and access level. Please ask about the content available on this page."
- Personal simple support: you may answer simple personal day-to-day concerns in a brief helpful way.
- Unrelated technical topics (for example bubble sort, generic coding problems, or non-Lifewood programming help) are out of scope and must use the exact OFF_TOPIC_RESPONSE above.
- If the user asks about their own name and authenticated user context is available, answer using that user context only.
- Keep answers concise, accurate, and professional.
- If asked about today's date/status, answer using the current scope context below.
- Answer only what the user asked and avoid unrelated extra details.
- Specific-answer rule: respond only to the exact question/topic asked. Do not add extra explanation, suggestions, or follow-up details unless explicitly requested.
- If a short direct answer is sufficient, return a short direct answer only.

Runtime current page context:
${todayScopeContext}

Authenticated user context:
${userContextSummary}

Knowledge base for current scope:
${scopedKnowledge}

If user asks "What is all about Lifewood?", provide a short Lifewood-focused summary from the current scope perspective.`;
};

const readRequestBody = (req: any): Promise<string> =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer | string) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const sendJson = (res: any, statusCode: number, payload: Record<string, any>) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const createAiProxyPlugin = (env: Record<string, string>) => {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const handleChat = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    if (!apiKey) {
      sendJson(res, 500, { error: 'Missing GEMINI_API_KEY on server' });
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      const scopeRaw = typeof body?.scope === 'string' ? body.scope.trim().toLowerCase() : 'public';
      const routePath = typeof body?.routePath === 'string' ? body.routePath.trim() : '/';
      const allowedScopes = new Set(['public', 'user', 'employees', 'admin']);
      const scope = (allowedScopes.has(scopeRaw) ? scopeRaw : 'public') as ChatScope;
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
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }

      if (isLifewoodOverviewQuestion(message)) {
        sendJson(res, 200, { text: LIFEWOOD_OVERVIEW_RESPONSE });
        return;
      }

      if (isLikelyUnrelatedTechnicalQuestion(message)) {
        sendJson(res, 200, { text: OFF_TOPIC_RESPONSE });
        return;
      }

      if (isNameQuestion(message)) {
        const identityAnswer = getUserIdentityAnswer(scope, userContext);
        if (identityAnswer) {
          sendJson(res, 200, { text: identityAnswer });
          return;
        }
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: buildChatSystemInstruction(scope, routePath, userContext),
        },
      });
      const response = await chat.sendMessage({ message });
      sendJson(res, 200, { text: response.text || '' });
    } catch (error: any) {
      console.error('Chat API error:', error);
      const status = typeof error?.status === 'number' ? error.status : 500;
      const rawMessage = typeof error?.message === 'string' ? error.message : '';
      const lowerMessage = rawMessage.toLowerCase();

      if (status === 403 && lowerMessage.includes('reported as leaked')) {
        sendJson(res, 403, {
          error:
            'Gemini API key was reported as leaked. Please replace GEMINI_API_KEY in .env and restart the app.',
        });
        return;
      }

      if (status === 403) {
        sendJson(res, 403, {
          error: 'Gemini API request is not authorized. Please verify GEMINI_API_KEY.',
        });
        return;
      }

      sendJson(res, 500, { error: 'Chat request failed' });
    }
  };

  const handleTranslate = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    if (!apiKey) {
      sendJson(res, 500, { error: 'Missing GEMINI_API_KEY on server' });
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage.trim() : '';
      const source = body?.source;

      if (!targetLanguage || !source || typeof source !== 'object') {
        sendJson(res, 400, { error: 'targetLanguage and source are required' });
        return;
      }

      const prompt = `Translate the following JSON object's string values from English to ${targetLanguage}. Do not translate the keys. Maintain the exact JSON structure and return only the translated JSON object.\n\n${JSON.stringify(source)}`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const responseText = response.text?.trim() || '';
      const translations = JSON.parse(responseText);
      sendJson(res, 200, { translations });
    } catch (error) {
      console.error('Translate API error:', error);
      sendJson(res, 500, { error: 'Translation request failed' });
    }
  };

  const registerMiddlewares = (middlewares: any) => {
    middlewares.use('/api/chat', async (req: any, res: any, next: any) => {
      await handleChat(req, res).catch(next);
    });

    middlewares.use('/api/translate', async (req: any, res: any, next: any) => {
      await handleTranslate(req, res).catch(next);
    });
  };

  return {
    name: 'lifewood-ai-proxy',
    configureServer(server: any) {
      registerMiddlewares(server.middlewares);
    },
    configurePreviewServer(server: any) {
      registerMiddlewares(server.middlewares);
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      createAiProxyPlugin(env),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
