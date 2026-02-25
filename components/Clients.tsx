import React from 'react';
import { useInView } from 'react-intersection-observer';
import { CLIENT_LOGOS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

const Clients: React.FC = () => {
    const { t } = useTranslation();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  // Duplicate the logos to create a seamless scrolling effect
  const doubledLogos = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <section className="relative z-10 py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Video Column */}
            <div className="rounded-2xl shadow-2xl overflow-hidden aspect-video">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/WsYfQmbgc6E?si=vE-4ZOLxLd6cCPMF" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                ></iframe>
            </div>

            {/* Right Content Column */}
            <div className="text-left">
                <h2 className="text-3xl md:text-5xl font-bold text-black mb-6">
                    {t('clients.heading')}
                </h2>
                <p className="text-lw-text-body text-lg leading-relaxed mb-12">
                    {t('clients.paragraph')}
                </p>
                
                <div 
                    ref={ref}
                    className="w-full overflow-hidden"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                    }}
                >
                    <div className="flex w-max animate-scroll-clients">
                    {doubledLogos.map((logo, index) => (
                        <div key={`${logo.name}-${index}`} className="px-12 flex-shrink-0 flex items-center justify-center">
                        <img 
                            src={logo.src} 
                            alt={`${logo.name} logo`}
                            className={`h-10 md:h-12 max-w-[180px] w-auto object-contain grayscale opacity-60 transition-all duration-700 ease-in-out hover:grayscale-0 hover:opacity-100 ${inView ? 'scale-x-100' : 'scale-x-50'}`}
                        />
                        </div>
                    ))}
                    </div>
                </div>
            </div>
      </div>
    </section>
  );
};

export default Clients;