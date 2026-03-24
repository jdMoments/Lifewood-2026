import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const TVertical: React.FC = () => {
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
        <div className="rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://media.istockphoto.com/id/2234469926/photo/llm-artificial-intelligence-interface.webp?a=1&b=1&s=612x612&w=0&k=20&c=Ksr5CXPKoUy_XmTbujT8cyVjpiKIhkItxcov30LmYug="
              alt="Vertical LLM Data Background"
              className="w-full h-full object-cover blur-md scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="flex-1 z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
              Type C -<br />
              Vertical LLM Data
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-xl leading-relaxed mb-12">
              AI data solutions across specific industry verticals including autonomous driving data annotation, in-vehicle data collection and specialized data services for industry, enterprise or private LLM.
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

          {/* Draggable 3D Icons Section */}
          <div className="flex-1 relative h-[300px] md:h-[450px] w-full max-w-[600px]">
             <DraggableIcon 
              src="https://framerusercontent.com/images/LFAxsa4CpX7e4qBI72ijOV2sHg.png"
              className="absolute top-[10%] left-[10%] w-[25%] md:w-[35%] aspect-square z-20"
              bounce={true}
            />
            <DraggableIcon 
              src="https://framerusercontent.com/images/Tq3lgO9Qy66CFuDaYW99KQ5xoLM.png"
              className="absolute top-0 right-0 w-[30%] md:w-[40%] aspect-square z-10"
            />
            <DraggableIcon 
              src="https://framerusercontent.com/images/Es0UNVEZFUO6pTmc3NI38eovew.png"
              className="absolute bottom-0 left-[30%] w-[40%] md:w-[50%] aspect-square z-30"
            />
          </div>
        </div>

        {/* Bottom Text Section */}
        <div className="mt-16 space-y-4">
          <p className="text-lg md:text-xl text-black font-medium">
            Autonomous driving and Smart cockpit datasets for Driver Monitoring System
          </p>
          <p className="text-lg md:text-xl text-black font-medium">
            China Merchants Group: Enterprise-grade dataset for building "ShipGPT"
          </p>
        </div>

        {/* Second Section: Accordion */}
        <div className="mt-40 mb-40">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              2D, 3D & 4D Data for Autonomous Driving
            </h2>
            <p className="text-2xl text-gray-400 font-light">
              The leading AI company in autonomous vehicle development
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-1/4">
              <h3 className="text-2xl font-bold text-black tracking-widest uppercase sticky top-32">
                TYPE C - VERTICAL LLM DATA
              </h3>
            </div>
            <div className="lg:w-3/4 w-full">
              <VerticalDataAccordion />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const VerticalDataAccordion: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [revealImage, setRevealImage] = useState<string | null>(null);
  const textRevealRef = useRef<HTMLDivElement | null>(null);
  const backgroundRevealRef = useRef<HTMLDivElement | null>(null);

  const sections = [
    {
      id: '01',
      title: 'Target',
      desc: 'Annotate vehicles, pedestrians, and road objects with 2D & 3D techniques to enable accurate object detection for autonomous driving. Self-driving cars rely on precise visual training to detect, classify, and respond safely in real-world conditions.',
      image: 'https://framerusercontent.com/images/GhKqWw4urSIcFZGZ3kWTXG7c.png?scale-down-to=1024&width=1536&height=1024',
      label: 'TARGET'
    },
    {
      id: '02',
      title: 'Solutions',
      desc: 'Dedicated Process Engineering team for analysis and optimization AI-enhanced workflow with multi-level quality checks Scalable global delivery through crowdsourced workforce managemen',
      image: 'https://framerusercontent.com/images/9KyWAYBvYkUbASCckXa16Fgc.jpg?scale-down-to=1024&width=4032&height=3024',
      label: 'SOLUTIONS'
    },
    {
      id: '03',
      title: 'Results',
      desc: 'Achieved 25% production in Month 1 with 95% accuracy (Target: 90%) and 50% production in Month 2 with 99% accuracy (Target: 95%). Maintained an overall accuracy of 99% with on-time delivery. Successfully expanded operations to Malaysia with 100 annotators and Indonesia with 150 annotators.',
      image: 'https://framerusercontent.com/images/mqqWNbBnY0EOUvSMgGlDain8M.jpg?width=1004&height=591',
      label: 'RESULTS'
    }
  ];

  const selectedIndex = pendingIndex ?? activeIndex;
  const activeSection = sections[activeIndex];

  useEffect(() => {
    if (pendingIndex === null || !revealImage || !backgroundRevealRef.current) return;

    const nextIndex = pendingIndex;
    const revealElement = backgroundRevealRef.current;
    gsap.killTweensOf(revealElement);
    gsap.fromTo(
      revealElement,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0 0 0)',
        duration: 0.78,
        ease: 'power3.out',
        onComplete: () => {
          setActiveIndex(nextIndex);
          setPendingIndex(null);
          setRevealImage(null);
        },
      }
    );
  }, [pendingIndex, revealImage]);

  useEffect(() => {
    if (!textRevealRef.current) return;
    gsap.fromTo(
      textRevealRef.current,
      { clipPath: 'inset(0 100% 0 0)', x: -26, opacity: 0 },
      {
        clipPath: 'inset(0 0 0 0)',
        x: 0,
        opacity: 1,
        duration: 0.72,
        ease: 'power3.out',
      }
    );
  }, [activeIndex]);

  const handleSelectSection = (index: number) => {
    if (index === activeIndex) return;
    setPendingIndex(index);
    setRevealImage(sections[index].image);
  };

  return (
    <div
      className="relative rounded-[3rem] overflow-hidden min-h-[700px] border border-white/20 shadow-[0_28px_80px_rgba(0,0,0,0.25)]"
      style={{
        backgroundImage: `url(${activeSection.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(8,22,38,0.84)_0%,rgba(12,37,57,0.72)_45%,rgba(14,18,27,0.82)_100%)]" />

      {revealImage ? (
        <div
          ref={backgroundRevealRef}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${revealImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : null}

      <div className="relative z-10 p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSelectSection(index)}
                className={`text-left rounded-[1.6rem] overflow-hidden border transition-all duration-500 ${
                  isSelected
                    ? 'border-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] -translate-y-1'
                    : 'border-white/30 hover:border-white/70'
                }`}
              >
                <div className="relative h-[210px] md:h-[250px]">
                  <img
                    src={section.image}
                    alt={section.title}
                    className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'scale-105' : 'grayscale-[35%]'}`}
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
            ref={textRevealRef}
            className="max-w-3xl rounded-[1.8rem] border border-white/25 bg-white/10 backdrop-blur-sm p-6 md:p-8"
          >
            <p className="text-xs tracking-[0.2em] uppercase font-extrabold text-white/75 mb-2">
              {activeSection.id} {activeSection.label}
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{activeSection.title}</h3>
            <p className="text-white/90 text-base md:text-lg leading-relaxed">{activeSection.desc}</p>
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

export default TVertical;
