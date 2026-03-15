
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const CTA: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative z-10 px-8 md:px-20 py-28 text-center bg-lw-bg-section">
      <div className="max-w-3xl mx-auto px-8 sm:px-16 py-20 bg-lw-bg-dark border border-lw-green/30 rounded-3xl relative overflow-hidden shadow-2xl shadow-lw-green/20">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-radial-gradient from-lw-green/25 to-transparent pointer-events-none" />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
            {t('cta.heading')}
          </h2>
          <p className="text-white/65 text-lg leading-relaxed mb-9">
            {t('cta.paragraph')}
          </p>
          <a href="#/contact" className="px-9 py-4 bg-lw-green-light text-lw-green rounded-lg font-bold text-base no-underline shadow-lg shadow-lw-green-light/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-lw-green-light/50 hover:bg-lw-green-light/90 inline-block">
            {t('cta.button')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
