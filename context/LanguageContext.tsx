
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { englishContent, LANGUAGES, sampleSpanishTranslation } from '../content';

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
                const langName = LANGUAGES[language as keyof typeof LANGUAGES]?.name || 'this language';
                const response = await fetch('/api/translate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    targetLanguage: langName,
                    source: englishContent,
                  }),
                });

                const data = await response.json().catch(() => ({} as Record<string, any>));
                if (!response.ok || !(data as any)?.translations) {
                  throw new Error((data as any)?.error || `Translation request failed (${response.status})`);
                }
                setTranslations((data as any).translations);

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
