
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { englishContent, LANGUAGES, sampleSpanishTranslation } from '../content';
import { GoogleGenAI } from '@google/genai';

interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    translations: any;
    loading: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string>('en');
    const [translations, setTranslations] = useState<any>(englishContent);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchTranslations = async () => {
            if (language === 'en') {
                setTranslations(englishContent);
                return;
            }
            if (language === 'es') { // Demo with sample translations
                setTranslations(sampleSpanishTranslation);
                return;
            }

            setLoading(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const model = 'gemini-3-flash-preview';
                const langName = LANGUAGES[language as keyof typeof LANGUAGES]?.name || 'this language';
                
                const prompt = `Translate the following JSON object's string values from English to ${langName}. Do not translate the keys. Maintain the exact JSON structure and return only the translated JSON object.\n\n${JSON.stringify(englishContent)}`;
                
                const response = await ai.models.generateContent({
                  model,
                  contents: prompt,
                  config: { responseMimeType: "application/json" }
                });

                const translated = JSON.parse(response.text.trim());
                setTranslations(translated);

            } catch (error) {
                console.error("Failed to fetch translations:", error);
                setTranslations(englishContent); // Fallback to English on error
            } finally {
                setLoading(false);
            }
        };

        fetchTranslations();
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translations, loading }}>
            {children}
        </LanguageContext.Provider>
    );
};
