import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ChromaGrid, { type ChromaGridItem } from './ChromaGrid';

const DraggableImage: React.FC<{ 
  src: string; 
  alt: string; 
  className: string; 
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  initialX?: number | string;
  initialY?: number | string;
  delay?: number;
}> = ({ src, alt, className, constraintsRef, initialX, initialY, delay = 0 }) => {
  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      whileDrag={{ scale: 1.02, zIndex: 50, cursor: 'grabbing' }}
      initial={{ x: initialX, y: initialY }}
      className={`absolute cursor-grab p-5 ${className}`}
    >
      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay
        }}
        className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </motion.div>
  );
};

const AboutPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const projectManagerTitle = 'Project Manager';
  const projectManagerFramePhoto =
    'https://img.freepik.com/premium-photo/portrait-happy-businesswoman-with-arms-crossed-mockup-confidence-job-digital-agency-advisor-professional-female-tech-startup-project-manager-office-space-with-smile-face_590464-265295.jpg?semt=ais_hybrid&w=740&q=80';
  const twinkyProfilePhoto =
    'https://scontent.fceb2-2.fna.fbcdn.net/v/t39.30808-6/636733726_122231530088358365_7562308527376456388_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=102&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeExUir2oZHU1qcHKsssk3hgH_9MxSRAN34f_0zFJEA3fhKOwZm6AlGESa_A83OeMxyFVUBjhTN7nKYPgLxXKXWl&_nc_ohc=rbOL0ULR9pUQ7kNvwGOEUh9&_nc_oc=AdqirsWF3eVRzuP1Nrdz4nna11fZhJI73hy5xWJ6_ulFSYkf3dAES0-3iVBxCkfWgjw&_nc_zt=23&_nc_ht=scontent.fceb2-2.fna&_nc_gid=l65EphYdGtB9pf4K4fPIBg&_nc_ss=7a32e&oh=00_AfxZco71PsVMyDuZ4dBhl0FSfqz7aVe3GdSrGPwMBGuUlw&oe=69C53A8A';
  const projectManagerContact = 'https://web.facebook.com/twnky.casidsid.2024';
  const teamRoleItems: (ChromaGridItem & {
    backgroundImage: string;
  })[] = [
    {
      title: 'Project Manager',
      borderColor: '#4a5d23',
      gradient: 'linear-gradient(160deg, #f8f8f3, #edf3e2)',
      image: projectManagerFramePhoto,
      hideImage: false,
      backgroundImage: projectManagerFramePhoto,
    },
    {
      title: 'Hackger',
      borderColor: '#1d4d40',
      gradient: 'linear-gradient(160deg, #f7faf3, #e8f1e6)',
      hideImage: true,
      backgroundImage:
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=80'
    },
    {
      title: 'Designer',
      borderColor: '#ffb347',
      gradient: 'linear-gradient(160deg, #fffaf2, #f9efe2)',
      hideImage: true,
      backgroundImage:
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80'
    },
    {
      title: 'Hustler',
      borderColor: '#0e2a1e',
      gradient: 'linear-gradient(160deg, #f5f8f6, #e3ece5)',
      hideImage: true,
      backgroundImage:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80'
    },
    {
      title: 'Tester',
      borderColor: '#2f6a5a',
      gradient: 'linear-gradient(160deg, #f6faf8, #e8f2ec)',
      hideImage: true,
      backgroundImage:
        'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80'
    }
  ];
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number | null>(null);
  const [projectManagerExpanded, setProjectManagerExpanded] = useState(false);
  const projectManagerResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultSectionBackground =
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2200&auto=format&fit=crop';
  const visibleRoleItems = projectManagerExpanded
    ? teamRoleItems.filter((role) => role.title !== projectManagerTitle)
    : teamRoleItems;

  const clearProjectManagerResetTimer = () => {
    if (projectManagerResetTimerRef.current) {
      clearTimeout(projectManagerResetTimerRef.current);
      projectManagerResetTimerRef.current = null;
    }
  };

  const resetToDefaultSecondSection = () => {
    setProjectManagerExpanded(false);
    setSelectedRoleIndex(null);
    clearProjectManagerResetTimer();
  };

  const startProjectManagerResetTimer = () => {
    clearProjectManagerResetTimer();
    projectManagerResetTimerRef.current = setTimeout(() => {
      resetToDefaultSecondSection();
    }, 5000);
  };

  const handleRoleClick = (item: ChromaGridItem) => {
    const clickedIndex = teamRoleItems.findIndex((role) => role.title === item.title);
    if (clickedIndex < 0) {
      return;
    }
    setSelectedRoleIndex(clickedIndex);
    if (item.title === projectManagerTitle) {
      setProjectManagerExpanded(true);
      startProjectManagerResetTimer();
      return;
    }
    setProjectManagerExpanded(false);
    clearProjectManagerResetTimer();
  };

  useEffect(() => {
    return () => {
      clearProjectManagerResetTimer();
    };
  }, []);

  const sectionBackgroundImage =
    projectManagerExpanded
      ? projectManagerFramePhoto
      : selectedRoleIndex === null || teamRoleItems[selectedRoleIndex]?.title === projectManagerTitle
      ? defaultSectionBackground
      : (teamRoleItems[selectedRoleIndex]?.backgroundImage ?? defaultSectionBackground);

  return (
    <section className="relative min-h-screen bg-white pt-40 pb-20 px-8 md:px-20 z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-black"></div>
              <div className="w-3 h-3 rounded-full border border-black -ml-1 bg-white"></div>
            </div>
            <div className="h-[1px] w-24 bg-black/20 border-t border-dashed border-black"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-black mb-8 tracking-tight">
            About our company
          </h1>
          
          <p className="text-[#4a5d23] text-lg md:text-xl max-w-4xl leading-relaxed mb-10">
            While we are motivated by business and economic objectives, we remain committed to our core business beliefs that shape our corporate and individual behaviour around the world.
          </p>

          <button className="flex items-center gap-2 px-6 py-2 bg-[#FFB347] text-black text-sm font-bold rounded-full hover:bg-[#FFA500] transition-colors group">
            Contact Us
            <div className="w-6 h-6 rounded-full bg-[#004D40] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
          </button>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Large Main Image */}
          <div className="lg:col-span-2 rounded-[3rem] overflow-hidden shadow-sm">
            <img 
              src="https://framerusercontent.com/images/sTK6sybbKO4rqkc70E4AtawoRc.jpg?width=2560&height=1440" 
              alt="Team collaborating" 
              className="w-full aspect-[16/9] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Side Image and Text */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[3rem] overflow-hidden shadow-sm aspect-[4/5]">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop" 
                alt="Office collaboration" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-[#4a5d23] mt-4">
              Lets collaborate
            </h3>
          </div>
        </div>

        {/* Team Frames Section */}
        <div
          className="mt-24 rounded-[2.5rem] overflow-hidden relative min-h-[620px] md:min-h-[720px] lg:min-h-[760px] flex items-end"
          onClickCapture={() => {
            if (projectManagerExpanded) {
              startProjectManagerResetTimer();
            }
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${sectionBackgroundImage}-${projectManagerExpanded ? 'expanded' : 'base'}`}
                className="absolute inset-0"
                initial={{ scale: 1.14, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{
                  backgroundImage: `url(${sectionBackgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </AnimatePresence>
          </div>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundColor: projectManagerExpanded ? 'rgba(4, 16, 18, 0.62)' : 'rgba(0, 0, 0, 0.55)'
            }}
            transition={{ duration: 0.85, ease: 'easeInOut' }}
          />
          <div className="relative z-10 w-full h-full px-6 pb-8 pt-20 md:px-10 md:pb-10 md:pt-24 lg:px-16 lg:pb-14 lg:pt-20 flex flex-col justify-between">
            {projectManagerExpanded && (
              <motion.div
                className="max-w-2xl"
                initial={{ opacity: 0, x: -90 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#ffd28a] font-semibold mb-4">
                  Project Manager
                </p>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9]">
                  TWINKY CASIDSID
                </h2>
                <p className="mt-5 text-white/95 text-base md:text-lg leading-relaxed max-w-xl">
                  She is the Project Manager of Wisenergy, leading planning, delivery timelines, and team coordination across each milestone.
                  She keeps cross-functional work aligned, manages risks early, and ensures Wisenergy releases are delivered with consistent quality.
                </p>
                <div className="mt-7 flex items-center gap-5">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/80 overflow-hidden shadow-2xl bg-white/10">
                    <img
                      src={twinkyProfilePhoto}
                      alt="Twinky Casidsid profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <a
                    href={projectManagerContact}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white text-sm md:text-base font-semibold underline underline-offset-4 hover:text-[#ffd28a] transition-colors"
                  >
                    Contact: {projectManagerContact}
                  </a>
                </div>
              </motion.div>
            )}
            <div className="w-full max-w-7xl mx-auto">
              <ChromaGrid
                items={visibleRoleItems}
                className="about-team-grid"
                columns={projectManagerExpanded ? 4 : 5}
                rows={1}
                radius={220}
                damping={0.35}
                fadeOut={0.5}
                activeIndex={!projectManagerExpanded ? (selectedRoleIndex ?? undefined) : undefined}
                onItemClick={handleRoleClick}
              />
            </div>
          </div>
        </div>

        {/* Core Value Section */}
        <div className="mt-40 grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-10 flex items-center gap-4">
              CORE <span className="bg-[#FFB347] px-4 py-1">VALUE</span>
            </h2>
            <p className="text-black text-lg md:text-xl leading-relaxed max-w-lg">
              At Lifewood we empower our company and our clients to realise the transformative power of AI: Bringing big data to life, launching new ways of thinking, innovating, learning, and doing.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { 
                letter: 'D', 
                title: 'DIVERSITY', 
                desc: 'We celebrate differences in belief, philosophy and ways of life, because they bring unique perspectives and ideas that encourage everyone to move forward.' 
              },
              { 
                letter: 'C', 
                title: 'CARING', 
                desc: 'We care for every person deeply and equally, because without care work becomes meaningless.' 
              },
              { 
                letter: 'I', 
                title: 'INNOVATION', 
                desc: 'Innovation is at the heart of all we do, enriching our lives and challenging us to continually improve ourselves and our service.' 
              },
              { 
                letter: 'I', 
                title: 'INTEGRITY', 
                desc: 'We are dedicated to act ethically and sustainably in everything we do. More than just the bare minimum. It is the basis of our existence as a company.' 
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-8 group">
                <div className="relative w-24 h-24 bg-[#0e2a1e] flex items-center justify-center text-white text-5xl font-bold overflow-hidden transition-colors duration-500 group-hover:bg-[#FFB347]">
                  {item.letter}
                  {/* Glare Effect */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full skew-x-[-25deg] group-hover:animate-[glare_0.6s_ease-in-out]" />
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#4a5d23]"></div>
                    <span className="text-xs font-bold tracking-widest text-[#4a5d23] bg-[#f5f5f0] px-2 py-0.5">{item.title}</span>
                  </div>
                  <p className="text-sm text-black leading-relaxed border-t border-black/10 pt-2">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="mt-40 mb-40">
          <h2 className="text-4xl md:text-5xl font-bold text-black text-center mb-20">
            What drives us today, and what inspires us for tomorrow
          </h2>

          <MissionVisionTabs />
        </div>

        {/* 4th Section: Logo and Floating Images */}
        <div className="mt-60 mb-60 relative">
          <div className="flex flex-col items-center mb-32">
            <img
              src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429"
              alt="Lifewood Logo"
              className="h-16 w-auto mb-4"
            />
            <p className="text-gray-500 uppercase tracking-[0.3em] text-sm font-medium">Be Amazed</p>
          </div>

          <div ref={containerRef} className="relative h-[1800px] max-w-6xl mx-auto">
            {/* Set 1: Staggered Layout 1 */}
            <DraggableImage
              src="https://framerusercontent.com/images/4hASBG5DwObUZ6HSxm1j5gic.jpeg?scale-down-to=1024&width=853&height=1280"
              alt="Heritage"
              className="top-0 left-[5%] w-1/3"
              constraintsRef={containerRef}
              delay={0}
            />

            <DraggableImage
              src="https://framerusercontent.com/images/iCuv1hnq9hAalYZSbiXDKScy31M.jpg?scale-down-to=512&width=2560&height=1707"
              alt="AI Brain"
              className="top-[350px] left-[35%] w-1/3"
              constraintsRef={containerRef}
              delay={1}
            />

            <DraggableImage
              src="https://framerusercontent.com/images/VDjJLyomenB1LFHPI6jBfB068.png?scale-down-to=1024&width=2268&height=3402"
              alt="Self-driving car"
              className="top-[500px] right-[5%] w-1/3"
              constraintsRef={containerRef}
              delay={2}
            />

            {/* Set 2: Staggered Layout 2 */}
            <DraggableImage
              src="https://framerusercontent.com/images/KNYITojpSxAW0RVdzBr8gV0gxg.jpg?scale-down-to=512&width=3000&height=3000"
              alt="Abstract AI"
              className="top-[1000px] left-[10%] w-1/4"
              constraintsRef={containerRef}
              delay={0.5}
            />

            <DraggableImage
              src="https://framerusercontent.com/images/cMKEugcBZTYApEhuh47taqgdc8Q.jpg?scale-down-to=512&width=612&height=422"
              alt="Collaboration"
              className="top-[1000px] right-[10%] w-1/3"
              constraintsRef={containerRef}
              delay={1.5}
            />

            <DraggableImage
              src="https://framerusercontent.com/images/5W3fKf5FwyglyFVBHEXLuqopg.png?scale-down-to=1024&width=1536&height=1024"
              alt="Tech Workspace"
              className="top-[1350px] left-[25%] w-[45%]"
              constraintsRef={containerRef}
              delay={2.5}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const MissionVisionTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision'>('mission');

  const content = {
    mission: {
      title: "Our Mission",
      desc: "To develop and deploy cutting edge Al technologies that solve real-world problems, empower communities, and advance sustainable practices. We are committed to fostering a culture of innovation, collaborating with stakeholders across sectors, and making a meaningful impact on society and the environment.",
      image: "https://framerusercontent.com/images/pqtsyQSdo9BC1b4HN1mpIHnwAA.png?width=2780&height=1552"
    },
    vision: {
      title: "Our Vision",
      desc: "To be the global champion in Al data solutions, igniting a culture of innovation and sustainability that enriches lives and transforms communities worldwide.",
      image: "https://framerusercontent.com/images/bkXSwutgFfDhSf6t2tQyzrIppzM.jpg?scale-down-to=512&width=1200&height=1200"
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Left: Image */}
      <div className="rounded-[3rem] overflow-hidden shadow-sm h-[400px] lg:h-auto">
        <img 
          src={content[activeTab].image} 
          alt={content[activeTab].title} 
          className="w-full h-full object-cover transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Right: Tabs and Content */}
      <div className="flex flex-col">
        {/* Tab Switcher */}
        <div className="flex mb-0 ml-auto w-full max-w-md">
          <button 
            onClick={() => setActiveTab('mission')}
            className={`flex-1 py-4 text-sm font-bold rounded-t-[2rem] transition-all duration-300 ${activeTab === 'mission' ? 'bg-[#0e2a1e] text-white' : 'bg-transparent text-black hover:bg-black/5'}`}
          >
            Mission
          </button>
          <button 
            onClick={() => setActiveTab('vision')}
            className={`flex-1 py-4 text-sm font-bold rounded-t-[2rem] transition-all duration-300 ${activeTab === 'vision' ? 'bg-[#0e2a1e] text-white' : 'bg-transparent text-black hover:bg-black/5'}`}
          >
            Vision
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-[#f5f2ed] p-10 md:p-16 rounded-b-[3rem] rounded-tl-[3rem] flex-1 flex flex-col justify-center">
          <h3 className="text-3xl md:text-4xl font-bold text-[#0e2a1e] mb-8">
            {content[activeTab].title}
          </h3>
          <p className="text-[#0e2a1e] text-lg md:text-xl leading-relaxed">
            {content[activeTab].desc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
