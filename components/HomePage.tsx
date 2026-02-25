import React from 'react';
import Hero from './Hero';
import Ticker from './Ticker';
import About from './About';

import Stats from './Stats';
import Clients from './Clients';
import Innovation from './Innovation';
import AIDataServices from './AIDataServices';
import VisionMission from './VisionMission';
import CTA from './CTA';

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <div className="relative z-20 bg-lw-bg-base dark:bg-[#050a05] transition-colors duration-300">
        <Ticker />
        <About />
        
        <Stats />
        <Clients />
        <Innovation />
        <AIDataServices />
        
        <VisionMission />
        <CTA />
      </div>
    </>
  );
};

export default HomePage;