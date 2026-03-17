import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    email: '',
    phoneCountryCode: '+63',
    phoneNumber: '',
    degree: '',
    project: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Prevent scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Always open the modal from the top section so the header stays visible.
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const normalizedProject = formData.project.trim();
      const normalizedPhoneNumber = formData.phoneNumber.trim();
      const normalizedPhone = normalizedPhoneNumber ? `${formData.phoneCountryCode} ${normalizedPhoneNumber}` : null;

      const { error } = await supabase
        .from('applications')
        .insert([{
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          age: parseInt(formData.age) || null,
          degree: formData.degree.trim(),
          project_applied: normalizedProject,
          experience: formData.experience.trim(),
          status: 'pending'
        }]);

      if (error) throw error;

      setStatus({ type: 'success', message: 'Application submitted successfully!' });
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        email: '',
        phoneCountryCode: '+63',
        phoneNumber: '',
        degree: '',
        project: '',
        experience: ''
      });
      
      // Close modal after success after a short delay
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);

    } catch (err: any) {
      console.error('Error submitting application:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to submit application.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 md:p-6 md:pt-24">
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
            ref={modalContentRef}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            className="relative w-full max-w-2xl bg-[#F8F5F0] rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-7rem)] overflow-y-auto"
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

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {status && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-500/20 text-green-600 border border-green-500/30' : 'bg-red-500/20 text-red-600 border border-red-500/30'}`}>
                      {status.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">First Name *</label>
                      <input 
                        type="text" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">Last Name *</label>
                      <input 
                        type="text" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
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
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#002D21]">Email Address *</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Phone Number *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-3">
                      <select
                        name="phoneCountryCode"
                        value={formData.phoneCountryCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="+63">+63 (Philippines)</option>
                        <option value="+1">+1 (USA/Canada)</option>
                        <option value="+65">+65 (Singapore)</option>
                        <option value="+60">+60 (Malaysia)</option>
                        <option value="+81">+81 (Japan)</option>
                      </select>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        placeholder="912345678"
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Degree/Field of Study</label>
                    <input 
                      type="text" 
                      name="degree"
                      value={formData.degree}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science, Data Science, Engineering"
                      className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Project Applied For *</label>
                    <select 
                      name="project"
                      value={formData.project}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select a project</option>
                      <option value="Computer Vision">Computer Vision</option>
                      <option value="Natural Language Processing">Natural Language Processing</option>
                      <option value="Machine Learning">Machine Learning</option>
                      <option value="Genealogy Data Processing">Genealogy Data Processing</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#002D21]">Relevant Experience</label>
                    <textarea 
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
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
                        disabled
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-[#002D21] hover:file:bg-gray-50 cursor-pointer w-full opacity-50"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 italic">File upload currently disabled in preview. Please fill the text fields.</p>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-lw-green text-white rounded-lg font-bold text-lg hover:bg-lw-green/90 transition-all shadow-lg shadow-lw-green/20 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
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
