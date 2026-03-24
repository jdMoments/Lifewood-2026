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
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hasSelectedImage, setHasSelectedImage] = useState(false);
  const revealTextRef = useRef<HTMLDivElement | null>(null);

  const sections = [
    {
      id: '01',
      title: 'Objective',
      desc: 'Scan document for preservation, extract data and structure into database.',
      image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1400&auto=format&fit=crop&q=80',
      label: 'OBJECTIVE'
    },
    {
      id: '02',
      title: 'Key Features',
      desc: 'Features include Auto Crop, Auto De-skew, Blur Detection, Foreign Object Detection, and AI Data Extraction.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&auto=format&fit=crop&q=80',
      label: 'KEY FEATURES'
    },
    {
      id: '03',
      title: 'Results',
      desc: 'Accurate and precise data is ensured through validation and quality assurance. The system is efficient and scalable, enabling fast and adaptable data extraction. It supports multiple languages and formats, allowing the handling of diverse documents. Advanced features include auto-crop, de-skew, blur, and object detection. With AI integration, the solution provides structured data for AI tools and delivers clear, visual, and easy-to-understand results.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&auto=format&fit=crop&q=80',
      label: 'RESULTS'
    }
  ];

  const activeSection = sections[activeIndex];

  useEffect(() => {
    if (!hasSelectedImage || !revealTextRef.current) return;
    gsap.fromTo(
      revealTextRef.current,
      { clipPath: 'inset(0 100% 0 0)', x: -30, opacity: 0 },
      {
        clipPath: 'inset(0 0 0 0)',
        x: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'power3.out'
      }
    );
  }, [activeIndex, hasSelectedImage]);

  const handleSelectImage = (index: number) => {
    setActiveIndex(index);
    setHasSelectedImage(true);
  };

  return (
    <div
      className="relative overflow-hidden rounded-[3rem] min-h-[620px] border border-white/20 shadow-[0_26px_70px_rgba(0,0,0,0.28)]"
      style={{
        backgroundImage: `url(${activeSection.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/75" />

      <div className="relative z-10 p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSelectImage(index)}
                className={`text-left rounded-[1.6rem] overflow-hidden border transition-all duration-500 ${
                  isActive
                    ? 'border-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] -translate-y-1'
                    : 'border-white/30 hover:border-white/70'
                }`}
              >
                <div className="relative h-[190px] md:h-[220px]">
                  <img
                    src={section.image}
                    alt={section.title}
                    className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'scale-105' : 'grayscale-[30%]'}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[11px] tracking-widest uppercase font-bold text-white/75">
                      Image {index + 1}
                    </p>
                    <h4 className="text-white text-xl font-bold leading-tight">{section.title}</h4>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 min-h-[220px] md:min-h-[250px]">
          {hasSelectedImage ? (
            <div
              ref={revealTextRef}
              className="max-w-3xl rounded-[1.8rem] border border-white/25 bg-white/10 backdrop-blur-sm p-6 md:p-8"
            >
              <p className="text-xs tracking-[0.2em] uppercase font-extrabold text-white/75 mb-2">
                {activeSection.id} {activeSection.label}
              </p>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{activeSection.title}</h3>
              <p className="text-white/90 text-base md:text-lg leading-relaxed">{activeSection.desc}</p>
            </div>
          ) : (
            <div className="max-w-3xl rounded-[1.8rem] border border-white/25 bg-white/10 backdrop-blur-sm p-6 md:p-8">
              <p className="text-white/85 text-base md:text-lg font-semibold">
                Click an image to reveal the section details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeritageResearchShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasClickedImage, setHasClickedImage] = useState(false);
  const textRevealRef = useRef<HTMLDivElement | null>(null);

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
    }
  ];

  const activeItem = heritageData[activeIndex];

  useEffect(() => {
    if (!hasClickedImage || !textRevealRef.current) return;
    gsap.fromTo(
      textRevealRef.current,
      { clipPath: 'inset(0 100% 0 0)', x: -42, opacity: 0 },
      {
        clipPath: 'inset(0 0% 0 0)',
        x: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
      }
    );
  }, [activeIndex, hasClickedImage]);

  const handleImageClick = (index: number) => {
    setActiveIndex(index);
    setHasClickedImage(true);
  };

  return (
    <div
      className="mt-28 rounded-[3rem] relative overflow-hidden border border-white/20 shadow-[0_30px_80px_rgba(2,42,36,0.35)]"
      style={{
        backgroundImage: `url(${activeItem.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,42,36,0.88)_0%,rgba(6,62,54,0.78)_45%,rgba(8,14,28,0.82)_100%)]" />
      <div className="absolute -top-16 right-12 w-56 h-56 rounded-full bg-[#FFB347]/25 blur-3xl" />
      <div className="absolute -bottom-20 left-6 w-64 h-64 rounded-full bg-lw-green/25 blur-3xl" />

      <div className="relative z-10 p-8 md:p-12 xl:p-14">
        <div className="max-w-4xl mb-8">
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

        <div className="mb-8 min-h-[170px]">
          {hasClickedImage ? (
            <div
              ref={textRevealRef}
              className="w-full xl:w-[700px] rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5"
            >
              <p className="text-[11px] text-white/65 uppercase tracking-widest font-bold mb-2">
                {activeItem.subtitle}
              </p>
              <h4 className="text-2xl md:text-3xl font-bold text-white">{activeItem.title}</h4>
              <p className="text-sm md:text-base text-white/85 mt-3 leading-relaxed">
                {activeItem.description}
              </p>
            </div>
          ) : (
            <p className="text-white/80 text-sm md:text-base font-medium">
              Click one of the three images below to reveal details.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heritageData.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => handleImageClick(index)}
                className={`text-left group relative rounded-[1.75rem] overflow-hidden border transition-all duration-500 ${
                  isActive
                    ? 'border-white/80 -translate-y-2 shadow-[0_25px_50px_rgba(0,0,0,0.35)]'
                    : 'border-white/25 hover:border-white/60'
                }`}
              >
                <div className="relative h-[240px] md:h-[280px]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      isActive ? 'scale-105 grayscale-0' : 'grayscale-[30%] group-hover:grayscale-0'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className={`absolute top-4 left-4 w-2.5 h-2.5 rounded-full ${item.accent}`} />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[11px] text-white/70 uppercase tracking-widest font-bold">
                      Image {index + 1}
                    </p>
                    <h5 className="text-xl md:text-2xl font-bold text-white">
                      {item.title}
                    </h5>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tads;

