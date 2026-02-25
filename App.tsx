import React, { useState, useEffect } from 'react';
import Background from './components/Background';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import AIServicesPage from './components/AIServicesPage';
import AIProjects from './components/AIProjects';
import InternalNews from './components/InternalNews';
import AboutPage from './components/AboutPage';
import OfficesPage from './components/OfficesPage';
import Tads from './components/Tads';
import THorizontal from './components/THorizontal';
import TVertical from './components/TVertical';
import TypeD from './components/TypeD';

import CareersPage from './components/CareersPage';
import PhiPact from './components/PhiPact';
import ContactUs from './components/ContactUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookiePolicy from './components/CookiePolicy';
import TermsAndConditions from './components/Term&Condition';
import SignIn from './components/SignIn';
import Admin from './components/Admin';
import CookieSettingsModal from './components/CookieSettingsModal';
import HelpWidget from './components/HelpWidget';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  // Get the current hash, defaulting to '/' for routing purposes
  const getCurrentRoute = () => window.location.hash.substring(1) || '/';
  const [route, setRoute] = useState(getCurrentRoute());
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      const routePath = currentHash.substring(1) || '/';
      
      setRoute(routePath);

      // If it's a simple ID hash (like #innovation), scroll to it
      if (currentHash && !currentHash.startsWith('#/')) {
        const id = currentHash.substring(1);
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        window.scrollTo(0, 0); // Scroll to top on page change
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  let currentPage;
  switch (route) {
    case '/aiservices':
      currentPage = <AIServicesPage />;
      break;
    case '/aiprojects':
      currentPage = <AIProjects />;
      break;
    case '/about':
      currentPage = <AboutPage />;
      break;
    case '/offices':
      currentPage = <OfficesPage />;
      break;
    case '/tads':
      currentPage = <Tads />;
      break;
    case '/horizontal':
      currentPage = <THorizontal />;
      break;
    case '/vertical':
      currentPage = <TVertical />;
      break;
    case '/typed':
      currentPage = <TypeD />;
      break;
    
    case '/careers':
      currentPage = <CareersPage />;
      break;
    case '/phipact':
      currentPage = <PhiPact />;
      break;
    case '/contact':
      currentPage = <ContactUs />;
      break;
    case '/internal-news':
      currentPage = <InternalNews />;
      break;
    case '/privacy-policy':
      currentPage = <PrivacyPolicy />;
      break;
    case '/cookie-policy':
      currentPage = <CookiePolicy />;
      break;
    case '/terms-and-conditions':
      currentPage = <TermsAndConditions />;
      break;
    case '/signin':
      currentPage = <SignIn />;
      break;
    case '/admin':
      currentPage = <Admin />;
      break;
    case '/':
    case 'innovation': // Handle the innovation ID as a route that shows HomePage
      currentPage = <HomePage />;
      break;
    default:
      currentPage = <HomePage />;
      break;
  }

  return (
    <LanguageProvider>
      <div className="font-sans transition-colors duration-300">
        {route !== '/aiprojects' && route !== '/internal-news' && route !== '/careers' && route !== '/offices' && route !== '/about' && route !== '/tads' && route !== '/horizontal' && route !== '/vertical' && route !== '/typed' && route !== '/phipact' && route !== '/contact' && route !== '/privacy-policy' && route !== '/cookie-policy' && route !== '/terms-and-conditions' && route !== '/signin' && route !== '/admin' && <Background />}
        {route !== '/signin' && route !== '/admin' && <Navbar />}
        <main>
          {currentPage}
        </main>
        {route !== '/signin' && route !== '/admin' && <Footer onCookieSettingsClick={() => setShowCookieSettings(true)} />}
        <HelpWidget />
        <CookieSettingsModal isOpen={showCookieSettings} onClose={() => setShowCookieSettings(false)} />
      </div>
    </LanguageProvider>
  );
};

export default App;
