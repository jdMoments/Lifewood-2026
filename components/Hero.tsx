import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [scrollStyle, setScrollStyle] = useState({ opacity: 1, transform: 'scale(1)' });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const screenHeight = window.innerHeight;
      
      // The effect will complete over the first 60% of a viewport scroll
      const scrollPercent = Math.min(scrollY / (screenHeight * 0.6), 1);

      const opacity = 1 - scrollPercent;
      const scale = 1 - (scrollPercent * 0.1); // Scale down from 1 to 0.9

      setScrollStyle({
        opacity: opacity,
        transform: `scale(${scale})`,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      id="home" 
      className="sticky top-0 z-10 h-screen flex flex-col justify-center items-center text-center px-8 sm:px-12 md:px-20 overflow-hidden"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-binary-code-background-video-4835-large.mp4" type="video/mp4" />
          {/* User provided link as fallback */}
          <source src="https://www.pexels.com/download/video/10922866/" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div 
        style={scrollStyle}
        className="transition-all duration-100 ease-linear relative z-10"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/40 rounded-full text-xs text-white tracking-widest uppercase font-semibold mb-7 bg-white/10 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="w-2 h-2 rounded-full bg-lw-green animate-pulse-dot inline-block" />
          {t('hero.subheading')}
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight max-w-5xl mb-7 text-white animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {t('hero.heading.part1')} <span className="text-lw-green">{t('hero.heading.part2')}</span> {t('hero.heading.part3')}
        </h1>

        <div
          className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.6s' }}
        >
          <a href="#/contact" className="px-9 py-4 bg-lw-green-light text-lw-green rounded-lg font-bold text-base no-underline shadow-lg shadow-lw-green-light/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-lw-green-light/50 hover:bg-lw-green-light/90 inline-block">
            {t('hero.ctaContact')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;