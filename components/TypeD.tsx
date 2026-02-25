import React from 'react';
import { motion } from 'framer-motion';
import Stack from './Stack';

const TypeD: React.FC = () => {
  const approachCards = [
    <img 
      src="https://framerusercontent.com/images/2uF9Ksrf98DxfWsjGrIvBbyRWs.jpeg?scale-down-to=512&width=1456&height=816" 
      alt="Approach 1" 
      className="card-image"
      referrerPolicy="no-referrer"
    />,
    <img 
      src="https://framerusercontent.com/images/ptHrgNDD082Sa0EZcDea0FYhulM.jpeg?scale-down-to=512&width=1600&height=897" 
      alt="Approach 2" 
      className="card-image"
      referrerPolicy="no-referrer"
    />,
    <img 
      src="https://framerusercontent.com/images/1Pnyjmjwo7FWEAoCcEszS2Fngns.jpeg?scale-down-to=512&width=1600&height=897" 
      alt="Approach 3" 
      className="card-image"
      referrerPolicy="no-referrer"
    />
  ];

  return (
    <section className="min-h-screen bg-white dark:bg-[#050a05] pt-40 pb-20 px-8 md:px-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Decorative Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-black dark:bg-[#d4f05c]"></div>
            <div className="w-3 h-3 rounded-full border border-black dark:border-[#d4f05c] -ml-1 bg-white dark:bg-transparent"></div>
          </div>
          <div className="h-[1px] w-24 bg-black/20 dark:bg-white/20 border-t border-dashed border-black dark:border-white/40"></div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold text-black dark:text-white mb-10 leading-tight">
            AI Generated Content (AIGC)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed mb-12 max-w-4xl">
            Lifewood's early adoption of AI tools has seen the company rapidly evolve the use of AI generated content, which has been integrated into video production for the company's communication requirements. This has been enormously successful, and these text, voice, image and video skills that comprise AIGC production, combined with more traditional production methods and our story development skills, are now being sought by other companies.
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

        {/* Video Section */}
        <div className="mt-24 w-full">
          <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden shadow-2xl bg-black">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="https://framerusercontent.com/assets/OYykWaWrUmfZYDy3CJnT4GUNL8.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Our Approach Section */}
        <div className="mt-40 mb-40 flex flex-col lg:flex-row items-center justify-between gap-20">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-8">
              Our Approach
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl">
              Our motivation is to express the personality of your brand in a compelling and distinctive way. We specialize in story-driven content, for companies looking to join the communication revolution.
            </p>
          </div>

          <div className="lg:w-1/2 relative h-[500px] w-full flex items-center justify-center">
            <Stack 
              cards={approachCards} 
              randomRotation={true} 
              sensitivity={180} 
              sendToBackOnClick={true}
              autoplay={true}
              autoplayDelay={4000}
            />
          </div>
        </div>

        {/* Cinematic Worlds Section */}
        <div className="mt-40 relative">
          {/* Horizontal Line with Arrow (Desktop Only) */}
          <div className="absolute left-0 top-[65%] w-full h-[1px] bg-gray-100 hidden lg:block">
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-gray-300 rotate-45"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 relative z-10">
            <div className="lg:w-1/3">
              <div className="text-gray-300 mb-8">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <p className="text-2xl md:text-3xl font-medium text-black dark:text-white leading-tight max-w-md text-left">
                We use advanced film, video and editing techniques, combined with generative AI, to create cinematic worlds for your videos, advertisements and corporate communications.
              </p>
            </div>

            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Top Row */}
              <motion.div whileHover={{ y: -10 }} className="md:col-span-4 rounded-[2.5rem] overflow-hidden aspect-square shadow-lg">
                <img src="https://framerusercontent.com/images/8USU1OFCcARiIIvcdJBJlzA8EA4.jpg?scale-down-to=512&width=5184&height=3456" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>
              <motion.div whileHover={{ y: -10 }} className="md:col-span-4 rounded-[2.5rem] overflow-hidden aspect-square shadow-lg">
                <img src="https://framerusercontent.com/images/3CdZeNunHzqH9P7TcEFjG2Imb4.jpg?scale-down-to=1024&width=4000&height=6000" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>
              <motion.div whileHover={{ y: -10 }} className="md:col-span-4 rounded-[2.5rem] overflow-hidden aspect-square shadow-lg">
                <img src="https://framerusercontent.com/images/pW4xMuxSlAXuophJZT96Q4LO0.jpeg?scale-down-to=512&width=800&height=386" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>

              {/* Bottom Row */}
              <motion.div whileHover={{ y: -10 }} className="md:col-span-6 rounded-[2.5rem] overflow-hidden aspect-[16/10] relative shadow-xl">
                <img src="https://framerusercontent.com/images/ifVOmevTJG4uimv3rRPBuoDvYM.jpg?scale-down-to=1024&width=5245&height=7867" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10 text-white max-w-sm">
                  <p className="text-sm font-bold mb-4 flex items-center gap-3">
                    <span className="w-6 h-[1px] bg-white"></span>
                    We can quickly adjust
                  </p>
                  <p className="text-2xl md:text-3xl font-medium leading-tight">
                    the culture and language of your video to suit different world markets.
                  </p>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -10 }} className="md:col-span-3 rounded-[2.5rem] overflow-hidden aspect-square relative shadow-lg">
                <img src="https://framerusercontent.com/images/UZnPJgTru2Os9pqnz20ckvASCI8.jpg?scale-down-to=1024&width=4160&height=6240" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="text-lg font-bold leading-tight">Multiple<br />Languages</p>
                </div>
              </motion.div>

              <div className="md:col-span-3 bg-[#F1F1F1] dark:bg-white/5 rounded-[2.5rem] p-6 flex flex-col justify-center items-center text-center shadow-sm aspect-square">
                <span className="text-5xl font-bold text-black dark:text-white mb-2">100+</span>
                <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">Countries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="mt-60 mb-40 text-center max-w-5xl mx-auto px-6">
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-medium text-black dark:text-white leading-tight mb-16"
          >
            "We understand that your customers spend hours looking at screens: so finding the one, most important thing, on which to build your message is integral to our approach, as we seek to deliver surprise and originality."
          </motion.p>
          <div className="flex items-center justify-center gap-6 text-gray-300">
            <div className="h-[1px] w-12 bg-gray-100"></div>
            <span className="text-xs font-bold tracking-[0.5em] uppercase text-gray-400">Lifewood</span>
            <div className="h-[1px] w-12 bg-gray-100"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TypeD;
