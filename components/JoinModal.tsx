import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { isMissingResumeBucketError, uploadResumeFile, validateResumeFile } from '../lib/applicationResume';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  const isDuplicateApplicationEmailError = (error: any) => {
    const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
    return (
      error?.code === '23505' ||
      message.includes('email is already exist') ||
      (message.includes('duplicate') && message.includes('email'))
    );
  };

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
  const projectOptions = [
    'Casual Video Models (Video Data Collection)',
    'Moderator & Voice Participants (Voice Data Collection)',
    'Data Annotator (Iphone User)',
    'Image Data Collector (Capturing Text - Rich Items)',
    'Data Curation (Genealogy Project)',
    'Intern (Applicant to PH only)',
  ];
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isCheckingEmailExists, setIsCheckingEmailExists] = useState(false);
  const [isEmailExists, setIsEmailExists] = useState(false);
  const [ageValidationMessage, setAgeValidationMessage] = useState('');
  const [phoneValidationMessage, setPhoneValidationMessage] = useState('');
  const emailFieldRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneFieldRef = useRef<HTMLDivElement | null>(null);

  const checkExistingApplicationEmail = async (candidateEmail: string) => {
    const normalizedEmail = candidateEmail.trim().toLowerCase();
    if (!normalizedEmail) return false;

    const { data: rpcExists, error: rpcError } = await supabase.rpc('application_email_exists', {
      candidate_email: normalizedEmail,
    });
    if (!rpcError) {
      return rpcExists === true;
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('applications')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1);

    if (fallbackError) {
      throw fallbackError;
    }

    return Array.isArray(fallbackData) && fallbackData.length > 0;
  };

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

  React.useEffect(() => {
    const rawAge = formData.age.trim();
    if (!rawAge) {
      setAgeValidationMessage('');
      return;
    }

    const parsedAge = Number.parseInt(rawAge, 10);
    if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 60) {
      setAgeValidationMessage('Age must be 18-60');
      return;
    }

    setAgeValidationMessage('');
  }, [formData.age]);

  React.useEffect(() => {
    const digitsOnlyPhone = formData.phoneNumber.replace(/\D/g, '');
    if (!digitsOnlyPhone) {
      setPhoneValidationMessage('');
      return;
    }

    if (digitsOnlyPhone.length < 11) {
      setPhoneValidationMessage('Phone number must be at least 11 digits');
      return;
    }

    setPhoneValidationMessage('');
  }, [formData.phoneNumber]);

  const scrollToField = (targetRef: React.RefObject<HTMLDivElement>) => {
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const focusEmailField = () => {
    scrollToField(emailFieldRef);
    window.setTimeout(() => {
      emailInputRef.current?.focus();
      emailInputRef.current?.select();
    }, 220);
  };

  React.useEffect(() => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setIsCheckingEmailExists(false);
      setIsEmailExists(false);
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      setIsCheckingEmailExists(true);
      let emailExists = false;
      let checkFailed = false;
      try {
        emailExists = await checkExistingApplicationEmail(normalizedEmail);
      } catch (error) {
        checkFailed = true;
        console.error('Error checking existing applicant email:', error);
      }
      if (!isActive) return;
      setIsCheckingEmailExists(false);

      if (checkFailed) {
        setIsEmailExists(false);
        return;
      }

      setIsEmailExists(emailExists === true);
    }, 350);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const parsedAge = Number.parseInt(formData.age, 10);
      if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 60) {
        setStatus({ type: 'error', message: 'Age must be 18-60' });
        setLoading(false);
        return;
      }

      const digitsOnlyPhone = formData.phoneNumber.replace(/\D/g, '');
      if (digitsOnlyPhone.length < 11) {
        setStatus({ type: 'error', message: 'Phone number must be at least 11 digits' });
        scrollToField(phoneFieldRef);
        setLoading(false);
        return;
      }

      if (isCheckingEmailExists) {
        setStatus({ type: 'error', message: 'Checking email. Please wait.' });
        focusEmailField();
        setLoading(false);
        return;
      }

      if (isEmailExists) {
        setStatus({ type: 'error', message: 'Email Already Exist' });
        focusEmailField();
        setLoading(false);
        return;
      }

      let uploadedResumeUrl: string | null = null;
      let resumeUploadNotice = '';
      if (resumeFile) {
        try {
          const uploadedResume = await uploadResumeFile(resumeFile);
          uploadedResumeUrl = uploadedResume.publicUrl;
        } catch (resumeUploadError: any) {
          if (isMissingResumeBucketError(resumeUploadError)) {
            resumeUploadNotice = ' Resume upload is temporarily unavailable, but your application was submitted.';
          } else {
            throw resumeUploadError;
          }
        }
      }

      const normalizedEmail = formData.email.trim().toLowerCase();
      const normalizedProject = formData.project.trim();
      const normalizedPhoneNumber = formData.phoneNumber.replace(/\D/g, '');
      const normalizedPhone = normalizedPhoneNumber ? `${formData.phoneCountryCode} ${normalizedPhoneNumber}` : null;
      let emailExists = false;
      try {
        emailExists = await checkExistingApplicationEmail(normalizedEmail);
      } catch (error: any) {
        console.error('Error validating email before submit:', error);
        setStatus({ type: 'error', message: 'Unable to validate email right now. Please try again.' });
        focusEmailField();
        setLoading(false);
        return;
      }
      if (emailExists) {
        setStatus({ type: 'error', message: 'Email Already Exist' });
        setIsEmailExists(true);
        focusEmailField();
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('applications')
        .insert([{
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          age: parsedAge,
          degree: formData.degree.trim(),
          project_applied: normalizedProject,
          experience: formData.experience.trim(),
          cv_url: uploadedResumeUrl,
          status: 'pending'
        }]);

      if (error) throw error;

      setStatus({ type: 'success', message: `Application submitted successfully!${resumeUploadNotice}` });
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
      setResumeFile(null);
      setIsEmailExists(false);
      
      // Close modal after success after a short delay
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 2000);

    } catch (err: any) {
      console.error('Error submitting application:', err);
      if (isDuplicateApplicationEmailError(err)) {
        setStatus({ type: 'error', message: 'Email Already Exist' });
        setIsEmailExists(true);
        focusEmailField();
      } else {
        setStatus({ type: 'error', message: err.message || 'Failed to submit application.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const value = name === 'phoneNumber' ? e.target.value.replace(/\D/g, '') : e.target.value;
    if (name === 'email' || name === 'age' || name === 'phoneNumber') {
      setStatus(null);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isSubmitBlocked = loading || isCheckingEmailExists || Boolean(ageValidationMessage) || Boolean(phoneValidationMessage);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    try {
      validateResumeFile(file);
      setResumeFile(file);
      setStatus(null);
    } catch (error: any) {
      setResumeFile(null);
      setStatus({ type: 'error', message: error?.message || 'Invalid resume file.' });
    }
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
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-[#002D21]">Age</label>
                        {ageValidationMessage ? (
                          <p className="text-xs font-semibold text-red-600 text-right">{ageValidationMessage}</p>
                        ) : null}
                      </div>
                      <input 
                        type="number" 
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        min={18}
                        max={60}
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                  <div className="space-y-2" ref={emailFieldRef}>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-[#002D21]">Email Address *</label>
                      {isEmailExists ? (
                        <p className="text-xs font-semibold text-red-600 text-right">Email Already Exist</p>
                      ) : null}
                    </div>
                      <input 
                        type="email" 
                        name="email"
                        ref={emailInputRef}
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2" ref={phoneFieldRef}>
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-[#002D21]">Phone Number *</label>
                      {phoneValidationMessage ? (
                        <p className="text-xs font-semibold text-red-600 text-right">{phoneValidationMessage}</p>
                      ) : null}
                    </div>
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
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        inputMode="numeric"
                        pattern="[0-9]{11,}"
                        minLength={11}
                        placeholder="09123456789"
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
                    <div className="relative">
                      <select
                        name="project"
                        value={formData.project}
                        onChange={handleChange}
                        required
                        className="w-full px-4 pr-12 py-3 bg-[#F8F5F0] border-none rounded-lg focus:ring-2 focus:ring-lw-green/20 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select a project</option>
                        {projectOptions.map((projectOption) => (
                          <option key={projectOption} value={projectOption}>
                            {projectOption}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#002D21]/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
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
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleResumeChange}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-[#002D21] hover:file:bg-gray-50 cursor-pointer w-full"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">
                      {resumeFile ? `Selected file: ${resumeFile.name}` : 'Accepted files: PDF, DOC, DOCX (max 10 MB).'}
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitBlocked}
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
