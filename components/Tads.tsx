import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Tads: React.FC = () => {
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
        <div className="bg-[#f5f2ed] rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
              alt="Data Servicing Background"
              className="w-full h-full object-cover blur-md scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
          <div className="flex-1 z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-tight">
              Type A -<br />
              Data Servicing
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-xl leading-relaxed mb-12">
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

        {/* Third Section: Global Ancestry Research */} 
        <HeritageResearchShowcase />

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

const HeritageResearchShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const heritageData = [
    {
      title: 'Multi-Language',
      subtitle: 'Cross-border discovery',
      description: 'Documents in different scripts and languages are normalized, translated, and indexed to make family records searchable across regions.',
      image: 'https://media.istockphoto.com/id/480331672/photo/greeting-words-written-into-speech-bubles.webp?a=1&b=1&s=612x612&w=0&k=20&c=zQx0gUsP5KrSIZsyD9sxHhz8W1LiJPPTmAqsj00mLJA=',
      accent: 'bg-lw-green'
    },
    {
      title: 'Genealogy',
      subtitle: 'Lineage reconstruction',
      description: 'Birth, marriage, and migration records are linked into connected family lines, helping researchers trace ancestry with stronger confidence.',
      image: 'https://images.unsplash.com/photo-1701200241941-44c0a4dd0c60?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8R2VuZWFsb2d5fGVufDB8fDB8fHww',
      accent: 'bg-[#FFB347]'
    },
    {
      title: 'Newspapers',
      subtitle: 'Context enrichment',
      description: 'Historical news is processed for names, places, and dates, adding cultural context around families, events, and local histories.',
      image: 'https://images.unsplash.com/photo-1615403916271-e2dbc8cf3bf4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bmV3c3BhcGVyc3xlbnwwfHwwfHx8MA%3D%3D',
      accent: 'bg-emerald-300'
    },
    {
      title: 'Archives',
      subtitle: 'Long-term preservation',
      description: 'Fragile source materials are digitized, quality-checked, and structured for future access by institutions, families, and researchers.',
      image: 'https://plus.unsplash.com/premium_photo-1677567996070-68fa4181775a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXJjaGl2ZXN8ZW58MHx8MHx8fDA%3D',
      accent: 'bg-sky-300'
    }
  ];

  useEffect(() => {
    if (!cardRefs.current.length) return;
    gsap.fromTo(
      cardRefs.current,
      { y: 30, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.12
      }
    );
  }, []);

  useEffect(() => {
    const autoPlay = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heritageData.length);
    }, 4500);

    return () => window.clearInterval(autoPlay);
  }, [heritageData.length]);

  return (
    <div className="mt-28 rounded-[3rem] bg-[linear-gradient(145deg,#022a24_0%,#0b3d35_35%,#111827_100%)] p-8 md:p-12 xl:p-14 relative overflow-hidden">
      <div className="absolute -top-16 right-12 w-56 h-56 rounded-full bg-[#FFB347]/25 blur-3xl" />
      <div className="absolute -bottom-20 left-6 w-64 h-64 rounded-full bg-lw-green/25 blur-3xl" />

      <div className="relative z-10 flex flex-col xl:flex-row gap-8 xl:items-end xl:justify-between mb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/15 text-white text-xs tracking-widest uppercase font-bold mb-4">
            <span>003</span>
            <span>Global Ancestry Intelligence</span>
          </div>
          <h3 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            Multi-language genealogy documents, newspapers, and archives.
          </h3>
          <p className="text-white/75 text-base md:text-lg leading-relaxed">
            Lifewood combines multilingual data operations, archive digitization, and AI extraction workflows to support reliable global ancestry research at scale.
          </p>
        </div>

        <div className="w-full xl:w-[360px] rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-5">
          <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold mb-2">Current Focus</p>
          <h4 className="text-2xl font-bold text-white">{heritageData[activeIndex].title}</h4>
          <p className="text-sm text-[#FFB347] mt-1">{heritageData[activeIndex].subtitle}</p>
          <p className="text-sm text-white/80 mt-3 leading-relaxed">{heritageData[activeIndex].description}</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {heritageData.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.title}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              className={`text-left group relative rounded-[1.75rem] overflow-hidden border transition-all duration-700 ${
                isActive
                  ? 'border-white/70 -translate-y-2 shadow-[0_25px_50px_rgba(0,0,0,0.35)]'
                  : 'border-white/20 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="relative h-[300px]">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    isActive ? 'scale-105 grayscale-0' : 'grayscale-[40%] group-hover:grayscale-0'
                  }`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className={`absolute top-4 left-4 w-2.5 h-2.5 rounded-full ${item.accent}`} />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[11px] text-white/65 uppercase tracking-widest font-bold">{item.subtitle}</p>
                  <h5 className="text-2xl font-bold text-white">{item.title}</h5>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tads;

