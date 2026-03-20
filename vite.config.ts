import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';

const OFF_TOPIC_RESPONSE =
  'That question is not related to Lifewood business and website content. Please ask about Lifewood.';

const WEBSITE_KNOWLEDGE = `
Lifewood AI Solutions website scope:
- Homepage: Lifewood AI Solutions overview and company identity.
- AI Services page: AI-enabled business solutions and data/automation services.
- AI Projects page: examples of projects and implementation highlights.
- Internal News, About, Offices, Careers, Contact, PhiPact, Tads, and policy pages.
- Core topics: company mission, services, projects, careers, offices, and contact/help.
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

const buildChatSystemInstruction = (scope: 'public' | 'user' | 'employees' | 'admin', routePath: string) => {
  const scopeLabelMap: Record<typeof scope, string> = {
    public: 'Public Website',
    user: 'User Dashboard',
    employees: 'Employees Dashboard',
    admin: 'Admin Dashboard',
  };

  const scopeKnowledgeMap: Record<typeof scope, string> = {
    public: WEBSITE_KNOWLEDGE,
    user: USER_DASHBOARD_KNOWLEDGE,
    employees: EMPLOYEE_DASHBOARD_KNOWLEDGE,
    admin: ADMIN_DASHBOARD_KNOWLEDGE,
  };

  return `You are Lifewood Assistant.

Current scope: ${scopeLabelMap[scope]} (route: ${routePath}).

General behavior:
- Answer only questions related to Lifewood.
- If question is unrelated to Lifewood business, return exactly:
${OFF_TOPIC_RESPONSE}
- Keep responses concise, clear, and helpful.

Scope restriction:
- For public scope: answer only from website/public Lifewood content.
- For user scope: answer only from User dashboard content.
- For employees scope: answer only from Employees dashboard content.
- For admin scope: answer only from Admin dashboard content.
- If user asks outside the active scope, respond with:
"This question is outside the current page scope. Please ask about the current Lifewood page."

Knowledge base for current scope:
${scopeKnowledgeMap[scope]}

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
      const scope = (allowedScopes.has(scopeRaw) ? scopeRaw : 'public') as 'public' | 'user' | 'employees' | 'admin';

      if (!message) {
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: buildChatSystemInstruction(scope, routePath),
        },
      });
      const response = await chat.sendMessage({ message });
      sendJson(res, 200, { text: response.text || '' });
    } catch (error) {
      console.error('Chat API error:', error);
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
