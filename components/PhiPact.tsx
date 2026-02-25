import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const PhiPact: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-32 bg-white min-h-screen">
      {/* Hero Section */}
      <section className="px-8 md:px-20 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex -space-x-2">
              <div className="w-4 h-4 rounded-full bg-black"></div>
              <div className="w-4 h-4 rounded-full bg-white border border-black/20"></div>
            </div>
            <div className="h-[1px] w-24 bg-black/20"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-lw-text-dark mb-8 tracking-tight">
            Philanthropy and Impact
          </h1>
          
          <p className="text-lw-text-body text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
            We direct resources into education and developmental projects that create lasting change. 
            Our approach goes beyond giving: it builds sustainable growth and empowers communities for the future.
          </p>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="px-8 py-3 bg-[#FFB347] text-lw-text-dark rounded-full font-bold text-sm no-underline shadow-lg shadow-orange-200 transition-all hover:-translate-y-1"
            >
              Contact Us
            </a>
            <div className="w-10 h-10 rounded-full bg-lw-green-deep flex items-center justify-center text-white">
              <span className="text-xs">↗</span>
            </div>
          </div>
        </div>
      </section>

      {/* Full Screen Image Section */}
      <section className="w-full h-screen overflow-hidden">
        <img 
          src="https://framerusercontent.com/images/7RZ9ESz7UTTmxn6ifh8I9jHlHA.png?width=1004&height=591" 
          alt="Philanthropy and Impact" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </section>

      {/* Global Impact Map Section */}
      <section className="px-8 md:px-20 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-lw-text-dark mb-6 tracking-tight">
              Global Reach, Local Impact
            </h2>
            <div className="h-1 w-20 bg-lw-green"></div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Image Side */}
            <div className="flex-1 rounded-[2rem] overflow-hidden shadow-lg h-[500px]">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80" 
                alt="Global Collaboration" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Map Side */}
            <div className="flex-[1.5] bg-[#e0f2f1] rounded-[2rem] overflow-hidden shadow-lg border border-lw-border relative min-h-[500px]">
              <iframe 
                src="https://lifewoodworldwidemap.vercel.app/" 
                className="w-full h-full border-none"
                title="Lifewood Worldwide Map"
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PhiPact;
