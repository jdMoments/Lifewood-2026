import React from 'react';
import { motion } from 'framer-motion';

const ContactUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-8 md:px-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12">
        
        {/* Left Side: Label */}
        <div className="lg:w-1/3">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block px-4 py-1.5 bg-[#F1F1F1] rounded-full text-sm font-medium text-[#666666]"
          >
            Contact us
          </motion.div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:w-1/2 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] min-h-[500px]"
          >
            {/* Background Image */}
            <img 
              src="https://framerusercontent.com/images/jbg1aNUPAjdSRv4pNOBijvBME.png?width=1800&height=1488" 
              srcSet="https://framerusercontent.com/images/jbg1aNUPAjdSRv4pNOBijvBME.png?scale-down-to=512&width=1800&height=1488 512w, https://framerusercontent.com/images/jbg1aNUPAjdSRv4pNOBijvBME.png?scale-down-to=1024&width=1800&height=1488 1024w, https://framerusercontent.com/images/jbg1aNUPAjdSRv4pNOBijvBME.png?width=1800&height=1488 1800w"
              sizes="max((min(min(100vw, 1968px) - 144px, 1280px) - 64px) / 2, 1px)"
              width="1800"
              height="1488"
              alt="Contact Background" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            
            {/* Dark Overlay/Form Container */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm p-10 md:p-14 flex flex-col justify-center">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-white font-bold text-lg">Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-black/30 border-none rounded-xl px-4 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-white/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-bold text-lg">Email</label>
                  <input 
                    type="email" 
                    className="w-full bg-black/30 border-none rounded-xl px-4 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-white/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-bold text-lg">Message</label>
                  <textarea 
                    rows={4}
                    placeholder="Message here..."
                    className="w-full bg-black/30 border-none rounded-xl px-4 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-white/20 outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#1A2E26] text-white rounded-full font-bold text-lg hover:bg-[#12211B] transition-all shadow-xl"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
