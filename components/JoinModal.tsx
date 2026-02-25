import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  // Prevent scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.95, y: 70 }}
            animate={{ opacity: 1, scale: 1, y: 50 }}
            exit={{ opacity: 0, scale: 0.95, y: 70 }}
            className="relative w-full max-w-2xl bg-[#F8F5F0] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto cursor-grab active:cursor-grabbing"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-lw-text-dark/50 hover:text-lw-text-dark transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="p-8 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-[#002D21] mb-4">Join Our Team</h2>
                <p className="text-[#4A5568] max-w-md mx-auto leading-relaxed">
                  Apply for an internship and be part of groundbreaking technology projects that are shaping the future.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm border border-black/5">
                <h3 className="text-xl font-bold text-[#002D21] mb-1">Application Form</h3>
                <p className="text-sm text-[#718096] mb-8">Fill out the form below to apply for your preferred project internship.</p>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">First Name *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">Last Name *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">Age</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Degree/Field of Study</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Computer Science, Data Science, Engineering"
                      className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Project Applied For *</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select a project</option>
                      <option value="cv">Computer Vision</option>
                      <option value="nlp">Natural Language Processing</option>
                      <option value="ml">Machine Learning</option>
                      <option value="genealogy">Genealogy Data Processing</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Relevant Experience</label>
                    <textarea 
                      rows={4}
                      placeholder="Describe your relevant experience, projects, skills, or coursework..."
                      className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Resume (PDF, DOC, DOCX)</label>
                    <div className="flex items-center gap-4 p-4 bg-[#F8F5F0] rounded-lg">
                      <input 
                        type="file" 
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-[#002D21] hover:file:bg-gray-50 cursor-pointer w-full"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-[#005C42] text-white rounded-lg font-bold text-lg hover:bg-[#004D37] transition-all shadow-lg shadow-lw-green/20"
                  >
                    Submit Application
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JoinModal;
