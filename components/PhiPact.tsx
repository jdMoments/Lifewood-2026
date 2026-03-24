import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import CircularText from './CircularText';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

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

const MAP_URL = 'https://lifewoodworldwidemap.vercel.app/';
const MAP_ORIGIN = new URL(MAP_URL).origin;

const PhiPact: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mapLoadedRef = useRef(false);
  const pendingCountryRef = useRef<string | null>(null);
  const dispatchTimersRef = useRef<number[]>([]);
  const [secondSectionIndex, setSecondSectionIndex] = useState(0);
  const swipeStartXRef = useRef<number | null>(null);
  const secondSectionSlides = [
    {
      image: 'https://framerusercontent.com/images/7RZ9ESz7UTTmxn6ifh8I9jHlHA.png?width=1004&height=591',
      alt: 'Philanthropy and Impact base background',
    },
    {
      image:
        'https://png.pngtree.com/thumb_back/fh260/background/20230704/pngtree-philanthropic-giving-tuesday-3d-illustration-of-a-hand-offering-a-heart-image_3729837.jpg',
      alt: 'Philanthropic giving illustration',
    },
    {
      image:
        'https://media.licdn.com/dms/image/v2/D5612AQHmaBbIAZdQUA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1680624542878?e=2147483647&v=beta&t=nNF6jGr_gsZIIMLpaF56aubA_rqo-N3JABg2nBkTBlI',
      alt: 'Impact background',
    },
  ];

  const goToNextSecondSectionSlide = () => {
    setSecondSectionIndex((prev) => (prev + 1) % secondSectionSlides.length);
  };

  const goToPrevSecondSectionSlide = () => {
    setSecondSectionIndex((prev) => (prev - 1 + secondSectionSlides.length) % secondSectionSlides.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      goToNextSecondSectionSlide();
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      dispatchTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      dispatchTimersRef.current = [];
    };
  }, []);

  const clearDispatchTimers = () => {
    dispatchTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    dispatchTimersRef.current = [];
  };

  const dispatchCountryToMap = (country: string) => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;

    const payloads: Array<string | Record<string, any>> = [
      { type: 'GO_TO_COUNTRY', country },
      { type: 'SELECT_COUNTRY', name: country },
      { type: 'ZOOM_TO_COUNTRY', country, zoom: 6 },
      { type: 'FLY_TO_COUNTRY', country, zoom: 6 },
      { action: 'goToCountry', country, zoom: 6 },
      { action: 'selectCountry', country },
      { event: 'country:selected', country, zoom: 6 },
      { country, zoom: 6 },
      country,
      JSON.stringify({ type: 'GO_TO_COUNTRY', country, zoom: 6 }),
    ];

    payloads.forEach((payload) => {
      targetWindow.postMessage(payload, MAP_ORIGIN);
      targetWindow.postMessage(payload, '*');
    });
  };

  const requestMapCountryFocus = (country: string) => {
    pendingCountryRef.current = country;
    if (!mapLoadedRef.current) return;

    clearDispatchTimers();
    const retryDelays = [0, 150, 400, 900];
    dispatchTimersRef.current = retryDelays.map((delay) =>
      window.setTimeout(() => {
        dispatchCountryToMap(country);
      }, delay)
    );
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin && event.origin !== MAP_ORIGIN) return;

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
    requestMapCountryFocus(country);
  };

  return (
    <div className="pt-32 bg-white min-h-screen">
      {/* Scroll Stack: Hero + 2nd Section */}
      <ScrollStack
        className="bg-white"
        useWindowScroll
        itemDistance={90}
        itemScale={0.04}
        itemStackDistance={34}
        stackPosition="18%"
        scaleEndPosition="9%"
        baseScale={0.88}
        scaleDuration={0.35}
      >
        <ScrollStackItem itemClassName="h-screen overflow-hidden">
          <section className="relative h-screen px-8 md:px-20 py-20 overflow-hidden rounded-b-[2.25rem]">
            <div className="absolute inset-0">
              <img
                src="https://media.licdn.com/dms/image/v2/D4E12AQFDWgd9kxtITg/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1688130546295?e=2147483647&v=beta&t=UJe-QlKFtnmHqkhnXpz4Fmqvxm54Km-mCJ1P5CU1dq0"
                alt="Philanthropy hero background"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-white/78"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
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
              <div className="flex items-center">
                <a
                  href="#"
                  className="relative inline-flex items-center group no-underline"
                >
                  <span className="px-8 pr-14 py-3 bg-[#FFB347] text-black font-semibold rounded-full transition-all duration-300 group-hover:pr-12 group-hover:bg-[#FFA500]">
                    Contact Us
                  </span>
                  <span className="absolute right-2 w-9 h-9 bg-[#FFD082] text-black rounded-full flex items-center justify-center transition-all duration-300 translate-x-1 group-hover:translate-x-0 group-hover:bg-[#FFB347]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </section>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="h-screen overflow-hidden rounded-[2.25rem] shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
          <section
            className="relative w-full h-screen overflow-hidden"
            onPointerDown={(event) => {
              swipeStartXRef.current = event.clientX;
            }}
            onPointerUp={(event) => {
              if (swipeStartXRef.current === null) return;
              const deltaX = event.clientX - swipeStartXRef.current;
              if (deltaX > 70) {
                goToPrevSecondSectionSlide();
              } else if (deltaX < -70) {
                goToNextSecondSectionSlide();
              }
              swipeStartXRef.current = null;
            }}
            onPointerLeave={() => {
              swipeStartXRef.current = null;
            }}
          >
            <motion.img
              key={secondSectionSlides[secondSectionIndex].image}
              src={secondSectionSlides[secondSectionIndex].image}
              alt={secondSectionSlides[secondSectionIndex].alt}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
              draggable={false}
              initial={{ opacity: 0.35, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/42 to-black/35" />

            <AnimatePresence mode="wait">
              {secondSectionIndex === 1 && (
                <motion.div
                  key="slide-two-text"
                  initial={{ opacity: 0, x: -90 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute left-6 md:left-14 top-1/2 -translate-y-1/2 max-w-[92%] md:max-w-[42rem] bg-black/45 border border-white/30 backdrop-blur-md rounded-[2rem] p-6 md:p-10"
                >
                  <p className="text-white text-sm md:text-lg leading-relaxed">
                    Lifewood embodies a mission of empowerment by facilitating the exchange of vital resources, specialized
                    knowledge, and advanced technology to ensure communities and projects truly flourish. This approach
                    places a deep-seated human connection at the core of every initiative, ensuring that innovation is
                    always balanced with a commitment to global impact. By prioritizing the growth and well-being of
                    others, the organization transforms technical progress into a sustainable foundation for collective
                    success.
                  </p>
                </motion.div>
              )}

              {secondSectionIndex === 2 && (
                <motion.div
                  key="slide-three-impact"
                  initial={{ opacity: 0, x: -90 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute left-6 md:left-14 top-1/2 -translate-y-1/2 max-w-[92%] md:max-w-[42rem] bg-black/45 border border-white/30 backdrop-blur-md rounded-[2rem] p-6 md:p-10"
                >
                  <p className="text-[#FFB347] text-xs md:text-sm font-black uppercase tracking-[0.22em] mb-4">IMPACT</p>
                  <p className="text-white text-sm md:text-lg leading-relaxed">
                    This approach ensures that every contribution acts as a catalyst for meaningful transformation, bridging
                    the gap between current capabilities and future achievements. At its core, the effort is defined by a
                    dedication to uplifting others and creating a lasting, positive influence on a global scale.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {secondSectionSlides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setSecondSectionIndex(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${index === secondSectionIndex ? 'w-8 bg-white' : 'w-3 bg-white/55 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </section>
        </ScrollStackItem>
      </ScrollStack>

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
                src={MAP_URL} 
                className="w-full h-full border-none"
                title="Lifewood Worldwide Map"
                allow="fullscreen"
                onLoad={() => {
                  mapLoadedRef.current = true;
                  if (pendingCountryRef.current) {
                    requestMapCountryFocus(pendingCountryRef.current);
                  }
                }}
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
