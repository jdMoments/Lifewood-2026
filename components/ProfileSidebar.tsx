import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { countries, languages, timeZones } from './profileData';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  user: any;
  onUpdate?: () => void;
  darkMode?: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose, profile, user, onUpdate, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildFormData = (sourceProfile: any) => ({
    fullName: sourceProfile?.full_name || '',
    nickName: sourceProfile?.nick_name || '',
    phone: sourceProfile?.phone || '',
    gender: sourceProfile?.gender || 'Male',
    country: sourceProfile?.country || 'Philippines',
    language: sourceProfile?.language || 'English',
    timeZone: sourceProfile?.time_zone || 'Asia/Taipei',
    avatarUrl: sourceProfile?.avatar_url || '',
  });

  const [formData, setFormData] = useState(buildFormData(profile));

  useEffect(() => {
    if (!isOpen) return;
    setFormData(buildFormData(profile));
    setError(null);
    setSuccess(null);
    setIsEditing(false);
  }, [isOpen, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be 2MB or smaller.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          nick_name: formData.nickName,
          phone: formData.phone,
          gender: formData.gender,
          country: formData.country,
          language: formData.language,
          time_zone: formData.timeZone,
          avatar_url: formData.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsEditing(false);
      setSuccess('Profile updated successfully.');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error updating profile:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`relative w-full max-w-2xl h-full shadow-2xl overflow-y-auto font-sans transition-colors ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-[#1a1a1a]'}`}
      >
        {/* Header Background */}
        <div className={`h-48 relative ${darkMode ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800' : 'bg-gradient-to-r from-green-100 via-blue-50 to-yellow-50'}`}>
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 w-10 h-10 rounded-full backdrop-blur flex items-center justify-center transition-colors shadow-sm ${darkMode ? 'bg-slate-800/80 text-slate-400 hover:text-white' : 'bg-white/80 text-gray-500 hover:text-black'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="px-8 md:px-12 -mt-12 pb-12">
          {/* Profile Header */}
          <div className="flex items-end justify-between mb-12">
            <div className="flex items-center gap-6">
              <div 
                className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden relative group transition-colors ${darkMode ? 'border-slate-800 bg-emerald-600' : 'border-white bg-green-500'} ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.email?.[0].toUpperCase() || 'U'
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formData.fullName || user.email?.split('@')[0]}</h2>
                <p className={`${darkMode ? 'text-slate-500' : 'text-gray-500'} text-sm`}>{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={loading}
              className={`px-8 py-2.5 ${isEditing ? 'bg-green-700' : 'bg-green-600'} text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-900/10 disabled:opacity-50`}
            >
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit')}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-6 text-sm">
              {success}
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 mb-12">
            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Full Name</label>
              <input
                type="text"
                name="fullName"
                readOnly={!isEditing}
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${
                  isEditing 
                    ? darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Nick Name</label>
              <input
                type="text"
                name="nickName"
                readOnly={!isEditing}
                value={formData.nickName}
                onChange={handleChange}
                placeholder="Your Nick Name"
                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${
                  isEditing 
                    ? darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                readOnly={!isEditing}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all ${
                  isEditing 
                    ? darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Gender</label>
              <div className="relative">
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={formData.gender}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none appearance-none ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500'
                    }`}
                  />
                )}
                <div className="absolute inset-y-0 right-5 flex items-center text-gray-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Country</label>
              <div className="relative">
                {isEditing ? (
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    }`}
                  >
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={formData.country}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none appearance-none ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500'
                    }`}
                  />
                )}
                <div className="absolute inset-y-0 right-5 flex items-center text-gray-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Language</label>
              <div className="relative">
                {isEditing ? (
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    }`}
                  >
                    {languages.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={formData.language}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none appearance-none ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500'
                    }`}
                  />
                )}
                <div className="absolute inset-y-0 right-5 flex items-center text-gray-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-gray-700'}`}>Time Zone</label>
              <div className="relative">
                {isEditing ? (
                  <select
                    name="timeZone"
                    value={formData.timeZone}
                    onChange={handleChange}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-green-200 text-gray-700'
                    }`}
                  >
                    {timeZones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={timeZones.find(tz => tz.value === formData.timeZone)?.label || formData.timeZone}
                    className={`w-full pl-5 pr-14 py-3.5 border rounded-2xl focus:outline-none appearance-none ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500'
                    }`}
                  />
                )}
                <div className="absolute inset-y-0 right-5 flex items-center text-gray-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Email Section */}
          <div className="space-y-6">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My email Address</h3>
            
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-green-50 text-green-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>1 month ago</p>
              </div>
            </div>

            <button className={`px-6 py-3 font-bold rounded-xl transition-all text-sm ${darkMode ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
              +Add Email Address
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSidebar;
