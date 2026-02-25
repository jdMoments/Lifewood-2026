import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-[400px] pointer-events-auto border border-black/5"
          >
            <h3 className="text-xl font-bold text-black mb-4">Cookie Settings</h3>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              We use cookies to personalize content, run ads, and analyze traffic.
            </p>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-xl bg-[#f0f0f0] text-black font-semibold hover:bg-[#e5e5e5] transition-colors"
              >
                Reject
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-xl bg-black text-white font-semibold hover:bg-black/90 transition-colors"
              >
                Accept
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CookieSettingsModal;
