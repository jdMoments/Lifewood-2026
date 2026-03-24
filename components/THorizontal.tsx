import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const THorizontal: React.FC = () => {
  return (
    <section className="min-h-screen bg-white pt-40 pb-20 px-8 md:px-20">
      <div className="mx-auto">
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
          className="rounded-[32px] relative overflow-hidden flex flex-col lg:flex-row items-start justify-between gap-10 w-full bg-cover bg-center"
          style={{ 
            padding: '90px 64px 64px',
            height: 'min-content'
          }}
        >
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1558494949-2412e4232d78?q=80&w=2070&auto=format&fit=crop"
              alt="Horizontal LLM Data Background"
              className="w-full h-full object-cover blur-md scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="flex-1 z-10 max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight tracking-tight">
              Type B -<br />
              Horizontal LLM Data
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-xl leading-relaxed mb-12">
              Comprehensive AI data solutions that cover the entire spectrum from data collection and annotation to model testing. Creating multimodal datasets for deep learning, large language models.
            </p>

            <a href="#/contact" className="relative inline-flex items-center group transition-all no-underline">
              <span className="px-8 pr-14 py-3 bg-[#FFB347] text-black font-semibold rounded-full transition-all duration-300 group-hover:pr-12 group-hover:bg-[#FFA500]">
                Contact Us
              </span>
              <span className="absolute right-2 w-9 h-9 bg-[#FFD082] text-black rounded-full flex items-center justify-center transition-all duration-300 translate-x-1 group-hover:translate-x-0 group-hover:bg-[#FFB347]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </a>
          </div>

          <div className="flex-1 relative h-[400px] w-full max-w-[500px]">
             <DraggableIcon 
              src="https://framerusercontent.com/images/LFAxsa4CpX7e4qBI72ijOV2sHg.png"
              className="absolute top-0 left-0 w-40 h-40 z-20"
              bounce={true}
            />
            <DraggableIcon 
              src="https://framerusercontent.com/images/Tq3lgO9Qy66CFuDaYW99KQ5xoLM.png"
              className="absolute top-0 right-0 w-48 h-48 z-10"
            />
            <DraggableIcon 
              src="https://framerusercontent.com/images/Es0UNVEZFUO6pTmc3NI38eovew.png"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-56 z-30"
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
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hiddenChoiceIndex, setHiddenChoiceIndex] = useState<number | null>(null);
  const revealTextRef = useRef<HTMLDivElement | null>(null);
  const restoreTimerRef = useRef<number | null>(null);

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

  const activeSection = sections[activeIndex];
  const visibleChoices = sections
    .map((section, index) => ({ ...section, index }))
    .filter((item) => item.index !== hiddenChoiceIndex);

  useEffect(() => {
    if (!revealTextRef.current) return;
    gsap.fromTo(
      revealTextRef.current,
      { clipPath: 'inset(0 100% 0 0)', x: -34, opacity: 0 },
      {
        clipPath: 'inset(0 0 0 0)',
        x: 0,
        opacity: 1,
        duration: 0.72,
        ease: 'power3.out',
      }
    );
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      if (restoreTimerRef.current) {
        window.clearTimeout(restoreTimerRef.current);
      }
    };
  }, []);

  const handleSelectChoice = (index: number) => {
    setActiveIndex(index);
    setHiddenChoiceIndex(index);

    if (restoreTimerRef.current) {
      window.clearTimeout(restoreTimerRef.current);
    }

    restoreTimerRef.current = window.setTimeout(() => {
      setHiddenChoiceIndex(null);
      restoreTimerRef.current = null;
    }, 5000);
  };

  return (
    <div
      className="relative rounded-[3rem] overflow-hidden min-h-[620px] border border-white/20 shadow-[0_26px_70px_rgba(0,0,0,0.24)]"
      style={{
        backgroundImage: `url(${activeSection.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(3,26,43,0.86)_0%,rgba(6,42,69,0.74)_45%,rgba(12,18,27,0.82)_100%)]" />

      <div className="relative z-10 p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleChoices.map((section) => {
            const isActive = section.index === activeIndex;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSelectChoice(section.index)}
                className={`text-left rounded-[1.6rem] overflow-hidden border transition-all duration-500 ${
                  isActive
                    ? 'border-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] -translate-y-1'
                    : 'border-white/30 hover:border-white/70'
                }`}
              >
                <div className="relative h-[200px] md:h-[230px]">
                  <img
                    src={section.image}
                    alt={section.title}
                    className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'scale-105' : 'grayscale-[30%]'}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[11px] tracking-widest uppercase font-bold text-white/75">Image {section.id}</p>
                    <h4 className="text-white text-xl font-bold leading-tight">{section.title}</h4>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <div
            ref={revealTextRef}
            className="max-w-3xl rounded-[1.8rem] border border-white/25 bg-white/10 backdrop-blur-sm p-6 md:p-8"
          >
            <p className="text-xs tracking-[0.2em] uppercase font-extrabold text-white/75 mb-2">
              {activeSection.id} {activeSection.label}
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{activeSection.title}</h3>
            <p className="text-white/90 text-base md:text-lg leading-relaxed">{activeSection.desc}</p>
            <p className="text-xs md:text-sm text-white/70 mt-4">
              Clicked image is hidden from choices and returns after 5 seconds of no click.
            </p>
          </div>
        </div>
      </div>
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

