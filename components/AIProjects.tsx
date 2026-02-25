import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import ScrollFloat from './ScrollFloat';
import GlareHover from './GlareHover';

const AIProjects: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const projectImages = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop", // 2.1
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop", // 2.2
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop", // 2.3
    "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=2071&auto=format&fit=crop", // 2.4
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop", // 2.5
    "https://framerusercontent.com/images/RIqv6T7aFrp5Q9X85Zqy55KQ8x4.png?scale-down-to=2048&width=1856&height=2464", // 2.6
    "https://framerusercontent.com/images/ad17haYjwUpqxpqARkBZaMKSqmM.png?scale-down-to=1024&width=1856&height=2464", // 2.7
  ];

  return (
    <div className="relative min-h-screen bg-white pt-40 pb-20 px-8 md:px-20 z-10">
      <div className="max-w-7xl mx-auto">
        {/* Decorative Top Element */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-4 rounded-full bg-black"></div>
          <div className="w-4 h-4 rounded-full border border-black bg-white"></div>
          <div className="h-[1px] w-24 border-t border-dashed border-black ml-1"></div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-black mb-10 tracking-tight">
          {t('aiProjectsPage.title')}
        </h1>
        
        <p className="text-[#333] text-lg md:text-xl max-w-5xl leading-relaxed mb-12">
          {t('aiProjectsPage.description')}
        </p>

        <div className="flex items-center gap-3">
          <button className="px-8 py-3 bg-[#FFB347] text-black font-semibold rounded-full hover:bg-[#FFA500] transition-colors">
            {t('nav.contactUs')}
          </button>
          <button className="w-10 h-10 rounded-full bg-[#004D40] flex items-center justify-center text-white hover:bg-[#00332C] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </button>
        </div>

        {/* Second Section: What we currently handle */}
        <div className="mt-32">
          <div className="flex flex-col items-center mb-16">
            <span className="px-4 py-1 bg-black text-white text-xs font-bold rounded-full mb-4 uppercase tracking-widest">
              Projects
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black text-center">
              What we currently handle
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left side: Image */}
            <div className="lg:w-1/2 w-full">
              <div className="sticky top-32">
                <GlareHover 
                  borderRadius="2rem" 
                  glareOpacity={0.4} 
                  className="shadow-2xl"
                >
                  <img 
                    src={openIndex !== null ? projectImages[openIndex] : projectImages[0]} 
                    alt="AI Project Illustration" 
                    className="w-full aspect-[4/5] object-cover transition-all duration-700 ease-in-out"
                    referrerPolicy="no-referrer"
                  />
                </GlareHover>
              </div>
            </div>

            {/* Right side: Accordion */}
            <div className="lg:w-1/2 w-full">
              <ProjectAccordion openIndex={openIndex} setOpenIndex={setOpenIndex} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProjectAccordionProps {
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
}

const ProjectAccordion: React.FC<ProjectAccordionProps> = ({ openIndex, setOpenIndex }) => {

  const projects = [
    {
      id: "2.1",
      title: "AI Data Extraction",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
          <path d="M3 12A9 3 0 0 0 21 12"></path>
        </svg>
      ),
      description: "Using AI, we optimize the acquisition of image and text from multiple sources. Techniques include onsite scanning, drone photography, negotiation with archives and the formation of alliances with corporations, religious organizations and governments."
    },
    {
      id: "2.2",
      title: "Machine Learning Enablement",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4"></path>
          <path d="m16.2 7.8 2.9-2.9"></path>
          <path d="M18 12h4"></path>
          <path d="m16.2 16.2 2.9 2.9"></path>
          <path d="M12 18v4"></path>
          <path d="m4.9 19.1 2.9-2.9"></path>
          <path d="M2 12h4"></path>
          <path d="m4.9 4.9 2.9 2.9"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      description: "Empowering machine learning models with high-quality, diverse datasets. We provide end-to-end support for model training, validation, and deployment across various industries."
    },
    {
      id: "2.3",
      title: "Autonomous Driving Technology",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>
      ),
      description: "Specialized data solutions for the automotive industry, including complex scene annotation, sensor fusion data processing, and safety-critical edge case identification."
    },
    {
      id: "2.4",
      title: "AI-Enabled Customer Service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 9h.01"></path>
          <path d="M12 9h.01"></path>
          <path d="M16 9h.01"></path>
        </svg>
      ),
      description: "Transforming customer interactions with AI-driven support systems. We provide the linguistic and behavioral data necessary to build empathetic and efficient virtual assistants."
    },
    {
      id: "2.5",
      title: "Natural Language Processing and Speech Acquisition",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6"></path>
          <path d="m4 14 6-6 2-3"></path>
          <path d="M2 5h12"></path>
          <path d="M7 2h1"></path>
          <path d="m22 22-5-10-5 10"></path>
          <path d="M14 18h6"></path>
        </svg>
      ),
      description: "Comprehensive multilingual data services for NLP and speech recognition. Our global network ensures high-fidelity data collection across 50+ languages and dialects."
    },
    {
      id: "2.6",
      title: "Computer Vision (CV)",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 8v8"></path>
          <path d="M8 12h8"></path>
        </svg>
      ),
      description: "Training Al to see and understand the world requires a high volume of quality training data. Lifewood provides total data solutions for your CV development from collection to annotation to classification and more, for video and image datasets enabling machines to interpret visual information. We have experience in a wide variety of applications including autonomous vehicles, farm monitoring, face recognition and more."
    },
    {
      id: "2.7",
      title: "Genealogy",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
          <path d="M9 20c0-1.5-1-2.5-1-2.5s-1 1-1 2.5"></path>
          <path d="M17 20c0-1.5-1-2.5-1-2.5s-1 1-1 2.5"></path>
          <path d="M12 20c0-1.5-1-2.5-1-2.5s-1 1-1 2.5"></path>
          <path d="M12 12V3"></path>
          <path d="M12 3c0 1.5-1 2.5-1 2.5s-1-1-1-2.5"></path>
          <path d="M12 3c0 1.5 1 2.5 1 2.5s 1-1 1-2.5"></path>
        </svg>
      ),
      description: (
        <div className="space-y-4">
          <p>
            Powered by Al, Lifewood processes genealogical material at speed and scale, to conserve and illuminate family histories, national archives, corporate lists and records of all types. Lifewood has more than 18 years of experience capturing, scanning and processing genealogical data. In fact, Lifewood started with genealogy data as its core business, so that over the years we have accumulated vast knowledge in diverse types of genealogy indexing.
          </p>
          <p>
            We have worked with all the major genealogy companies and have extensive experience in transcribing and indexing genealogical content in a wide variety of formats, including tabular, pre-printed forms and paragraph-style records.
          </p>
          <p>
            Working across borders, with offices on every continent, our ability with multi-language projects has built an extensive capability spanning more than 50 languages and associated dialects. Now, powered by Al and the latest inter-office communication systems, we are transforming ever more efficient ways to service our clients, while keeping humanity at the centre of our activity.
          </p>
          <div>
            <p className="font-bold mb-2">Genealogical material that we have experience with includes:</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc pl-5">
              <li>Census</li>
              <li>Vital - BMD</li>
              <li>Church and Parish Registers</li>
              <li>Passenger Lists</li>
              <li>Naturalisation</li>
              <li>Military Records</li>
              <li>Legal Records</li>
              <li>Yearbooks</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="border-t border-black/10">
      {projects.map((project, index) => (
        <div key={project.id} className="border-bottom border-black/10">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full py-6 flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="text-black opacity-60 group-hover:opacity-100 transition-opacity">
                {project.icon}
              </div>
              <span className="text-xl font-medium text-black">
                {project.id} {project.title}
              </span>
            </div>
            <div className="text-black">
              {openIndex === index ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              )}
            </div>
          </button>
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-[800px] pb-8' : 'max-h-0'}`}
          >
            <div className="text-gray-600 text-lg leading-relaxed pl-[4.5rem] pr-8">
              {project.description}
            </div>
          </div>
          <div className="h-[1px] w-full bg-black/10"></div>
        </div>
      ))}
    </div>
  );
};

export default AIProjects;
