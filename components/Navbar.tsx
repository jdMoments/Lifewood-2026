import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import JoinModal from './JoinModal';

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const timeoutRef = React.useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      setIsMobileMenuOpen(false); // Close mobile menu on hash change
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleMouseEnter = (key: string) => {
    if (window.innerWidth < 1024) return; // Don't use hover on mobile
    if (timeoutRef.current[key]) {
      clearTimeout(timeoutRef.current[key]);
    }
    setActiveDropdown(key);
  };

  const handleMouseLeave = (key: string) => {
    if (window.innerWidth < 1024) return;
    timeoutRef.current[key] = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
  };

  const toggleDropdown = (key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  const isLinkActive = (href: string) => {
    if (href === '#/' && (currentHash === '#/' || currentHash === '')) return true;
    return currentHash === href;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-center animate-nav-slide-down">
      <div
        className="
          mt-5
          w-[95%]
          flex
          items-center
          justify-between
          px-6 lg:px-10
          py-3
          rounded-full
          backdrop-blur-xl
          bg-white/60
          dark:bg-black/40
          border
          border-white/30
          dark:border-white/10
          shadow-xl
          shadow-black/5
        "
      >
        <a href="#/" className="no-underline">
          <img
            src="https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png?width=1519&height=429"
            alt="Lifewood Logo"
            className="h-8 w-auto"
          />
        </a>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex gap-6 list-none items-center">
          {NAV_LINKS.map(link => {
            const active = isLinkActive(link.href);
            return (
              <li 
                key={link.key} 
                className="relative"
                onMouseEnter={() => handleMouseEnter(link.key)}
                onMouseLeave={() => handleMouseLeave(link.key)}
              >
                <a
                  href={link.href}
                  className={`flex items-center gap-1.5 relative no-underline text-sm font-medium transition-colors after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:rounded-full after:transition-all after:duration-300 
                    ${active 
                      ? 'text-[#FFB347] after:bg-[#FFB347] after:w-full' 
                      : 'text-lw-text-body dark:text-gray-300 hover:text-[#FFB347] after:bg-[#FFB347] after:w-0 hover:after:w-full'
                    }
                    ${activeDropdown === link.key ? 'text-[#FFB347] after:w-full' : ''}
                  `}
                >
                  {t(link.key)}
                  {link.children && (
                    <ChevronDownIcon className={`transition-transform duration-300 ${activeDropdown === link.key ? 'rotate-180' : ''}`} />
                  )}
                </a>

                {link.children && activeDropdown === link.key && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 block animate-dropdown-fade-in origin-top">
                    <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-lg border border-lw-border min-w-[240px]">
                      <ul className="space-y-1">
                        {link.children.map(child => {
                          const childActive = isLinkActive(child.href);
                          return (
                            <li key={child.key}>
                              <a
                                href={child.href}
                                className={`block text-left px-4 py-2 rounded-lg text-sm no-underline font-medium transition-colors 
                                  ${childActive 
                                    ? 'bg-[#FFB347]/10 text-[#FFB347]' 
                                    : 'text-lw-text-dark hover:bg-[#FFB347]/10 hover:text-[#FFB347]'
                                  }
                                `}
                              >
                                {t(child.key)}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          <li>
            <LanguageSwitcher />
          </li>
          <li>
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold no-underline transition-all duration-200 shadow-lg cursor-pointer transform-gpu origin-center hover:scale-105
                ${isJoinModalOpen 
                  ? 'bg-[#1a2e1a] text-white shadow-[#1a2e1a]/20' 
                  : 'bg-[#1a2e1a] text-white hover:bg-[#1a2e1a]/90 shadow-[#1a2e1a]/20'
                }
              `}
            >
              Join Now
            </button>
          </li>
          <li>
            <a 
              href="#/signin"
              className="px-5 py-2 rounded-full text-sm font-bold no-underline transition-all shadow-lg cursor-pointer hover:-translate-y-0.5 bg-[#1a2e1a] text-white hover:bg-[#1a2e1a]/90 shadow-[#1a2e1a]/20 inline-block"
            >
              Sign In
            </a>
          </li>
        </ul>

        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden text-lw-text-dark p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-1/2 -translate-x-1/2 w-[95%] mt-2 bg-white/95 dark:bg-black/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden lg:hidden"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <ul className="space-y-4 list-none p-0 m-0">
                {NAV_LINKS.map(link => {
                  const active = isLinkActive(link.href);
                  const hasChildren = !!link.children;
                  const isOpen = activeDropdown === link.key;

                  return (
                    <li key={link.key} className="border-b border-black/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <a
                          href={link.href}
                          className={`text-lg font-semibold no-underline transition-colors ${active ? 'text-[#FFB347]' : 'text-lw-text-dark dark:text-white'}`}
                          onClick={() => !hasChildren && setIsMobileMenuOpen(false)}
                        >
                          {t(link.key)}
                        </a>
                        {hasChildren && (
                          <button 
                            onClick={() => toggleDropdown(link.key)}
                            className="p-2 text-lw-text-muted"
                          >
                            <ChevronDownIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {hasChildren && isOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 ml-4 space-y-3 list-none p-0"
                        >
                          {link.children?.map(child => {
                            const childActive = isLinkActive(child.href);
                            return (
                              <li key={child.key}>
                                <a
                                  href={child.href}
                                  className={`block text-base no-underline transition-colors ${childActive ? 'text-[#FFB347]' : 'text-lw-text-body'}`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {t(child.key)}
                                </a>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </li>
                  );
                })}
                <li className="pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-lw-text-dark dark:text-white">Language</span>
                    <LanguageSwitcher />
                  </div>
                </li>
                <li className="pt-6 flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setIsJoinModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-4 bg-[#1a2e1a] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#1a2e1a]/20 hover:bg-[#1a2e1a]/90 transition-colors"
                  >
                    Join Now
                  </button>
                  <a 
                    href="#/signin"
                    className="w-full py-4 bg-[#1a2e1a] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#1a2e1a]/20 hover:bg-[#1a2e1a]/90 transition-colors no-underline text-center"
                  >
                    Sign In
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <JoinModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
