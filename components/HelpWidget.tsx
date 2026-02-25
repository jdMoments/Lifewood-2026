import React from 'react';
import { motion } from 'framer-motion';

const HelpWidget: React.FC = () => {
  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-full p-1.5 shadow-2xl flex items-center gap-2 border border-black/5"
      >
        {/* Animated Gradient Logo */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#FFB347_0%,#FFD700_30%,#FFB347_50%,#1db954_75%,#FFB347_100%)]"
            style={{ 
              filter: 'blur(0.5px)',
            }}
          />
          {/* Subtle overlay to give it depth */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
          <div className="absolute inset-0 rounded-full border border-black/5" />
        </div>

        {/* Help Button */}
        <button className="bg-black text-white rounded-full px-5 py-2 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="font-bold text-sm whitespace-nowrap">How can I help?</span>
        </button>
      </motion.div>
      
      <div className="mt-2 text-[10px] text-lw-text-muted font-medium flex items-center gap-1">
        <span>Powered by</span>
        <span className="text-lw-text-dark font-bold">ElevenLabs</span>
        <span className="underline cursor-pointer">Agents</span>
      </div>
    </div>
  );
};

export default HelpWidget;
