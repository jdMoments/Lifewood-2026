import React, { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { supabase } from '../lib/supabase';

const CONTACT_MESSAGE_TABLE = 'inbox_messages';
const CONTACT_RATE_LIMIT_RPC = 'submit_contact_message';
const CONTACT_DAILY_LIMIT = 3;
const CONTACT_COOLDOWN_MS = 2 * 60 * 1000;
const CONTACT_DEVICE_ID_STORAGE_KEY = 'lifewood_contact_device_id';
const CONTACT_RATE_LIMIT_STORAGE_KEY = 'lifewood_contact_rate_limit_v1';

type ContactStatus = { type: 'success' | 'error'; message: string };

type StoredContactRateLimitState = {
  dayKey: string;
  successfulSends: number;
  lastSentAt: string | null;
};

type ContactSubmitResponse = {
  success?: boolean;
  message?: string;
  attempts_left?: number;
  cooldown_seconds?: number;
};

const getUtcDayKey = (timestamp = Date.now()) => new Date(timestamp).toISOString().slice(0, 10);

const createBrowserDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `contact-device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const readStoredRateLimitState = (): StoredContactRateLimitState => {
  const todayKey = getUtcDayKey();

  if (typeof window === 'undefined') {
    return {
      dayKey: todayKey,
      successfulSends: 0,
      lastSentAt: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(CONTACT_RATE_LIMIT_STORAGE_KEY);
    if (!raw) {
      return {
        dayKey: todayKey,
        successfulSends: 0,
        lastSentAt: null,
      };
    }

    const parsed = JSON.parse(raw) as Partial<StoredContactRateLimitState> | null;
    const storedDayKey = typeof parsed?.dayKey === 'string' ? parsed.dayKey : todayKey;
    const storedSuccessfulSends = Number.isFinite(parsed?.successfulSends)
      ? Math.max(0, Math.min(CONTACT_DAILY_LIMIT, Number(parsed?.successfulSends)))
      : 0;
    const storedLastSentAt = typeof parsed?.lastSentAt === 'string' ? parsed.lastSentAt : null;

    if (storedDayKey !== todayKey) {
      return {
        dayKey: todayKey,
        successfulSends: 0,
        lastSentAt: storedLastSentAt,
      };
    }

    return {
      dayKey: storedDayKey,
      successfulSends: storedSuccessfulSends,
      lastSentAt: storedLastSentAt,
    };
  } catch {
    return {
      dayKey: todayKey,
      successfulSends: 0,
      lastSentAt: null,
    };
  }
};

const persistStoredRateLimitState = (state: StoredContactRateLimitState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CONTACT_RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
};

const getCurrentClientRateLimitState = () => {
  const storedState = readStoredRateLimitState();
  persistStoredRateLimitState(storedState);

  const lastSentAtMs = storedState.lastSentAt ? Date.parse(storedState.lastSentAt) : Number.NaN;

  return {
    ...storedState,
    lastSentAtMs: Number.isFinite(lastSentAtMs) ? lastSentAtMs : null,
  };
};

const recordSuccessfulClientSend = (timestamp: number) => {
  const currentState = readStoredRateLimitState();
  const nextState: StoredContactRateLimitState = {
    dayKey: getUtcDayKey(timestamp),
    successfulSends: Math.min(CONTACT_DAILY_LIMIT, currentState.successfulSends + 1),
    lastSentAt: new Date(timestamp).toISOString(),
  };

  persistStoredRateLimitState(nextState);

  return {
    ...nextState,
    lastSentAtMs: timestamp,
  };
};

const getOrCreateBrowserDeviceId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const existingDeviceId = window.localStorage.getItem(CONTACT_DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = createBrowserDeviceId();
  window.localStorage.setItem(CONTACT_DEVICE_ID_STORAGE_KEY, nextDeviceId);
  return nextDeviceId;
};

const isMissingSubmitContactRpcError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes(CONTACT_RATE_LIMIT_RPC) && (message.includes('function') || message.includes('schema cache'));
};

const formatCooldownLabel = (remainingMs: number) => {
  const totalSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
};

const ContactUs: React.FC = () => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ContactStatus | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [successfulSendsToday, setSuccessfulSendsToday] = useState(0);
  const [lastSentAtMs, setLastSentAtMs] = useState<number | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const reachRows = [
    { label: 'Email', value: 'lifewood@gmail.com' },
    { label: 'Contact No.', value: '09515856382' },
    { label: 'Website', value: 'http://www.lifewood.com' },
    { label: 'Industry', value: 'IT Services and IT Consulting' },
    {
      label: 'Specialties',
      value:
        'AI Data, Data Migration, Genealogy, Data Annotation, Data Labelling, Natural Language Processing, and Computer Vision',
    },
  ];

  React.useEffect(() => {
    const syncClientLimitState = () => {
      setDeviceId(getOrCreateBrowserDeviceId());

      const currentState = getCurrentClientRateLimitState();
      setSuccessfulSendsToday(currentState.successfulSends);
      setLastSentAtMs(currentState.lastSentAtMs);
    };

    syncClientLimitState();
    window.addEventListener('focus', syncClientLimitState);

    const syncInterval = window.setInterval(syncClientLimitState, 30000);

    return () => {
      window.removeEventListener('focus', syncClientLimitState);
      window.clearInterval(syncInterval);
    };
  }, []);

  React.useEffect(() => {
    if (!lastSentAtMs) {
      setCooldownRemainingMs(0);
      return;
    }

    const updateCooldown = () => {
      const nextRemainingMs = Math.max(0, CONTACT_COOLDOWN_MS - (Date.now() - lastSentAtMs));
      setCooldownRemainingMs(nextRemainingMs);
    };

    updateCooldown();

    if (Date.now() - lastSentAtMs >= CONTACT_COOLDOWN_MS) {
      return;
    }

    const cooldownInterval = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(cooldownInterval);
  }, [lastSentAtMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const normalizedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedMessage = message.trim();
      const activeDeviceId = deviceId || getOrCreateBrowserDeviceId();
      const clientLimitState = getCurrentClientRateLimitState();
      const remainingCooldownMs = clientLimitState.lastSentAtMs
        ? Math.max(0, CONTACT_COOLDOWN_MS - (Date.now() - clientLimitState.lastSentAtMs))
        : 0;

      setSuccessfulSendsToday(clientLimitState.successfulSends);
      setLastSentAtMs(clientLimitState.lastSentAtMs);
      setDeviceId(activeDeviceId);
      setStatus(null);

      if (!normalizedName || !normalizedEmail || !normalizedMessage) {
        setStatus({ type: 'error', message: 'Please complete your name, email, and message before sending.' });
        return;
      }

      if (remainingCooldownMs > 0) {
        setStatus({
          type: 'error',
          message: `This device is on cooldown. Please wait ${formatCooldownLabel(remainingCooldownMs)} before sending another message.`,
        });
        return;
      }

      if (clientLimitState.successfulSends >= CONTACT_DAILY_LIMIT) {
        setStatus({
          type: 'error',
          message: 'This device has already sent 3 messages today. Please try again tomorrow.',
        });
        return;
      }

      setLoading(true);

      const payload = {
        name: normalizedName,
        email: normalizedEmail,
        message: normalizedMessage,
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc(CONTACT_RATE_LIMIT_RPC, {
        contact_device_id: activeDeviceId,
        contact_email: normalizedEmail,
        contact_message: normalizedMessage,
        contact_name: normalizedName,
      });

      if (rpcError && !isMissingSubmitContactRpcError(rpcError)) {
        throw rpcError;
      }

      if (rpcError && isMissingSubmitContactRpcError(rpcError)) {
        const { error: insertError } = await supabase
          .from(CONTACT_MESSAGE_TABLE)
          .insert([payload]);

        if (insertError) {
          throw insertError;
        }
      } else {
        const submitResult = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as ContactSubmitResponse | null;

        if (submitResult?.success === false) {
          if (typeof submitResult.attempts_left === 'number') {
            setSuccessfulSendsToday(Math.max(0, CONTACT_DAILY_LIMIT - submitResult.attempts_left));
          }

          if (typeof submitResult.cooldown_seconds === 'number' && submitResult.cooldown_seconds > 0) {
            const reconstructedLastSentAtMs = Date.now() - Math.max(0, CONTACT_COOLDOWN_MS - (submitResult.cooldown_seconds * 1000));
            setLastSentAtMs(reconstructedLastSentAtMs);
          }

          setStatus({
            type: 'error',
            message: submitResult.message || 'Unable to send your message right now.',
          });
          return;
        }
      }

      const updatedClientState = recordSuccessfulClientSend(Date.now());
      setSuccessfulSendsToday(updatedClientState.successfulSends);
      setLastSentAtMs(updatedClientState.lastSentAtMs);

      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const attemptsLeft = Math.max(0, CONTACT_DAILY_LIMIT - successfulSendsToday);
  const isTemporarilyBlocked = cooldownRemainingMs > 0;
  const isDailyLimitReached = attemptsLeft === 0;
  const isSubmitDisabled = loading || isTemporarilyBlocked || isDailyLimitReached;
  const deviceLimitMessage = isTemporarilyBlocked
    ? `This device can send another message in ${formatCooldownLabel(cooldownRemainingMs)}.`
    : isDailyLimitReached
      ? 'This device already used all 3 contact attempts for today.'
      : `${attemptsLeft} of ${CONTACT_DAILY_LIMIT} contact attempts remaining for this device today.`;

  return (
    <div 
      ref={sectionRef}
      className="relative min-h-screen pt-32 pb-20 px-8 md:px-20 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&fit=crop)' }}
    >
      {/* Dark overlay for the earthy/green vibe */}
      <div className="absolute inset-0 bg-[#2D3627]/40 backdrop-blur-sm z-0"></div>
      
      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12 z-10">
        
        {/* Left Side: Reach Card */}
        <div className="lg:w-2/5 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2.5rem] border border-white/15 bg-black/30 backdrop-blur-xl p-6 md:p-8 shadow-2xl"
          >
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-[#FFB347] text-black text-xs font-black uppercase tracking-[0.2em]">
              Reach in Lifewood
            </div>

            <div className="mt-6 space-y-3">
              {reachRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 md:p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">{row.label}</p>
                  {row.label === 'Website' ? (
                    <a
                      href="http://www.lifewood.com"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-white font-semibold break-words hover:text-[#FFB347] transition-colors no-underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <p className="mt-2 text-white font-semibold leading-relaxed break-words">{row.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-7 pt-5 border-t border-white/15">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70 mb-4">Follow Us</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="w-11 h-11 rounded-full border border-white/25 bg-white/10 flex items-center justify-center text-white hover:bg-[#FFB347] hover:text-black transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.4a1.56 1.56 0 0 1 0 3.1ZM5.6 9.72h2.67v8.68H5.6V9.72Zm4.34 0h2.56v1.18h.04c.36-.67 1.23-1.37 2.53-1.37 2.7 0 3.2 1.77 3.2 4.08v4.79H15.6v-4.25c0-1.02-.02-2.33-1.42-2.33-1.43 0-1.65 1.11-1.65 2.25v4.33H9.94V9.72Z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-11 h-11 rounded-full border border-white/25 bg-white/10 flex items-center justify-center text-white hover:bg-[#FFB347] hover:text-black transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-11 h-11 rounded-full border border-white/25 bg-white/10 flex items-center justify-center text-white hover:bg-[#FFB347] hover:text-black transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.2a2.96 2.96 0 0 0-2.08-2.1C19.57 3.6 12 3.6 12 3.6s-7.57 0-9.42.5A2.96 2.96 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 2.96 2.96 0 0 0 2.08 2.1c1.85.5 9.42.5 9.42.5s7.57 0 9.42-.5a2.96 2.96 0 0 0 2.08-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.8V8.2l6.3 3.8-6.3 3.8Z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:w-3/5 w-full">
          <motion.div 
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={sectionRef}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileDrag={{ scale: 1.01, zIndex: 50 }}
            className="relative rounded-[3rem] shadow-2xl min-h-[700px] flex flex-col group bg-black/30 backdrop-blur-2xl border border-white/10"
            style={{ 
              resize: 'both',
              overflow: 'hidden',
              maxWidth: '100%',
              minWidth: '320px'
            }}
          >
            {/* Drag Handle Bar */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="h-10 w-full flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Form Container */}
            <div className="flex-1 px-12 md:px-16 py-12 flex flex-col justify-center h-full w-full overflow-y-auto">
              <form className="space-y-8" onSubmit={handleSubmit}>
                {status && (
                  <div className={`p-4 rounded-2xl text-sm font-medium ${status.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {status.message}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-white font-bold text-base ml-1">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your Name"
                    className="w-full bg-[#44493D]/60 border-none rounded-full px-6 py-4 text-white placeholder-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-white font-bold text-base ml-1">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full bg-[#44493D]/60 border-none rounded-full px-6 py-4 text-white placeholder-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-white font-bold text-base ml-1">Message</label>
                  <textarea 
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Message here..."
                    className="w-full bg-[#44493D]/60 border-none rounded-[2rem] px-6 py-5 text-white placeholder-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="w-full py-5 bg-[#14261F] text-white rounded-full font-bold text-lg hover:bg-[#0D1A15] transition-all shadow-2xl border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                  <p className="mt-4 px-2 text-sm text-white/70">
                    {deviceLimitMessage}
                  </p>
                </div>
              </form>

              {/* Resize Handle Indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="21" x2="9" y2="21" />
                  <line x1="21" y1="21" x2="21" y2="9" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
