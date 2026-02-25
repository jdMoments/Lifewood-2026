import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const VisionMission: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'mission' | 'vision'>('mission');
  const [isHovered, setIsHovered] = useState(false);

  const content = {
    mission: {
      title: t('visionMission.mission.title'),
      text: t('visionMission.mission.text'),
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      videoUrl: 'https://www.youtube.com/embed/Cdn9Q_Qo40E?si=aSvkeQK0JReCJxqW&autoplay=1&mute=1&loop=1&playlist=Cdn9Q_Qo40E&controls=0',
    },
    vision: {
      title: t('visionMission.vision.title'),
      text: t('visionMission.vision.text'),
      image: 'https://images.unsplash.com/photo-1516542076529-1ea3854896f2?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      videoUrl: 'https://www.youtube.com/embed/PAFRpRG_3y0?si=U99SmONpHMaRUoz2&autoplay=1&mute=1&loop=1&playlist=PAFRpRG_3y0&controls=0',
    },
  };

  return (
    <section className="bg-lw-bg-base py-28 px-8 md:px-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold text-lw-text-dark text-center mb-8">
          {t('visionMission.heading')}
        </h2>
        <div className="flex justify-center mb-12">
          <div className="bg-lw-bg-card p-1.5 rounded-full flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('mission')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 ${activeTab === 'mission' ? 'bg-lw-green text-white' : 'text-lw-text-muted hover:bg-lw-bg-deep'}`}>
              {t('visionMission.tabs.mission')}
            </button>
            <button
              onClick={() => setActiveTab('vision')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 ${activeTab === 'vision' ? 'bg-lw-green text-white' : 'text-lw-text-muted hover:bg-lw-bg-deep'}`}>
              {t('visionMission.tabs.vision')}
            </button>
          </div>
        </div>

        <div
          className="bg-lw-bg-card rounded-3xl shadow-lg overflow-hidden flex flex-col lg:flex-row relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="lg:w-1/2 relative">
            <img
              src={content[activeTab].image}
              alt={content[activeTab].title}
              className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'brightness-50' : ''}`}
            />
            <div
              className={`absolute inset-0 p-12 md:p-16 flex flex-col justify-center text-white transition-all duration-500 pointer-events-none ${
                isHovered ? 'opacity-100' : 'opacity-0 -translate-x-10'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="w-8 h-0.5 bg-lw-accent mr-3"></div>
                <span className="text-lw-accent font-bold text-sm">{activeTab === 'mission' ? '01' : '02'}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">{content[activeTab].title}</h3>
              <p className="text-white/90 leading-relaxed">
                {content[activeTab].text}
              </p>
            </div>
          </div>
          <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center relative min-h-[400px]">
            <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-0.5 bg-lw-accent mr-3"></div>
                <span className="text-lw-accent font-bold text-sm">{activeTab === 'mission' ? '01' : '02'}</span>
              </div>
              <h3 className="text-3xl font-bold text-lw-text-dark mb-4">{content[activeTab].title}</h3>
              <p className="text-lw-text-body leading-relaxed">
                {content[activeTab].text}
              </p>
            </div>
            <div
              className={`absolute inset-0 p-1 md:p-2 transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <iframe
                className="w-full h-full rounded-2xl"
                src={content[activeTab].videoUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionMission;