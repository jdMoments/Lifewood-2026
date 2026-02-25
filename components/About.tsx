import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import FloatingGlobe from './FloatingGlobe';

const About: React.FC = () => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <section id="about" className="relative z-10 px-8 md:px-20 py-28 bg-lw-bg-base dark:bg-[#050a05] overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Image Column */}
        <div 
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={() => setIsFlipped(false)}
          className="flip-container cursor-pointer w-full aspect-[4/3]"
        >
          <div className={`flipper ${isFlipped ? 'is-flipped' : ''}`}>
            <div className="front-face">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="A diverse team of professionals collaborating in a modern, high-tech office environment with glowing data visualizations." 
                className="rounded-2xl shadow-2xl w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="back-face">
               <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="A diverse team of professionals in a serious, collaborative discussion around a conference table." 
                className="rounded-2xl shadow-2xl w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Text Column */}
        <div className="text-left relative min-h-[420px]">
          {/* Floating Globe is absolutely positioned relative to this column */}
          <div className="absolute -top-16 -right-52 w-[450px] h-[450px] hidden lg:block">
            <FloatingGlobe />
          </div>

          {/* Text content needs to be above the globe */}
          <div className="relative z-10">
            {/* Original Content */}
            <div className={`transition-opacity duration-500 ease-in-out ${!isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="text-3xl md:text-5xl font-bold text-lw-text-dark dark:text-white mb-4">
                {t('about.subheading')}
              </div>
              <h2 className="text-xl font-bold leading-tight mb-6 text-lw-text-dark dark:text-white">
                {t('about.heading.part1')}{" "}
                <span className="text-lw-green">{t('about.heading.part2')}</span>
              </h2>
              <p className="text-lw-text-body dark:text-gray-400 leading-relaxed mb-5 text-lg" dangerouslySetInnerHTML={{ __html: t('about.paragraph1') }} />
              <p className="text-lw-text-body dark:text-gray-400 leading-relaxed mb-10 text-lg">
                {t('about.paragraph2')}
              </p>
              <a href="#" className="px-9 py-4 bg-lw-green text-white rounded-lg font-bold text-base no-underline shadow-lg shadow-lw-green/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-lw-green/50 hover:bg-lw-green-deep inline-block">
                {t('about.cta')}
              </a>
            </div>
            
            {/* Flipped Content */}
            <div className={`absolute top-0 left-0 w-full transition-opacity duration-500 ease-in-out ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
               <h3 className="text-2xl md:text-3xl font-bold text-lw-green mb-3">{t('about.flipped.heading')}</h3>
               <p className="text-lw-text-body dark:text-gray-400 leading-relaxed mb-6">{t('about.flipped.paragraph1')}</p>
               <h3 className="text-2xl md:text-3xl font-bold text-lw-green mb-3">{t('about.flipped.missionHeading')}</h3>
               <p className="text-lw-text-body dark:text-gray-400 leading-relaxed">{t('about.flipped.missionParagraph')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
