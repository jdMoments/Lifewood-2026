import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Tads: React.FC = () => {
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
        <div className="bg-[#f5f2ed] rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-10 leading-tight">
              Type A -<br />
              Data Servicing
            </h1>
            <p className="text-black text-lg md:text-xl max-w-xl leading-relaxed mb-12">
              End-to-end data services specializing in multi-language datasets, including document capture, data collection and preparation, extraction, cleaning, labeling, annotation, quality assurance, and formatting.
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
            Multi-language genealogy documents, newspapers, and archives to facilitate global ancestry research
          </p>
          <p className="text-lg md:text-xl text-black font-medium">
            QQ Music of over millions non-Chinese songs and lyrics
          </p>
        </div>

        {/* Interactive Accordion Section */}
        <div className="mt-40 mb-40">
          <h2 className="text-2xl font-bold text-black mb-16 tracking-widest uppercase">
            TYPE A- DATA SERVICING
          </h2>

          <DataServicingAccordion />
        </div>
      </div>
    </section>
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

const DataServicingAccordion: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

  const sections = [
    {
      id: '01',
      title: 'Objective',
      desc: 'Scan document for preservation, extract data and structure into database.',
      image: 'https://picsum.photos/seed/scanner-ai/1200/800',
      label: 'OBJECTIVE'
    },
    {
      id: '02',
      title: 'Key Features',
      desc: 'Features include Auto Crop, Auto De-skew, Blur Detection, Foreign Object Detection, and AI Data Extraction.',
      image: 'https://picsum.photos/seed/data-ai/1200/800',
      label: 'KEY FEATURES'
    },
    {
      id: '03',
      title: 'Results',
      desc: 'Accurate and precise data is ensured through validation and quality assurance. The system is efficient and scalable, enabling fast and adaptable data extraction. It supports multiple languages and formats, allowing the handling of diverse documents. Advanced features include auto-crop, de-skew, blur, and object detection. With AI integration, the solution provides structured data for AI tools and delivers clear, visual, and easy-to-understand results.',
      image: 'https://picsum.photos/seed/chart-ai/1200/800',
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
                  <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-xl">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
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

export default Tads;

