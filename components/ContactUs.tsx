import React from 'react';
import { motion, useDragControls } from 'framer-motion';

const ContactUs: React.FC = () => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  return (
    <div 
      ref={sectionRef}
      className="relative min-h-screen pt-32 pb-20 px-8 md:px-20 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&fit=crop)' }}
    >
      {/* Dark overlay for the earthy/green vibe */}
      <div className="absolute inset-0 bg-[#2D3627]/40 backdrop-blur-sm z-0"></div>
      
      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12 z-10">
        
        {/* Left Side: Label */}
        <div className="lg:w-1/3">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ 
              backgroundColor: "#FFB347",
              color: "#000000",
              borderColor: "transparent",
              scale: 1.05
            }}
            className="inline-block px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold text-white cursor-pointer transition-all duration-300 shadow-lg"
          >
            Contact us
          </motion.div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:w-1/2 w-full">
          <motion.div 
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={sectionRef}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileDrag={{ scale: 1.01, zIndex: 50 }}
            className="relative rounded-[3rem] shadow-2xl min-h-[700px] flex flex-col group bg-black/30 backdrop-blur-2xl border border-white/10"
            style={{ 
              resize: 'both',
              overflow: 'hidden',
              maxWidth: '100%',
              minWidth: '320px'
            }}
          >
            {/* Drag Handle Bar */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="h-10 w-full flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Form Container */}
            <div className="flex-1 px-12 md:px-16 py-12 flex flex-col justify-center h-full w-full overflow-y-auto">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-3">
                  <label className="text-white font-bold text-base ml-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#44493D]/60 border-none rounded-full px-6 py-4 text-white placeholder-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-white font-bold text-base ml-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full bg-[#44493D]/60 border-none rounded-full px-6 py-4 text-white placeholder-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-white font-bold text-base ml-1">Message</label>
                  <textarea 
                    rows={5}
                    placeholder="Message here..."
                    className="w-full bg-[#44493D]/60 border-none rounded-[2rem] px-6 py-5 text-white placeholder-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-[#14261F] text-white rounded-full font-bold text-lg hover:bg-[#0D1A15] transition-all shadow-2xl border border-white/5"
                  >
                    Send Message
                  </button>
                </div>
              </form>

              {/* Resize Handle Indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="21" x2="9" y2="21" />
                  <line x1="21" y1="21" x2="21" y2="9" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
