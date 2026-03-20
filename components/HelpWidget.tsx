import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const getCurrentRoutePath = () => window.location.hash.substring(1) || '/';

const getChatScopeFromRoute = (routePath: string) => {
  if (routePath === '/admin') return 'admin';
  if (routePath === '/employees') return 'employees';
  if (routePath === '/user') return 'user';
  return 'public';
};

const HelpWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Lifewood AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const routePath = getCurrentRoutePath();
      const scope = getChatScopeFromRoute(routePath);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          scope,
          routePath,
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
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Chat Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#d4f05c] flex items-center justify-center text-black font-bold text-xs">
                  LW
                </div>
                <div>
                  <p className="font-bold text-sm">Lifewood Assistant</p>
                  <p className="text-[10px] text-gray-400">Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-[300px] bg-gray-50">
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 flex gap-2 bg-white">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
          onClick={() => setIsOpen(!isOpen)}
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
    </div>
  );
};

export default HelpWidget;
