import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const INACTIVITY_REFRESH_MS = 10 * 60 * 1000;

const normalizeRoutePath = (routePath: string) => {
  const trimmedRoute = (routePath || '').trim();
  if (!trimmedRoute) return '/';

  const [withoutQuery] = trimmedRoute.split('?');
  const normalizedRoute = withoutQuery.replace(/\/+$/, '') || '/';

  if (normalizedRoute === 'innovation') {
    return 'innovation';
  }

  return normalizedRoute.startsWith('/') ? normalizedRoute : `/${normalizedRoute}`;
};

const getCurrentRoutePath = () => {
  const hashRoute = window.location.hash.substring(1);
  if (hashRoute) {
    if (!hashRoute.startsWith('/')) return hashRoute;
    return normalizeRoutePath(hashRoute);
  }
  return normalizeRoutePath(window.location.pathname || '/');
};

const ADMIN_EMAIL = 'damayojholmer@gmail.com';

type RecommendationCategory = 'public' | 'user' | 'admin';

const RECOMMENDATION_TOPICS: Record<RecommendationCategory, string[][]> = {
  public: [
    [
      'Give me a quick summary of Lifewood from Home to News.',
      'What AI services and project types does Lifewood offer?',
      'Show key highlights from Internal and External News.',
      'How can I contact Lifewood or apply from Careers?',
    ],
    [
      'What does Lifewood do in AI data, annotation, and curation?',
      'Which pages should I visit first: Services, Projects, or News?',
      'Tell me the latest company updates from the News pages.',
      'Where can I learn about offices, policies, and terms?',
    ],
  ],
  user: [
    [
      'Summarize my Dashboard progress, tasks, and performance.',
      'What tasks are pending and which deadline is nearest?',
      'How can I improve my completion and efficiency score?',
      'What account settings can I update right now?',
    ],
    [
      'Show me a quick status for Dashboard, Tasks, and Performance.',
      'How do User and Employee task views differ?',
      'What should I prioritize today based on my current task data?',
      'Can you explain my progress metrics in simple terms?',
    ],
  ],
  admin: [
    [
      'Summarize Dashboard cards: applicants, interns, employees, active now.',
      'What stands out in Analytics, Task, and Evaluation right now?',
      'Give me a quick status of Applicants, Projects, and Inbox.',
      'What needs attention in Manage Users and Settings?',
    ],
    [
      'Show a short admin overview across Reports and Evaluation.',
      'Which applicant pipeline statuses need follow-up today?',
      'Give me an inbox and project submission health check.',
      'What are the top admin actions to do now?',
    ],
  ],
};

const getChatScopeFromRoute = (
  routePath: string,
  userRole?: string,
  userEmail?: string,
  isAuthenticated?: boolean
) => {
  const normalizedRoute = (routePath || '/').trim().toLowerCase();
  const normalizedRole = (userRole || '').trim().toLowerCase();
  const normalizedEmail = (userEmail || '').trim().toLowerCase();

  const isDashboardRoute =
    normalizedRoute === '/admin' || normalizedRoute === '/employees' || normalizedRoute === '/user';

  if (!isDashboardRoute) return 'public';
  if (!isAuthenticated) return 'public';

  const isAdminUser = normalizedRole === 'admin' || normalizedEmail === ADMIN_EMAIL;
  if (isAdminUser) return 'admin';
  if (normalizedRole === 'employee') return 'employees';
  return 'user';
};

const getRecommendationCategoryFromRoute = (
  routePath: string,
  userRole?: string,
  userEmail?: string,
  isAuthenticated?: boolean
): RecommendationCategory => {
  const scope = getChatScopeFromRoute(routePath, userRole, userEmail, isAuthenticated);
  if (scope === 'admin') return 'admin';
  if (scope === 'user' || scope === 'employees') return 'user';
  return 'public';
};

