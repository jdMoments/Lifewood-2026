import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SignUpModal from './SignUpModal';

const ADMIN_EMAIL = 'damayojholmer@gmail.com';

const isMissingDeclinedColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('is_declined') && message.includes('does not exist');
};

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      const signedInUserId = data.user?.id;

      if (!signedInUserId) {
        throw new Error('Unable to validate account status. Please try again.');
      }

      let profile: any = null;
      {
        const { data: profileWithDeclined, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_approved, is_declined')
          .eq('id', signedInUserId)
          .maybeSingle();

        if (profileError && isMissingDeclinedColumnError(profileError)) {
          const { data: profileLegacy, error: legacyError } = await supabase
            .from('profiles')
            .select('role, is_approved')
            .eq('id', signedInUserId)
            .maybeSingle();

          if (legacyError) throw legacyError;
          profile = profileLegacy;
        } else if (profileError) {
          throw profileError;
        } else {
          profile = profileWithDeclined;
        }
      }

      if (profile?.is_declined === true) {
        await supabase.auth.signOut();
        setError('Your account request was deleted by admin.');
        return;
      }

      const isAdminUser = normalizedEmail === ADMIN_EMAIL || (profile?.role || '').toLowerCase() === 'admin';

      if (!isAdminUser && profile?.is_approved !== true) {
        await supabase.auth.signOut();
        setError('Your account is pending admin approval. You can log in after it is accepted.');
        return;
      }

      if (isAdminUser) {
        window.location.hash = '#/admin';
      } else {
        window.location.hash = '#/user';
      }
    } catch (err: any) {
      let msg = err.message || 'An error occurred during sign in';
      if (msg.includes('Email not confirmed')) {
        msg = 'Please confirm your email address by clicking the link sent to your inbox before signing in.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignUpModalOpen(true);
  };

  const handleSignUpSuccess = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `An error occurred during ${provider} sign in`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1100px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row min-h-[700px]"
      >
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col relative z-10">
          <div className="mb-12">
            <a 
              href="#/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-lw-green transition-colors no-underline text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Home
            </a>
          </div>

          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-lw-green flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white"></div>
            </div>
            <span className="font-bold text-2xl tracking-tight text-lw-green">lifewood</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500">Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {success}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSignIn}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lw-green/20 focus:border-lw-green transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-sm font-bold text-lw-green hover:underline transition-all no-underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lw-green/20 focus:border-lw-green transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-lw-green text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-lw-green/90 shadow-lg shadow-lw-green/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or continue with</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                className="flex items-center justify-center py-3 px-6 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" alt="Google" className="h-5 w-5" />
              </button>
              <button 
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                className="flex items-center justify-center py-3 px-6 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="mt-auto pt-10 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account? {' '}
              <button 
                onClick={handleSignUpClick}
                className="text-lw-green font-bold hover:underline transition-all"
              >
                Create an account
              </button>
            </p>
          </div>

        </div>

        {/* Right Side - Visuals with Diagonal Design */}
        <div className="hidden lg:flex w-1/2 bg-lw-green relative items-center justify-center p-12 overflow-hidden">
          {/* Diagonal Background Element */}
          <div className="absolute inset-0 bg-lw-green-deep opacity-20 transform -skew-x-12 translate-x-1/2"></div>
          
          <div className="relative z-10 w-full max-w-md space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[24px] shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Innovative Design</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Harness the power of AI for cutting-edge 3D creations and seamless workflows.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-[24px] shadow-xl translate-x-4"
            >
              <div className="w-10 h-10 rounded-xl bg-lw-green/10 flex items-center justify-center text-lw-green mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-gray-900 font-bold text-xl mb-2">User Friendly</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Intuitive platform designed for everyone, from beginners to professional designers.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[24px] shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Secure Platform</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Enterprise-grade security to protect your data and intellectual property at all times.
              </p>
            </motion.div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-lw-green-deep/20 rounded-full blur-3xl"></div>
        </div>
      </motion.div>

      <SignUpModal 
        isOpen={isSignUpModalOpen} 
        onClose={() => setIsSignUpModalOpen(false)} 
        onSuccess={handleSignUpSuccess}
      />
    </div>
  );
};

export default SignIn;
