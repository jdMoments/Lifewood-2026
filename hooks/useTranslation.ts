
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { englishContent } from '../content';

// Utility to get a nested property from an object using a dot-separated string
const get = (obj: any, path: string, defaultValue: any = undefined) => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[\. ]+/);
  return result === undefined || result === obj ? defaultValue : result;
};


export const useTranslation = () => {
    const context = useContext(LanguageContext);

    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }

    const t = (key: string): string => {
        const translatedText = get(context.translations, key);
        if (translatedText) return translatedText;

        const fallbackText = get(englishContent, key);
        if (fallbackText) return fallbackText;
        
        // Return the key itself if no translation or fallback is found
        return key;
    };

    return { ...context, t };
};
