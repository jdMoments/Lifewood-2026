import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Ballpit from './Ballpit';

const CareersPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen bg-white z-10 overflow-hidden">
      {/* First Section */}
      <div className="relative pt-40 pb-20 px-8 md:px-20">
        {/* Ballpit Background */}
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
          <Ballpit 
            count={100}
            gravity={0.7}
            friction={0.9975}
            wallBounce={0.95}
            followCursor={true}
            colors={[0xffb347, 0x1db954, 0xffffff]}
          />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 min-h-[60vh]">
          {/* Left Section */}
          <div className="flex-1">
            <h1 className="text-6xl md:text-8xl font-bold text-black mb-10 tracking-tight leading-[1.1]">
              {t('careersPage.title').split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {word} {i === 1 ? <br /> : ''}
                </React.Fragment>
              ))}
            </h1>
            
            <div className="flex items-center">
              <button className="flex items-center gap-4 px-8 py-3 bg-[#FFB347] text-black font-semibold rounded-full hover:bg-[#FFA500] transition-all group">
                <span>{t('careersPage.joinUs')}</span>
                <div className="h-[1px] w-8 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex-1 max-w-md">
            <p className="text-[#333] text-lg leading-relaxed">
              {t('careersPage.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Second Section: Image */}
      <div className="max-w-7xl mx-auto mt-20 px-8 md:px-20">
        <div className="w-full aspect-[21/9] overflow-hidden rounded-[3rem] shadow-xl">
          <img 
            src="https://framerusercontent.com/images/DF2gzPqqVW8QGp7Jxwp1y5257xk.jpg?width=6000&height=4000" 
            alt="Team collaboration" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      {/* Third Section: Teams & Values */}
      <div className="max-w-7xl mx-auto mt-40 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-black mb-8">
          It means motivating<br />and growing teams
        </h2>
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-20">
          Teams that can initiate and learn on the run in order to deliver evolving technologies and targets. It's a big challenge, but innovation, especially across borders, has never been the easy path.
        </p>

        {/* Tag Marquee */}
        <div className="space-y-4 mb-40 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {/* Row 1 */}
          <div className="flex gap-4 animate-marquee whitespace-nowrap w-max">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {['Supportive', 'Collaborative', 'Innovative', 'Flexible'].map((tag, j) => (
                  <span key={`${i}-${j}`} className="px-8 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full font-medium text-base border border-[#5A5A40]/10">
                    {tag}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex gap-4 animate-marquee-reverse whitespace-nowrap w-max">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {['Transparent', 'Engaging', 'Diverse', 'Purpose-driven'].map((tag, j) => (
                  <span key={`${i}-${j}`} className="px-8 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full font-medium text-base border border-[#5A5A40]/10">
                    {tag}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
          {/* Row 3 */}
          <div className="flex gap-4 animate-marquee whitespace-nowrap w-max">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {['Balanced (work-life balance)', 'Trustworthy', 'Professional', 'Reliable'].map((tag, j) => (
                  <span key={`${i}-${j}`} className="px-8 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full font-medium text-base border border-[#5A5A40]/10">
                    {tag}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bottom CTA Text */}
        <div className="max-w-5xl mx-auto">
          <p className="text-3xl md:text-4xl font-medium text-black leading-tight">
            If you're looking to turn the page on a new chapter in your career make contact with us today. At Lifewood, the adventure is always before you, it's why we've been described as <span className="text-[#1db954]">"always on, never off."</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;