const HelpWidget: React.FC = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [widgetResetKey, setWidgetResetKey] = useState(0);
  const [routePath, setRoutePath] = useState(getCurrentRoutePath());
  const [recommendationSetIndex, setRecommendationSetIndex] = useState(0);
  const [hideRecommendationTopics, setHideRecommendationTopics] = useState(false);
  const [lastUserInteractionAt, setLastUserInteractionAt] = useState(() => Date.now());
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Lifewood AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressToggleUntilRef = useRef(0);

  const chatScope = getChatScopeFromRoute(routePath, profile?.role, user?.email, Boolean(user));
  const recommendationCategory = getRecommendationCategoryFromRoute(
    routePath,
    profile?.role,
    user?.email,
    Boolean(user)
  );
  const recommendationSets = RECOMMENDATION_TOPICS[recommendationCategory] || [];
  const recommendationTopics =
    recommendationSets[recommendationSetIndex % Math.max(1, recommendationSets.length)] || [];

  const markUserInteraction = () => {
    setLastUserInteractionAt(Date.now());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleRouteChange = () => {
      setRoutePath(getCurrentRoutePath());
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    setRecommendationSetIndex(0);
    setHideRecommendationTopics(false);
  }, [routePath, recommendationCategory]);

  useEffect(() => {
    if (!isOpen) return;

    const inactivityTimer = window.setTimeout(() => {
      setRecommendationSetIndex((previous) => {
        if (recommendationSets.length <= 1) return previous;
        return (previous + 1) % recommendationSets.length;
      });
      setHideRecommendationTopics(false);
      setMessages((previous) => [
        ...previous,
        { role: 'model', text: 'I added new recommended topics below if you want to continue.' },
      ]);
      setLastUserInteractionAt(Date.now());
    }, INACTIVITY_REFRESH_MS);

    return () => {
      window.clearTimeout(inactivityTimer);
    };
  }, [isOpen, lastUserInteractionAt, recommendationSets.length]);

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsExpanded(false);
    setHideRecommendationTopics(false);
    setWidgetResetKey((prev) => prev + 1);
  };

  const handleToggleChat = () => {
    if (Date.now() < suppressToggleUntilRef.current) return;

    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setWidgetResetKey((value) => value + 1);
        setIsExpanded(false);
      } else {
        markUserInteraction();
      }
      return next;
    });
  };

  const sendMessageToAssistant = async (userMessage: string) => {
    const trimmedMessage = (userMessage || '').trim();
    if (!trimmedMessage || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmedMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          scope: chatScope,
          routePath,
          userContext: {
            id: user?.id || '',
            email: user?.email || '',
            fullName:
              profile?.full_name ||
              user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              '',
            role: profile?.role || '',
          },
        }),
      });
      const data = await response.json().catch(() => ({} as Record<string, any>));

      if (!response.ok) {
        throw new Error((data as any)?.error || `Chat request failed (${response.status})`);
      }

      const modelText = typeof (data as any)?.text === 'string' ? (data as any).text : '';
      setMessages(prev => [...prev, { role: 'model', text: modelText || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Missing GEMINI_API_KEY')) {
        setMessages(prev => [...prev, { role: 'model', text: "Chatbot server is not configured yet. Add GEMINI_API_KEY to your .env (or .env.local) and restart the app." }]);
      } else if (
        errorMessage.includes('reported as leaked') ||
        errorMessage.includes('Gemini API key was reported as leaked')
      ) {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: "The chatbot API key is blocked right now. Please ask the admin to replace GEMINI_API_KEY and restart the app.",
          },
        ]);
      } else if (
        errorMessage.includes('not authorized') ||
        errorMessage.includes('PERMISSION_DENIED')
      ) {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            text: "The chatbot cannot access the AI service right now. Please verify the API key configuration.",
          },
        ]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    markUserInteraction();
    await sendMessageToAssistant(userMessage);
  };

  const handleRecommendationClick = async (topic: string) => {
    if (!topic || isLoading) return;
    setHideRecommendationTopics(true);
    setInput('');
    markUserInteraction();
    await sendMessageToAssistant(topic);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      key={widgetResetKey}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      onDragStart={() => {
        suppressToggleUntilRef.current = Date.now() + 320;
      }}
      onDragEnd={(_, dragInfo: any) => {
        const movedX = Math.abs(dragInfo?.offset?.x || 0);
        const movedY = Math.abs(dragInfo?.offset?.y || 0);
        if (movedX > 4 || movedY > 4) {
          suppressToggleUntilRef.current = Date.now() + 320;
        }
      }}
      className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end touch-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`mb-4 bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden flex flex-col ${
              isExpanded
                ? 'w-[min(calc(100vw-2rem),36rem)] h-[min(75vh,42rem)]'
                : 'w-[min(calc(100vw-2rem),24rem)] h-[32rem]'
            }`}
          >
            {/* Chat Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#d4f05c] flex items-center justify-center text-black font-bold text-xs">
                  LW
                </div>
                <div>
                  <p className="font-bold text-sm">Lifewood Assistant</p>
                  <p className="text-[10px] text-gray-400">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded((previous) => !previous)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={isExpanded ? 'Collapse chat' : 'Expand chat'}
                >
                  {isExpanded ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <polyline points="9 21 3 21 3 15"></polyline>
                      <line x1="21" y1="3" x2="14" y2="10"></line>
                      <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 10 14 10 20"></polyline>
                      <polyline points="20 10 14 10 14 4"></polyline>
                      <line x1="14" y1="10" x2="21" y2="3"></line>
                      <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                  )}
                </button>
                <button 
                  onClick={handleCloseChat}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Close chat"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-black text-white rounded-tr-none' 
                        : 'bg-white text-black border border-black/5 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-black border border-black/5 p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-black/5 bg-white shrink-0">
              {!hideRecommendationTopics ? (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Recommended Topics
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recommendationTopics.slice(0, 4).map((topic, topicIndex) => (
                      <button
                        key={`${recommendationCategory}-${recommendationSetIndex}-${topicIndex}`}
                        type="button"
                        onClick={() => handleRecommendationClick(topic)}
                        disabled={isLoading}
                        className="text-left text-xs px-3 py-2 rounded-xl border border-black/10 bg-gray-50 hover:bg-black hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    markUserInteraction();
                  }}
                  placeholder="Type your message..."
                  className="flex-grow bg-gray-50 border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#d4f05c] transition-colors"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-black text-white p-2 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-full p-1.5 shadow-2xl flex items-center gap-2 border border-black/5"
      >
        {/* Animated Gradient Logo */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#FFB347_0%,#FFD700_30%,#FFB347_50%,var(--color-lw-green)_75%,#FFB347_100%)]"
            style={{ 
              filter: 'blur(0.5px)',
            }}
          />
          {/* Subtle overlay to give it depth */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
          <div className="absolute inset-0 rounded-full border border-black/5" />
        </div>

        {/* Help Button */}
        <button 
          onClick={handleToggleChat}
          className="bg-black text-white rounded-full px-5 py-2 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {isOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            )}
          </svg>
          <span className="font-bold text-sm whitespace-nowrap">
            {isOpen ? 'Close chat' : 'How can I help?'}
          </span>
        </button>
      </motion.div>
      
      {!isOpen && (
        <div className="mt-2 text-[10px] text-lw-text-muted font-medium flex items-center gap-1">
          <span>Powered by</span>
          <span className="text-lw-text-dark font-bold">ElevenLabs</span>
          <span className="underline cursor-pointer">Agents</span>
        </div>
      )}
    </motion.div>
  );
};

export default HelpWidget;
