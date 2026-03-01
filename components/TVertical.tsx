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
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

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

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[700px] items-stretch">
      {sections.map((section, index) => {
        const isActive = hoveredIndex === index;
        return (
          <div
            key={section.id}
            onMouseEnter={() => setHoveredIndex(index)}
            onClick={() => setHoveredIndex(index)}
            className={`relative overflow-hidden group cursor-pointer border-b lg:border-b-0 lg:border-l border-black/10 first:border-l-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? 'flex-[10] lg:flex-[5] min-h-[400px] lg:min-h-0' : 'flex-[1] lg:flex-[0.5] min-h-[80px] lg:min-h-0'}`}
          >
            {isActive ? (
              <div className="flex flex-col lg:flex-row h-full w-full p-6 md:p-8 lg:p-12 gap-6 md:gap-12 items-center">
                <div className="w-full lg:w-1/3 space-y-4 md:space-y-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-black">{section.title}</h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">{section.desc}</p>
                </div>
                <div className="flex-1 relative h-[300px] lg:h-full w-full">
                  <div className="absolute inset-0 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Number Overlay */}
                    <div className="absolute bottom-0 right-0 bg-white p-6 md:p-10 rounded-tl-[2rem] md:rounded-tl-[3rem] flex flex-col items-end">
                      <span className="text-5xl md:text-7xl font-bold text-black leading-none">{section.id}</span>
                      <span className="text-sm md:text-base font-bold text-black mt-2">{section.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex flex-row lg:flex-col items-center justify-between lg:justify-start p-6 lg:pt-12 gap-4 lg:gap-12">
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 -rotate-45 lg:rotate-0">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </div>
                <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-6">
                  <span className="text-3xl lg:text-5xl font-bold text-gray-200">{section.id}</span>
                  <div className="lg:[writing-mode:vertical-lr] lg:rotate-180 text-xs lg:text-base font-bold tracking-[0.2em] lg:tracking-[0.4em] text-gray-300 whitespace-nowrap uppercase">
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

export default TVertical;
