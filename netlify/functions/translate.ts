import { GoogleGenAI } from '@google/genai';

const sendJson = (statusCode: number, payload: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

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
    const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage.trim() : '';
    const source = body?.source;

    if (!targetLanguage || !source || typeof source !== 'object') {
      return sendJson(400, { error: 'targetLanguage and source are required' });
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
    return sendJson(200, { translations });
  } catch (error) {
    console.error('Translate API error:', error);
    return sendJson(500, { error: 'Translation request failed' });
  }
};
