import React from 'react';
import CountUp from './CountUp';

const OfficesPage: React.FC = () => {
  return (
    <section id="offices" className="relative min-h-screen pt-40 pb-20 px-8 md:px-20 z-10 overflow-hidden">
      {/* Background Image with Blur */}
      <div className="absolute inset-0 -z-10">
        <img 
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80" 
          alt="" 
          className="w-full h-full object-cover blur-xl scale-110 opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white" />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1a3a3a] leading-tight max-w-2xl">
            Largest Global Data Collection Resources Distribution
          </h1>
          
          {/* Decorative Circular Text */}
          <div className="relative hidden md:block mr-20">
            <div className="w-32 h-32 relative animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path
                  id="circlePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text className="text-[10px] font-medium uppercase tracking-[0.2em] fill-gray-600">
                  <textPath href="#circlePath">
                    be amazed • be amazed • be amazed • 
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#FFB347] border-4 border-white shadow-sm"></div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
                <path d="M10 0V38M10 38L4 32M10 38L16 32" stroke="#FFB347" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Map Container */}
          <div className="flex-[2] bg-[#e0f2f1] rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative min-h-[500px]">
            <iframe 
              src="https://lifewoodworldwidemap.vercel.app/" 
              className="w-full h-full border-none"
              title="Lifewood Worldwide Map"
              allow="fullscreen"
            />
          </div>

          {/* Stats Card */}
          <div className="flex-1 bg-[#FFB347] rounded-[2rem] p-10 flex flex-col justify-center gap-10 text-[#1a3a3a] shadow-lg">
            <div>
              <div className="text-5xl font-bold mb-2">
                <CountUp to={56788} separator="," duration={2.5} />
              </div>
              <div className="text-lg font-medium opacity-80 uppercase tracking-wider">Online Resources</div>
              <div className="h-[1px] w-full bg-[#1a3a3a]/20 mt-6"></div>
            </div>
            
            <div>
              <div className="text-5xl font-bold mb-2">
                <CountUp to={30} duration={2} /> +
              </div>
              <div className="text-lg font-medium opacity-80 uppercase tracking-wider">Countries</div>
              <div className="h-[1px] w-full bg-[#1a3a3a]/20 mt-6"></div>
            </div>

            <div>
              <div className="text-5xl font-bold mb-2">
                <CountUp to={40} duration={2} /> +
              </div>
              <div className="text-lg font-medium opacity-80 uppercase tracking-wider">Centers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfficesPage;