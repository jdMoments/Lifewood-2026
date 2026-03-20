import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ACCORDION_DATA } from '../constants';
import CountUp from './CountUp';

const ACTIVE_GROW = 90;
const INACTIVE_GROW = (100 - ACTIVE_GROW) / 3;

const CARD_BACKGROUND_BY_KEY: Record<string, string> = {
  'stats.accordion.item1.title': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop',
  'stats.accordion.item2.title':
    'https://lens.usercontent.google.com/banana?agsi=CmdnbG9iYWw6OjAwMDA1NWNmZWM3MDAyNmQ6MDAwMDAwZWI6MTo2YzkyOTRlNjc1YTVkMDBiOjAwMDA1NWNmZWM3MDAyNmQ6MDAwMDAxODE0OWEwMzM2ODowMDA2NGQ3NjcxODkxMTBmEAI=',
  'stats.accordion.item3.title': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=2000&auto=format&fit=crop',
  'stats.accordion.item4.title': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2000&auto=format&fit=crop',
};

const EXTRA_DETAILS_BY_KEY: Record<string, string[]> = {
  'stats.accordion.item1.title': [
    'Lifewood Data Technology operates 40+ Global Delivery Centers to provide 24/7 AI data services with high efficiency and localized expertise.',
    'Global Delivery Centers and Hubs',
    'Southeast Asia: Cebu (Philippines), Kuala Lumpur (Malaysia), Hanoi (Vietnam), and Malang (Indonesia).',
    'Greater China: Dongguan, Wuxi, Shenzhen, Meizhou, Taiyuan, and Hefei.',
    'South Asia: Chittagong (Bangladesh) and Kolkata (India).',
    'Africa: Strong network across 15+ countries including Benin, South Africa, Nigeria, and Congo.',
    'Americas and Europe: United States and Germany support global clients.',
    'Localized expertise, scalable production, and follow-the-sun operations are core strengths of this model.',
  ],
  'stats.accordion.item2.title': [
    'Lifewood Data Technology is a global AI data service provider established in 2004. Their 30+ Countries Across All Continents footprint supports diverse language, voice, and facial recognition datasets for AI training.',
    'Global Reach and Key Locations',
    'Asia: Philippines (Cebu City), China (Dongguan, Wuxi, Meizhou, Taiyuan), Vietnam (Hanoi), Malaysia (Kuala Lumpur, Petaling Jaya, Subang Jaya), Bangladesh, Indonesia, and Thailand.',
    'Africa: Benin, South Africa (Johannesburg), Nigeria, Republic of the Congo, Democratic Republic of the Congo, Ghana, Madagascar, Uganda, Kenya, Ivory Coast, Egypt, Ethiopia, Niger, Tanzania, Namibia, Zambia, Zimbabwe, Liberia, and Sierra Leone.',
    'Europe and Americas: Operations across both continents support cultural and linguistic diversity in data.',
    'Middle East: Turkey (Istanbul).',
  ],
  'stats.accordion.item3.title': [
    'Lifewood excels in localized AI training data across 50+ languages and dialects, helping models understand diverse human communication.',
    'Linguistic Diversity: Supports major languages and regional dialects across Asia and Africa.',
    'Regional Accents: Includes local accent variation (for example US, UK, and Australian English) for stronger voice model accuracy.',
    'Dialectal Nuance: Captures less common dialects across 40+ operational centers in 30+ countries.',
    'Multimodal Data: Supports Speech-to-Text, NLP, and translation services at scale.',
  ],
  'stats.accordion.item4.title': [
    'Lifewood uses 56,000+ global online resources to power AI data services through a large distributed workforce and digital ecosystem.',
    'The Role of 56,000+ Online Resources',
    'Human-in-the-Loop: Specialists, curators, annotators, and freelancers help ensure cultural and linguistic accuracy.',
    'Diverse Data Acquisition: Supports sentiment analysis, transcription, and image classification across regions.',
    'Scalability and Speed: Handles massive data engineering workloads with high-volume execution.',
    'Localized Context: Improves NLP and computer vision quality with region-aware data inputs.',
  ],
};

