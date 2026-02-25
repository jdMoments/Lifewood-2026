import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const THorizontal: React.FC = () => {
  return (
    <section className="min-h-screen bg-white pt-40 pb-20 px-8 md:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Decorative Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-black"></div>
            <div className="w-3 h-3 rounded-full border border-black -ml-1 bg-white"></div>
          </div>
          <div className="h-[1px] w-24 bg-black/20 border-t border-dashed border-black"></div>
        </div>

        {/* Main Content Card */}
        <div 
          className="rounded-[32px] relative overflow-hidden flex flex-col lg:flex-row items-start justify-between gap-10 w-full"
          style={{ 
            backgroundColor: 'rgb(245, 238, 219)',
            padding: '90px 64px 64px',
            height: 'min-content'
          }}
        >
          <div className="flex-1 z-10 max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-10 leading-tight tracking-tight">
              Type B -<br />
              Horizontal LLM Data
            </h1>
            <p className="text-black text-lg md:text-xl max-w-xl leading-relaxed mb-12 opacity-80">
              Comprehensive AI data solutions that cover the entire spectrum from data collection and annotation to model testing. Creating multimodal datasets for deep learning, large language models.
            </p>

            <button className="flex items-center gap-2 px-8 py-3 bg-[#FFB347] text-black text-sm font-bold rounded-full hover:bg-[#FFA500] transition-colors group">
              Contact Us
              <div className="w-8 h-8 rounded-full bg-[#004D40] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </button>
          </div>

          {/* Draggable 3D Icons Section - Spread out across the wide card */}
          <div className="absolute inset-0 pointer-events-none">
             <DraggableIcon 
              src="https://framerusercontent.com/images/LFAxsa4CpX7e4qBI72ijOV2sHg.png"
              className="absolute top-[10%] left-[35%] w-40 h-40 z-20 pointer-events-auto"
              bounce={true}
            />
            <DraggableIcon 
              src="https://framerusercontent.com/images/Tq3lgO9Qy66CFuDaYW99KQ5xoLM.png"
              className="absolute top-[15%] right-[5%] w-48 h-48 z-10 pointer-events-auto"
            />
            <DraggableIcon 
              src="https://framerusercontent.com/images/Es0UNVEZFUO6pTmc3NI38eovew.png"
              className="absolute bottom-[15%] left-[40%] w-56 h-56 z-30 pointer-events-auto"
            />
          </div>
        </div>

        {/* Bottom Text Section */}
        <div className="mt-16 space-y-4">
          <p className="text-lg md:text-xl text-black font-medium">
            Voice, image and text for Apple Intelligence
          </p>
          <p className="text-lg md:text-xl text-black font-medium">
            Provided over 50 language sets
          </p>
        </div>

        {/* Interactive Accordion Section */}
        <div className="mt-40 mb-40">
          <h2 className="text-2xl font-bold text-black mb-16 tracking-widest uppercase">
            TYPE B: AI DATA PROJECT (AUDIO)
          </h2>

          <HorizontalAccordion />
        </div>
      </div>
    </section>
  );
};

const HorizontalAccordion: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

  const sections = [
    {
      id: '01',
      title: 'Target',
      desc: 'Capture and transcribe recordings from native speakers from 23 different countries (Netherlands, Spain, Norway, France, Germany, Poland, Russia, Italy, Japan, South Korea, Mexico, UAE, Saudi Arabia, Egypt, etc.). Voice content involves 6 project types and 9 data domains A total of 25,400 valid hours durations',
      image: 'https://framerusercontent.com/images/2GAiSbiawE1R7sXuFDwNLfEovRM.jpg',
      label: 'TARGET'
    },
    {
      id: '02',
      title: 'Solutions',
      desc: '30,000+ native speaking human resources from more than 30 countries were mobilized. Use our flexible industrial processes and continuously optimize them. Use PBI to track the progress of daily collection and transcription in real time, analyze and improve the results in real time.',
      image: 'https://framerusercontent.com/images/AtSZKyVin3X5lENphObnH6Puw.jpg',
      label: 'SOLUTIONS'
    },
    {
      id: '03',
      title: 'Results',
      desc: '5 months to complete the voice collection and annotation of 25,400 valid hours on time and with quality',
      image: 'https://framerusercontent.com/images/prEubFztlVx6VnuokfOrkAs.jpg',
      label: 'RESULTS'
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px] items-stretch">
      {sections.map((section, index) => {
        const isActive = hoveredIndex === index;
        return (
          <div
            key={section.id}
            onMouseEnter={() => setHoveredIndex(index)}
            className={`relative overflow-hidden group cursor-pointer border-l border-black/10 first:border-l-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? 'flex-[4]' : 'flex-[0.5]'}`}
          >
            {isActive ? (
              <div className="flex flex-col lg:flex-row h-full w-full p-8 gap-8 items-center">
                <div className="w-full lg:w-1/3 space-y-6">
                  <h3 className="text-3xl font-bold text-black">{section.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{section.desc}</p>
                </div>
                <div className="flex-1 relative h-full w-full">
                  <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-xl group/img">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Glare Effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/img:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    </div>
                    {/* Number Overlay */}
                    <div className="absolute bottom-0 right-0 bg-white p-8 rounded-tl-[3rem] flex flex-col items-end">
                      <span className="text-6xl font-bold text-black leading-none">{section.id}</span>
                      <span className="text-sm font-bold text-black mt-2">{section.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-start pt-10 gap-8">
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 -rotate-45">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <span className="text-4xl font-bold text-gray-300">{section.id}</span>
                  <div className="[writing-mode:vertical-lr] rotate-180 text-sm font-bold tracking-[0.3em] text-gray-400 whitespace-nowrap">
                    {section.label}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DraggableIcon: React.FC<{ src: string; className: string; bounce?: boolean }> = ({ src, className, bounce }) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (bounce && iconRef.current) {
      gsap.to(iconRef.current, {
        y: -15,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }
  }, [bounce]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
    
    if (bounce && iconRef.current) {
      gsap.killTweensOf(iconRef.current);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !iconRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;
      
      gsap.set(iconRef.current, { x: dx, y: dy });
    };

    const handleMouseUp = () => {
      if (!isDragging || !iconRef.current) return;
      setIsDragging(false);
      
      // Snap back
      gsap.to(iconRef.current, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
        onComplete: () => {
          if (bounce && iconRef.current) {
            gsap.to(iconRef.current, {
              y: -15,
              duration: 1.5,
              repeat: -1,
              yoyo: true,
              ease: "power1.inOut"
            });
          }
        }
      });
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, bounce]);

  return (
    <div 
      ref={iconRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className={`${className} cursor-grab active:cursor-grabbing select-none`}
    >
      <img
        src={src}
        alt="3D Icon"
        className="w-full h-full object-contain pointer-events-none"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default THorizontal;

