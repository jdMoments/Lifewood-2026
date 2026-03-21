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
import User from './components/User';
import Employees from './components/Employees';
import PendingApproval from './components/PendingApproval';
import CookieSettingsModal from './components/CookieSettingsModal';
import HelpWidget from './components/HelpWidget';
import { useAuth } from './context/AuthContext';

const ADMIN_EMAIL = 'damayojholmer@gmail.com';

const App: React.FC = () => {
  const { user, profile, isApproved, isAdmin, loading: authLoading } = useAuth();
  // Get the current hash, defaulting to '/' for routing purposes
  const getCurrentRoute = () => window.location.hash.substring(1) || '/';
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
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

  if (authLoading && !user && route !== '/signin' && !isLocalhost) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ade80]"></div>
      </div>
    );
  }

  const normalizedRole = (profile?.role || '').toString().trim().toLowerCase();
  const isEmployeeUser = normalizedRole === 'employee';
  const isAdminUser = (user?.email || '').trim().toLowerCase() === ADMIN_EMAIL || isAdmin;
  const isPendingApproval = Boolean(user) && !isAdminUser && !isApproved;

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
      if (!user) {
        currentPage = <SignIn />;
      } else if (isPendingApproval) {
        currentPage = <PendingApproval />;
      } else if (isAdminUser) {
        currentPage = <Admin />;
      } else if (isEmployeeUser) {
        currentPage = <Employees />;
      } else {
        currentPage = <User />;
      }
      break;
    case '/user':
      if (!user) {
        currentPage = <SignIn />;
      } else if (isPendingApproval) {
        currentPage = <PendingApproval />;
      } else if (isAdminUser) {
        currentPage = <Admin />;
      } else if (isEmployeeUser) {
        currentPage = <Employees />;
      } else {
        currentPage = <User />;
      }
      break;
    case '/employees':
      if (!user) {
        currentPage = <SignIn />;
      } else if (isPendingApproval) {
        currentPage = <PendingApproval />;
      } else if (isAdminUser) {
        currentPage = <Admin />;
      } else if (isEmployeeUser) {
        currentPage = <Employees />;
      } else {
        currentPage = <User />;
      }
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
    <div className="font-sans transition-colors duration-300">
      {route !== '/aiprojects' && route !== '/internal-news' && route !== '/careers' && route !== '/offices' && route !== '/about' && route !== '/tads' && route !== '/horizontal' && route !== '/vertical' && route !== '/typed' && route !== '/phipact' && route !== '/contact' && route !== '/privacy-policy' && route !== '/cookie-policy' && route !== '/terms-and-conditions' && route !== '/signin' && route !== '/admin' && route !== '/user' && route !== '/employees' && <Background />}
      {route !== '/signin' && route !== '/admin' && route !== '/user' && route !== '/employees' && <Navbar />}
      <main>
        {currentPage}
      </main>
      {route !== '/signin' && route !== '/admin' && route !== '/user' && route !== '/employees' && <Footer onCookieSettingsClick={() => setShowCookieSettings(true)} />}
      <HelpWidget />
      <CookieSettingsModal isOpen={showCookieSettings} onClose={() => setShowCookieSettings(false)} />
    </div>
  );
};

export default App;
