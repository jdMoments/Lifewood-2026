import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';

const CHAT_SYSTEM_INSTRUCTION =
  "You are a helpful, professional, and friendly AI assistant for Lifewood AI Solutions. Your goal is to help users understand Lifewood's services, projects, and mission. Keep your responses concise and informative. If you don't know something about Lifewood, suggest they contact us via the contact form on the website.";

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

      if (!message) {
        sendJson(res, 400, { error: 'Message is required' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model,
        config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION },
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
