import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Ballpit from './Ballpit';
import { supabase } from '../lib/supabase';
import { isMissingResumeBucketError, uploadResumeFile, validateResumeFile } from '../lib/applicationResume';

const CareersPage: React.FC = () => {
  const { t } = useTranslation();
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
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
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
      const normalizedPhoneNumber = formData.phoneNumber.trim();
      const normalizedPhone = normalizedPhoneNumber ? `${formData.phoneCountryCode} ${normalizedPhoneNumber}` : null;

      const { error } = await supabase
        .from('applications')
        .insert([{
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          age: parseInt(formData.age, 10) || null,
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
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to submit application.' });
    } finally {
      setLoading(false);
    }
  };

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

  const scrollToApplicationSection = () => {
    const section = document.getElementById('career-application-form');
    if (!section) return;

    const headerOffset = 96;
    const startY = window.scrollY;
    const targetY = section.getBoundingClientRect().top + window.scrollY - headerOffset;
    const distance = targetY - startY;
    const duration = 600;
    let startTime: number | null = null;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const nextY = startY + (distance * easeOutCubic(progress));
      window.scrollTo(0, nextY);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  return (
    <div className="relative min-h-screen bg-white z-10 overflow-hidden">
      {/* First Section */}
      <div className="relative pt-40 pb-20 px-8 md:px-20">
        {/* Ballpit Background */}
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
          <Ballpit 
            count={100}
            gravity={0.7}
            friction={0.9975}
            wallBounce={0.95}
            followCursor={true}
            colors={[0xffb347, 0x1db954, 0xffffff]}
          />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 min-h-[60vh]">
          {/* Left Section */}
          <div className="flex-1">
            <h1 className="text-6xl md:text-8xl font-bold text-black mb-10 tracking-tight leading-[1.1]">
              {t('careersPage.title').split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {word} {i === 1 ? <br /> : ''}
                </React.Fragment>
              ))}
            </h1>
            
            <div className="flex items-center">
              <button
                onClick={scrollToApplicationSection}
                className="relative inline-flex items-center group transition-all"
              >
                <span className="px-8 pr-14 py-3 bg-[#FFB347] text-black font-semibold rounded-full transition-all duration-300 group-hover:pr-12 group-hover:bg-[#FFA500]">
                  {t('careersPage.joinUs')}
                </span>
                <span className="absolute right-2 w-9 h-9 bg-[#FFD082] text-black rounded-full flex items-center justify-center transition-all duration-300 translate-x-1 group-hover:translate-x-0 group-hover:bg-[#FFB347]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex-1 max-w-md">
            <p className="text-[#333] text-lg leading-relaxed">
              {t('careersPage.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Second Section: Image */}
      <div className="max-w-7xl mx-auto mt-20 px-8 md:px-20">
        <div className="w-full aspect-[21/9] overflow-hidden rounded-[3rem] shadow-xl">
          <img 
            src="https://framerusercontent.com/images/DF2gzPqqVW8QGp7Jxwp1y5257xk.jpg?width=6000&height=4000" 
            alt="Team collaboration" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      {/* Third Section: Teams & Values */}
      <div className="max-w-7xl mx-auto mt-40 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-black mb-8">
          It means motivating<br />and growing teams
        </h2>
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-20">
          Teams that can initiate and learn on the run in order to deliver evolving technologies and targets. It's a big challenge, but innovation, especially across borders, has never been the easy path.
        </p>

        {/* Tag Marquee */}
        <div className="space-y-4 mb-40 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {/* Row 1 */}
          <div className="flex gap-4 animate-marquee whitespace-nowrap w-max">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {['Supportive', 'Collaborative', 'Innovative', 'Flexible'].map((tag, j) => (
                  <span key={`${i}-${j}`} className="px-8 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full font-medium text-base border border-[#5A5A40]/10">
                    {tag}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex gap-4 animate-marquee-reverse whitespace-nowrap w-max">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {['Transparent', 'Engaging', 'Diverse', 'Purpose-driven'].map((tag, j) => (
                  <span key={`${i}-${j}`} className="px-8 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full font-medium text-base border border-[#5A5A40]/10">
                    {tag}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
          {/* Row 3 */}
          <div className="flex gap-4 animate-marquee whitespace-nowrap w-max">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                {['Balanced (work-life balance)', 'Trustworthy', 'Professional', 'Reliable'].map((tag, j) => (
                  <span key={`${i}-${j}`} className="px-8 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-full font-medium text-base border border-[#5A5A40]/10">
                    {tag}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bottom CTA Text */}
        <div className="max-w-5xl mx-auto">
          <p className="text-3xl md:text-4xl font-medium text-black leading-tight">
            If you're looking to turn the page on a new chapter in your career make contact with us today. At Lifewood, the adventure is always before you, it's why we've been described as <span className="text-lw-green">"always on, never off."</span>
          </p>
        </div>
      </div>

      {/* Fourth Section: Application Form */}
      <div id="career-application-form" className="max-w-5xl mx-auto mt-24 mb-28 px-8 md:px-20 scroll-mt-32">
        <div className="bg-[#F8F5F0] rounded-[2rem] p-6 md:p-10 shadow-xl border border-black/5">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-black/5">
            <h3 className="text-2xl font-bold text-[#002D21] mb-1">Application Form</h3>
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
                disabled={loading}
                className="w-full py-4 bg-lw-green text-white rounded-lg font-bold text-lg hover:bg-lw-green/90 transition-all shadow-lg shadow-lw-green/20 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
