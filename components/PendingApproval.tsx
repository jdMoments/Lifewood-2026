import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const PendingApproval: React.FC = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-[#d4f05c]/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4f05c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-black">Pending Approval</h1>
        <p className="text-gray-500 mb-8">
          Hello <span className="font-bold text-black">{user?.email}</span>, your account has been created successfully but it requires administrator approval before you can access the platform.
        </p>
        
        <div className="bg-gray-50 p-6 rounded-3xl mb-8 text-left">
          <p className="text-sm font-medium text-gray-600 mb-2">What happens next?</p>
          <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
            <li>An administrator will review your account details.</li>
            <li>Once approved, you will be able to access your dashboard.</li>
            <li>This process usually takes less than 24 hours.</li>
          </ul>
        </div>

        <button 
          onClick={() => signOut()}
          className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
        >
          Sign Out
        </button>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
