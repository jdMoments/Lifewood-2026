
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { LANGUAGES } from '../content';

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
);

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, loading } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    return (
        <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className={`flex items-center gap-2 px-3 py-2.5 border-2 rounded-lg text-lw-text-body font-bold text-sm no-underline transition-all duration-300 hover:border-[#FFB347] hover:text-[#FFB347] ${isOpen ? 'border-[#FFB347] text-[#FFB347]' : 'border-lw-border'}`}>
                {loading ? <LoadingSpinner /> : <GlobeIcon />}
                <span>{language.toUpperCase()}</span>
                <ChevronDownIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 block animate-dropdown-fade-in origin-top-right w-56">
                    <ul className="bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-lg border border-lw-border max-h-72 overflow-y-auto">
                        {Object.entries(LANGUAGES).map(([code, lang]) => (
                            <li key={code}>
                                <button
                                    onClick={() => {
                                        setLanguage(code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${language === code ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'text-lw-text-dark hover:bg-[#FFB347]/10 hover:text-[#FFB347]'}`}
                                >
                                    {lang.name} <span className="text-lw-text-muted text-xs">({lang.nativeName})</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
