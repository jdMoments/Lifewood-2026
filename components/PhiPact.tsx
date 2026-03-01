import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import CircularText from './CircularText';

const countries = [
  'Argentina',
  'Australia',
  'Bangladesh',
  'Brazil',
  'Canada',
  'China',
  'Egypt',
  'France',
  'Germany',
  'Hong Kong',
  'India',
  'Indonesia',
  'Italy',
  'Japan',
  'Kenya',
  'Malaysia',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Philippines',
  'Russia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Thailand',
  'United Kingdom',
  'United States of America',
  'Vietnam'
];

const PhiPact: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for messages from the map iframe
      // We expect the map to send the country name when a pin is clicked
      if (event.data) {
        let countryName = '';
        
        // Handle various message formats
        if (typeof event.data === 'object') {
          // Check common property names for country
          countryName = event.data.country || 
                        event.data.name || 
                        event.data.id || 
                        event.data.label ||
                        (event.data.type === 'COUNTRY_CLICKED' ? event.data.payload : '');
        } else if (typeof event.data === 'string') {
          // If it's a JSON string, try to parse it
          try {
            const parsed = JSON.parse(event.data);
            countryName = parsed.country || parsed.name || parsed.id;
          } catch (e) {
            // If not JSON, assume it's the country name directly
            countryName = event.data;
          }
        }

        if (countryName) {
          // Normalize and find the matching country in our list
          const normalizedInput = countryName.toLowerCase().trim();
          const matched = countries.find(c => {
            const normalizedCountry = c.toLowerCase().trim();
            return normalizedCountry === normalizedInput || 
                   normalizedCountry.includes(normalizedInput) || 
                   normalizedInput.includes(normalizedCountry);
          });
          
          if (matched) {
            setSelectedCountry(matched);
            // Scroll the list to the selected country
            const element = document.getElementById(`country-${matched.replace(/\s+/g, '-')}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Send message to the iframe to navigate to the country
      // We send multiple formats for maximum compatibility
      iframeRef.current.contentWindow.postMessage({ type: 'GO_TO_COUNTRY', country }, '*');
      iframeRef.current.contentWindow.postMessage({ type: 'SELECT_COUNTRY', name: country }, '*');
      iframeRef.current.contentWindow.postMessage(country, '*');
    }
  };

  return (
    <div className="pt-32 bg-white min-h-screen">
      {/* Hero Section */}
      <section className="px-8 md:px-20 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex -space-x-2">
              <div className="w-4 h-4 rounded-full bg-black"></div>
              <div className="w-4 h-4 rounded-full bg-white border border-black/20"></div>
            </div>
            <div className="h-[1px] w-24 bg-black/20"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-lw-text-dark mb-8 tracking-tight">
            Philanthropy and Impact
          </h1>
          
          <p className="text-lw-text-body text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
            We direct resources into education and developmental projects that create lasting change. 
            Our approach goes beyond giving: it builds sustainable growth and empowers communities for the future.
          </p>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="px-8 py-3 bg-[#FFB347] text-lw-text-dark rounded-full font-bold text-sm no-underline shadow-lg shadow-orange-200 transition-all hover:-translate-y-1"
            >
              Contact Us
            </a>
            <div className="w-10 h-10 rounded-full bg-lw-green-deep flex items-center justify-center text-white">
              <span className="text-xs">↗</span>
            </div>
          </div>
        </div>
      </section>

      {/* Full Screen Image Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <img 
          src="https://framerusercontent.com/images/7RZ9ESz7UTTmxn6ifh8I9jHlHA.png?width=1004&height=591" 
          alt="Philanthropy and Impact" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 w-full bg-white py-20 px-4 md:px-12 border-t border-lw-border">
          <div className="w-full flex flex-col items-center text-center">
            {/* Black Dot */}
            <div className="w-2 h-2 bg-black rounded-full mb-12"></div>
            
            {/* Vision Text - Full Width */}
            <p className="text-lg md:text-xl lg:text-[24px] font-normal text-black leading-[1.5] mb-12 w-full tracking-[1px] px-4">
              Our vision is of a world where financial investment plays a central role in solving the social and environmental challenges facing the global community, specifically in Africa and the Indian sub-continent
            </p>
            
            {/* Know Us Better Button - Resized and Merging Hover Effect */}
            <div className="flex items-center group cursor-pointer">
              <div className="flex items-center">
                <div className="px-6 py-2 bg-[#0D2319] text-white rounded-full font-semibold text-sm transition-all duration-300 group-hover:rounded-r-none group-hover:pr-2">
                  Know Us Better
                </div>
                <div className="w-9 h-9 bg-[#1a2e24] rounded-full ml-3 flex items-center justify-center text-white transition-all duration-300 group-hover:ml-0 group-hover:rounded-l-none group-hover:bg-[#0D2319]">
                  <span className="text-base">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Map Section */}
      <section className="px-8 md:px-20 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-[#0D2319] mb-6 tracking-tight leading-[1.1]">
                Transforming Communities<br />Worldwide
              </h2>
              <div className="h-1.5 w-24 bg-lw-green"></div>
            </div>
            <div className="md:pr-12">
              <CircularText text="be . amazed . be . amazed . " />
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Country List Side */}
            <div className="flex-1 bg-[#f8f9fa] rounded-[2rem] overflow-hidden shadow-lg h-[500px] p-8 flex flex-col border border-lw-border">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-lw-text-dark">Our Global Presence</h3>
                <p className="text-lw-text-body text-sm mt-1">Select a country to view on the map</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <ul className="space-y-2">
                  {countries.map((country) => (
                    <li 
                      key={country}
                      id={`country-${country.replace(/\s+/g, '-')}`}
                      onClick={() => handleCountryClick(country)}
                      className={`
                        cursor-pointer p-4 rounded-xl transition-all duration-300 border
                        ${selectedCountry === country 
                          ? 'bg-lw-green text-white border-lw-green shadow-md transform scale-[1.02]' 
                          : 'bg-white text-lw-text-dark border-transparent hover:bg-lw-green/5 hover:border-lw-green/20'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{country}</span>
                        {selectedCountry === country && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Map Side */}
            <div className="flex-[1.5] bg-[#e0f2f1] rounded-[2rem] overflow-hidden shadow-lg border border-lw-border relative min-h-[500px]">
              <iframe 
                ref={iframeRef}
                src="https://lifewoodworldwidemap.vercel.app/" 
                className="w-full h-full border-none"
                title="Lifewood Worldwide Map"
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact & Partnerships Section (4th Section) */}
      <section className="px-8 md:px-20 py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-32">
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-gray-400"></div>
              <span className="text-xl font-medium text-gray-600">Impact</span>
            </div>
            <div className="md:w-2/3">
              <p className="text-3xl md:text-4xl font-medium text-[#0D2319] leading-tight text-right">
                Through purposeful partnerships and sustainable investment, we empower communities across Africa and the Indian sub-continent to create lasting economic and social transformation.
              </p>
            </div>
          </div>

          {/* Partnership Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-32">
            <h3 className="text-4xl font-bold text-[#0D2319]">Partnership</h3>
            <p className="text-gray-500 leading-relaxed text-sm lg:text-base">
              In partnership with our philanthropic partners, Lifewood has expanded operations in South Africa, Nigeria, Republic of the Congo, Democratic Republic of the Congo, Ghana, Madagascar, Benin, Uganda, Kenya, Ivory Coast, Egypt, Ethiopia, Niger, Tanzania, Namibia, Zambia, Zimbabwe, Liberia, Sierra Leone, and Bangladesh.
            </p>
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="rounded-2xl overflow-hidden shadow-sm"
            >
              <img 
                src="https://framerusercontent.com/images/H6g74f7ON0rYqleh3DuDC7wLLn4.png?scale-down-to=512&width=1004&height=591" 
                alt="Partnership" 
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* Application Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="rounded-2xl overflow-hidden shadow-sm order-2 lg:order-1 aspect-[4/3] lg:aspect-[3/2]"
            >
              <img 
                src="https://framerusercontent.com/images/06PBWoX2dQvZzJ4GCFpMLVH9ZA.jpg?scale-down-to=1024&width=3458&height=5187" 
                alt="Application" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <p className="text-gray-500 leading-relaxed text-sm lg:text-base order-3 lg:order-2 text-center lg:text-left">
              This requires the application of our methods and experience for the development of people in under resourced economies.
            </p>
            <h3 className="text-4xl font-bold text-[#0D2319] order-1 lg:order-3 text-right">Application</h3>
          </div>

          {/* Expanding Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-32">
            <h3 className="text-4xl font-bold text-[#0D2319]">Expanding</h3>
            <p className="text-gray-500 leading-relaxed text-sm lg:text-base">
              We are expanding access to training, establishing equiatable wage structures and career and leadership progression to create sustainable change, by equipping individuals to take the lead and grow the business for themselves for the long term benefit of everyone.
            </p>
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="rounded-2xl overflow-hidden shadow-sm"
            >
              <img 
                src="https://framerusercontent.com/images/YuQdLXDoPq70vyVGWddKObRr4.png?scale-down-to=512&width=599&height=394" 
                alt="Expanding" 
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* Footer Text */}
          <div className="text-center py-20">
            <h2 className="text-4xl md:text-5xl font-medium text-[#0D2319] tracking-tight">
              Working with new intelligence for a better world.
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PhiPact;
