import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const InternalNews: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen bg-white pt-40 pb-20 px-8 md:px-20 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-2 text-lw-green font-bold uppercase tracking-widest text-xs mb-4">
            <span className="w-8 h-[1px] bg-lw-green"></span>
            {t('nav.careers')}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-lw-text-dark mb-8 tracking-tight">
            {t('nav.internalNews')}
          </h1>
          
          <p className="text-lw-text-body text-xl max-w-3xl leading-relaxed">
            {t('internalNewsPage.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* News Item 1 */}
          <div className="group cursor-pointer">
            <div className="aspect-video overflow-hidden rounded-2xl mb-6">
              <img 
                src="https://picsum.photos/seed/news1/800/600" 
                alt="News 1" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">February 20, 2026</div>
            <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">{t('internalNewsPage.news1.title')}</h3>
            <p className="text-lw-text-body text-sm leading-relaxed">
              {t('internalNewsPage.news1.desc')}
            </p>
          </div>

          {/* News Item 2 */}
          <div className="group cursor-pointer">
            <div className="aspect-video overflow-hidden rounded-2xl mb-6">
              <img 
                src="https://picsum.photos/seed/news2/800/600" 
                alt="News 2" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">February 15, 2026</div>
            <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">{t('internalNewsPage.news2.title')}</h3>
            <p className="text-lw-text-body text-sm leading-relaxed">
              {t('internalNewsPage.news2.desc')}
            </p>
          </div>

          {/* News Item 3 */}
          <div className="group cursor-pointer">
            <div className="aspect-video overflow-hidden rounded-2xl mb-6">
              <img 
                src="https://picsum.photos/seed/news3/800/600" 
                alt="News 3" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-lw-green font-bold text-xs uppercase tracking-wider mb-3">February 10, 2026</div>
            <h3 className="text-2xl font-bold mb-4 text-lw-text-dark group-hover:text-lw-green transition-colors">{t('internalNewsPage.news3.title')}</h3>
            <p className="text-lw-text-body text-sm leading-relaxed">
              {t('internalNewsPage.news3.desc')}
            </p>
          </div>
        </div>

        {/* 3rd Section: Video */}
        <div className="mt-24 flex justify-center">
          <div className="w-full max-w-5xl bg-[#f5f5f5] p-6 md:p-10 rounded-[2rem] shadow-sm">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <iframe 
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/ccyrQ87EJag?si=45FjhZJGcQZf-ZkV" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalNews;
