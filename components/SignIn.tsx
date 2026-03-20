import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SignUpModal from './SignUpModal';
import FloatingLines from './FloatingLines';

const ADMIN_EMAIL = 'damayojholmer@gmail.com';

const isMissingDeclinedColumnError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('is_declined') && message.includes('does not exist');
};

const PasswordEyeIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen ? (
        <motion.svg
          key="eye-open"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.75, y: 2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.75, y: -2 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <motion.circle
            cx="12"
            cy="12"
            r="3"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        </motion.svg>
      ) : (
        <motion.svg
          key="eye-closed"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.75, y: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.75, y: 2 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          <motion.line
            x1="3"
            y1="21"
            x2="21"
            y2="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            exit={{ pathLength: 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
};

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

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

      const normalizedRole = (profile?.role || '').toString().trim().toLowerCase();
      const isAdminUser = normalizedEmail === ADMIN_EMAIL || normalizedRole === 'admin';
      const isEmployeeUser = normalizedRole === 'employee';

      if (isAdminUser) {
        window.location.hash = '#/admin';
      } else if (isEmployeeUser) {
        window.location.hash = '#/employees';
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

  const handleSignUpSuccess = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
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
    <div className="relative min-h-screen overflow-hidden bg-[#020617] flex items-center justify-center p-4 md:p-8">
      <FloatingLines
        className="absolute inset-0"
        linesGradient={['#E947F5', '#2F4BA2', '#60A5FA', '#34D399']}
        enabledWaves={['top', 'middle', 'bottom']}
        lineCount={[7, 9, 7]}
        lineDistance={[5, 6, 5]}
        animationSpeed={1}
        interactive={false}
        parallax={true}
        parallaxStrength={0.12}
        mixBlendMode="screen"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.15)_0%,rgba(2,6,23,0.65)_70%,rgba(2,6,23,0.9)_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[1100px] rounded-[32px] border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col lg:flex-row min-h-[700px]"
      >
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col relative z-10 bg-white/88">
          <div className="mb-12">
            <a
              href="#/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-lw-green transition-colors no-underline text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Home
            </a>
          </div>

          <div className="mb-10">
            <img
              src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429"
              alt="Lifewood"
              className="h-10 w-auto"
              referrerPolicy="no-referrer"
            />
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
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    passwordInputRef.current?.focus();
                  }
                }}
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
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lw-green/20 focus:border-lw-green transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 my-auto h-10 w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <PasswordEyeIcon isOpen={showPassword} />
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
                <img src="https://cdn2.hubspot.net/hubfs/53/image8-2.jpg" alt="Google" className="h-5 w-auto object-contain" />
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
              Don't have an account?{' '}
              <button
                onClick={handleSignUpClick}
                className="text-lw-green font-bold hover:underline transition-all"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex w-1/2 bg-lw-green/50 backdrop-blur-sm relative items-center justify-center p-12 overflow-hidden">
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
