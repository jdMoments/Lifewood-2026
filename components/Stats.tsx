import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ACCORDION_DATA } from '../constants';
import CountUp from './CountUp';

const PlusMinusIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg className={`w-6 h-6 transition-transform duration-300 ease-in-out ${isActive ? 'rotate-180' : 'rotate-0'}`} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path className={`transition-transform duration-300 ease-in-out ${isActive ? 'scale-y-0' : 'scale-y-100'}`} d="M12 5V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transformOrigin: 'center'}}/>
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


interface AccordionItemProps {
    item: typeof ACCORDION_DATA[0];
    isActive: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isActive }) => {
    const { t } = useTranslation();
    const { titleKey, contentKey, bgColor, textColor, iconBg, iconColor } = item;
    const bgImageUrl = "https://images.unsplash.com/photo-1593444973351-c1b0a85da536?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    const renderTitle = (title: string) => {
        // Regex to find the first number in the string (including commas)
        const match = title.match(/^(\d+[,.]?\d*)/);
        if (!match) return title;

        const numStr = match[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        const rest = title.substring(match[0].length);

        return (
            <>
                <CountUp to={num} duration={2} separator="," />
                {rest}
            </>
        );
    };

    return (
        <div
            className={`relative rounded-2xl shadow-lg transition-all duration-500 ease-in-out ${bgColor}`}
            style={{
                transformStyle: 'preserve-3d',
                transform: isActive ? 'translateY(-8px) translateZ(30px)' : 'translateY(0) translateZ(0)',
                boxShadow: isActive ? '0 25px 50px -12px rgba(0, 0, 0, 0.35)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}
        >
            <div
                className="absolute inset-0 bg-cover bg-center rounded-2xl transition-opacity duration-500 z-0"
                style={{
                    backgroundImage: `url(${bgImageUrl})`,
                    opacity: isActive ? 1 : 0
                }}
            />
            <div
                className="absolute inset-0 bg-lw-accordion-beige/80 rounded-2xl transition-opacity duration-500 z-0"
                style={{ opacity: isActive ? 1 : 0 }}
            />

            <div className="relative z-10">
                 <div 
                    className="flex justify-between items-center p-10 cursor-pointer"
                    aria-expanded={isActive}
                >
                    <h3 className={`text-4xl font-bold transition-colors duration-300 ${isActive ? 'text-lw-text-dark' : textColor}`}>
                        {renderTitle(t(titleKey))}
                    </h3>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white/80 text-lw-text-dark' : `${iconBg} ${iconColor}`}`}>
                        <PlusMinusIcon isActive={isActive} />
                    </div>
                </div>
                <div 
                    className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
                    style={{ maxHeight: isActive ? '250px' : '0px' }}
                >
                    <div className="px-10 pb-10 pt-0">
                        <div className={`transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <p className={`max-w-4xl text-lg leading-relaxed mb-6 transition-colors duration-300 ${isActive ? 'text-lw-text-dark opacity-100' : 'opacity-80'}`}>
                                {t(contentKey)}
                            </p>
                            <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${isActive ? 'bg-white/80 text-lw-text-dark' : `${iconBg} ${iconColor}`} hover:scale-110 hover:shadow-lg`}>
                               <ArrowIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Stats: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
  
  return (
    <section className="relative z-10 px-8 md:px-20 min-h-[90vh] flex items-center py-16 bg-lw-bg-base">
        <div 
            className="max-w-7xl mx-auto space-y-6 w-full"
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ perspective: '1500px' }}
        >
            {ACCORDION_DATA.map((item, index) => (
                <div 
                    key={item.titleKey}
                    onMouseEnter={() => setHoveredIndex(index)}
                >
                    <AccordionItem
                        item={item}
                        isActive={hoveredIndex === index}
                    />
                </div>
            ))}
        </div>
    </section>
  );
};

export default Stats;