const renderTitle = (title: string) => {
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

const stripLeadingCount = (title: string) => title.replace(/^\d[\d,.+]*\s*/, '').trim();

const getPreview = (text: string, maxLength = 88) =>
  text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;

const Stats: React.FC = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);

  useEffect(() => {
    if (activeIndex === null) return;

    const timer = window.setTimeout(() => {
      setDetailIndex(activeIndex);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  const activeItem = ACCORDION_DATA[detailIndex];
  const activeTitle = t(activeItem.titleKey);
  const activeContent = t(activeItem.contentKey);
  const activeExtraDetails = useMemo(
    () => EXTRA_DETAILS_BY_KEY[activeItem.titleKey] ?? [],
    [activeItem.titleKey]
  );

  return (
    <section className="relative z-10 px-6 md:px-20 py-16 md:py-20 bg-transparent transition-colors duration-300 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://lens.usercontent.google.com/banana?agsi=CmdnbG9iYWw6OjAwMDA1NWNmZWM3MDAyNmQ6MDAwMDAwZWI6MTo3NTM5ODJmNmE2MGUwNzgyOjAwMDA1NWNmZWM3MDAyNmQ6MDAwMDAxODE0OWEwMzM2ODowMDA2NGQ3NmY1YmVlYTZmEAI=")',
          }}
        />
        <div className="absolute inset-0 bg-black/12 dark:bg-black/22" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-lw-green mb-2">
            Lifewood Global Strength
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-lw-text-dark dark:text-white">
            Global Capacity at a Glance
          </h2>
        </div>

        <div className="w-full pb-3">
          <div className="w-full h-[250px] md:h-[290px] flex items-stretch gap-3 md:gap-4" onMouseLeave={() => setActiveIndex(null)}>
            {ACCORDION_DATA.map((item, index) => {
              const isActive = index === activeIndex;
              const hasActiveCard = activeIndex !== null;
              const bgImage = CARD_BACKGROUND_BY_KEY[item.titleKey] ?? '';
              const title = t(item.titleKey);
              const content = t(item.contentKey);
              const previewContent = getPreview(content);

              return (
                <article
                  key={item.titleKey}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  tabIndex={0}
                  className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-500 ease-out ${
                    isActive
                      ? 'border-lw-green/70 shadow-xl shadow-lw-green/25'
                      : 'border-lw-border dark:border-white/15 shadow-md'
                  }`}
                  style={
                    hasActiveCard
                      ? { flexGrow: isActive ? ACTIVE_GROW : INACTIVE_GROW, flexBasis: 0 }
                      : { flexGrow: 1, flexBasis: 0 }
                  }
                >
                  <div className="absolute inset-0 z-0">
                    <div className={`absolute inset-0 transition-all duration-500 ${item.bgColor}`} />
                    <div
                      className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ backgroundImage: `url("${bgImage}")` }}
                    />
                    <div
                      className={`absolute inset-0 transition-all duration-500 ${
                        isActive
                          ? 'bg-gradient-to-b from-[#04341d]/35 via-[#042716]/72 to-[#021109]/94'
                          : 'bg-black/8 dark:bg-black/25'
                      }`}
                    />
                  </div>

                  <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-5">
                    <h3
                      className={`font-bold leading-tight transition-colors duration-500 ${
                        isActive
                          ? 'text-white text-lg md:text-2xl'
                          : `${item.textColor} text-base md:text-lg`
                      }`}
                    >
                      {renderTitle(title)}
                    </h3>

                    <div className="overflow-hidden">
                      <p
                        className={`text-sm leading-relaxed transition-[max-height,opacity,transform] duration-500 ease-out ${
                          isActive
                            ? 'max-h-0 opacity-0 -translate-y-2'
                            : 'max-h-24 opacity-95 translate-y-0 text-lw-text-body dark:text-white/80'
                        }`}
                      >
                        {previewContent}
                      </p>

                      <p
                        className={`text-sm leading-relaxed transition-[max-height,opacity,transform] duration-700 ease-out ${
                          isActive
                            ? 'max-h-44 opacity-100 translate-y-0 text-white/95 delay-200'
                            : 'max-h-0 opacity-0 translate-y-2 delay-0'
                        }`}
                      >
                        {content}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-6 md:mt-8 rounded-2xl border border-lw-green/30 bg-gradient-to-br from-lw-green/10 via-white to-[#edf8f2] dark:from-lw-green/15 dark:to-[#08140d] p-5 md:p-7 shadow-lg shadow-lw-green/10">
          <div key={activeItem.titleKey} className="transition-opacity duration-500 ease-out">
            <h3 className="text-xl md:text-2xl font-bold text-lw-text-dark dark:text-white mb-2">
              {stripLeadingCount(activeTitle)}
            </h3>
            <p className="text-lw-text-body dark:text-white/80 leading-relaxed mb-4">{activeContent}</p>

            <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
              {activeExtraDetails.map((line) => (
                <p key={line} className="text-sm md:text-base leading-relaxed text-lw-text-body dark:text-white/80">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
