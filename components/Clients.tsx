import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CLIENT_LOGOS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

type PartnerHighlight = {
  image: string;
  summary: string;
};

const DEFAULT_YOUTUBE_SRC = 'https://www.youtube.com/embed/WsYfQmbgc6E?si=vE-4ZOLxLd6cCPMF';

const PARTNER_HIGHLIGHTS: Record<string, PartnerHighlight> = {
  NVIDIA: {
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUF8-STlpzLD-rHVP0-xlQqBRji6oke75OIA&s',
    summary:
      'The partnership officially reached a major milestone on January 12, 2026, during the J.P. Morgan Healthcare Conference. While the two companies began working together on supercomputing projects in October 2025, the full-scale strategic alliance and the announcement of their joint AI laboratory were finalized in early 2026.',
  },
  OpenAI: {
    image:
      'https://remarkable.net/_next/image/?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fcz3spuap%2Fproduction%2F1cf416c3af19a6c90747f05082707958c475c813-1602x900.jpg&w=3840&q=75',
    summary:
      "Lifewood's strategic collaboration with OpenAI began in early 2024, focusing on the delivery of high-fidelity, human-annotated datasets required to train frontier generative models. The partnership is defined as a high-precision data supply chain where Lifewood provides the localized, multi-language, and specialized historical data necessary to refine OpenAI's natural language understanding and image recognition accuracy. Through this alliance, Lifewood integrates OpenAI's advanced API tools to automate internal workflows, ensuring that massive datasets meet the rigorous quality standards demanded by next-generation AI systems.",
  },
  IBM: {
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgM06r74SGd5OIea7ALozBmRCTpawYojaH4w&s',
    summary:
      "The collaboration is defined by Lifewood's utilization of the IBM watsonx platform to provide enterprise-grade data governance and automated transcription services for highly regulated industries. By embedding IBM's Granite AI models and secure cloud infrastructure, Lifewood is able to scale its data processing workflows while ensuring strict compliance and data sovereignty for its global clients. This partnership empowers Lifewood to transform massive volumes of unstructured historical and corporate data into high-fidelity, AI-ready assets using IBM's industry-leading security framework.",
  },
  Google: {
    image: 'https://www.shutterstock.com/shutterstock/videos/22768090/thumb/1.jpg?ip=x480',
    summary:
      "The partnership between Lifewood Data Technology and Google officially launched in late 2024, centered on the integration of Lifewood's data solutions with Google Cloud's ecosystem. This collaboration is defined by Lifewood's use of Google Vertex AI and the Gemini model family to automate the extraction of high-fidelity insights from massive, unstructured datasets. By leveraging Google's planet-scale infrastructure, Lifewood provides the high-quality, human-annotated data necessary to refine Google's machine learning models across diverse languages and cultural contexts.",
  },
  Microsoft: {
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgZwO5z11Sh62FymqER6-jyam63aAQuiWCPg&s',
    summary:
      "The partnership between Lifewood Data Technology and Microsoft (Windows) officially began in mid-2024, following Lifewood's integration into the Microsoft AI Cloud Partner Program. This collaboration is defined by Lifewood's use of the Microsoft Azure cloud and Windows-based AI development tools to scale its high-fidelity data labeling and transcription services. By leveraging Microsoft 365 Copilot and Azure AI Studio, Lifewood has enhanced its ability to process complex historical and genealogical records with enterprise-grade security and speed.",
  },
  Amazon: {
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAlodU_pe3x4vorJoBqf3swGJAl4xuJOBJfg&s',
    summary:
      'The partnership between Lifewood Data Technology and Amazon (AWS) officially commenced in late 2024, following Lifewood\'s induction into the AWS Partner Network to accelerate its cloud-native AI initiatives. The collaboration is defined by Lifewood\'s integration of Amazon Bedrock and SageMaker to deploy high-performance foundation models for automated data labeling and genealogical record processing. By utilizing AWS\'s global infrastructure, Lifewood is able to scale its proprietary "LiFT" platform to handle massive, unstructured datasets with enterprise-grade security and sub-second latency.',
  },
  Meta: {
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.svg',
    summary:
      'Lifewood and Meta collaboration highlights are focused on AI data quality, multilingual annotation readiness, and scalable enterprise delivery support for evolving model requirements.',
  },
  Apple: {
    image: 'https://images.stockcake.com/public/1/c/5/1c5f326a-d867-4ac6-ba64-47b3edb9f752_large/illuminated-apple-logo-stockcake.jpg',
    summary:
      "The partnership between Lifewood Data Technology and Apple officially commenced in late 2024, following Apple's expansion of its \"Apple Intelligence\" ecosystem to include specialized third-party data providers. The collaboration is defined by Lifewood's role in providing high-precision, human-annotated datasets that are essential for training the on-device and private cloud models used in Apple Intelligence. By leveraging Lifewood's expertise in localized data and genealogical records, the partnership enhances the accuracy of Siri's natural language processing and the visual intelligence features found on iPhone and Mac.",
  },
};

const LOGO_FALLBACKS: Record<string, string> = {
  Meta: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.svg',
};

type ActiveSpotlight = { name: string; token: number };

const Clients: React.FC = () => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [activeSpotlight, setActiveSpotlight] = useState<ActiveSpotlight | null>(null);

  useEffect(() => {
    if (!activeSpotlight) return;
    const timeoutId = window.setTimeout(() => {
      setActiveSpotlight(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [activeSpotlight]);

  const logoSourceByName = useMemo(() => {
    return CLIENT_LOGOS.reduce<Record<string, string>>((acc, logo) => {
      acc[logo.name] = logo.src;
      return acc;
    }, {});
  }, []);

  const activeHighlight = activeSpotlight ? PARTNER_HIGHLIGHTS[activeSpotlight.name] : null;
  const mediaKey = activeSpotlight ? `media-${activeSpotlight.name}-${activeSpotlight.token}` : 'media-default';
  const textKey = activeSpotlight ? `text-${activeSpotlight.name}-${activeSpotlight.token}` : 'text-default';

  // Duplicate the logos to create a seamless scrolling effect.
  const doubledLogos = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <section className="relative z-10 py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Media Column */}
        <div className="rounded-2xl shadow-2xl overflow-hidden aspect-video bg-black/5 relative">
          <AnimatePresence mode="wait">
            {activeHighlight ? (
              <motion.img
                key={mediaKey}
                src={activeHighlight.image}
                alt={`${activeSpotlight?.name} partnership`}
                className="w-full h-full object-cover absolute inset-0"
                initial={{ opacity: 0, x: -42, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 28, scale: 1.02 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
                onError={(event) => {
                  const name = activeSpotlight?.name || '';
                  const fallbackSrc = LOGO_FALLBACKS[name] || logoSourceByName[name];
                  if (!fallbackSrc) return;
                  const target = event.currentTarget;
                  if (target.src === fallbackSrc) return;
                  target.src = fallbackSrc;
                }}
              />
            ) : (
              <motion.div
                key={mediaKey}
                className="absolute inset-0"
                initial={{ opacity: 0, x: -42, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 28, scale: 1.02 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={DEFAULT_YOUTUBE_SRC}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Content Column */}
        <div className="text-left">
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-6">{t('clients.heading')}</h2>
          <div className="mb-12 min-h-[132px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={textKey}
                className="text-lw-text-body text-lg leading-relaxed"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {activeHighlight ? activeHighlight.summary : t('clients.paragraph')}
              </motion.p>
            </AnimatePresence>
          </div>

          <div
            ref={ref}
            className="w-full overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div className="flex w-max animate-scroll-clients">
              {doubledLogos.map((logo, index) => (
                <div key={`${logo.name}-${index}`} className="px-12 flex-shrink-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (!PARTNER_HIGHLIGHTS[logo.name]) return;
                      setActiveSpotlight({ name: logo.name, token: Date.now() });
                    }}
                    className="bg-transparent border-none p-0 cursor-pointer"
                    aria-label={`Show ${logo.name} partnership details`}
                  >
                    <img
                      src={logo.src}
                      alt={`${logo.name} logo`}
                      onError={(event) => {
                        const fallbackSrc = LOGO_FALLBACKS[logo.name];
                        if (!fallbackSrc) return;
                        const target = event.currentTarget;
                        if (target.src === fallbackSrc) return;
                        target.src = fallbackSrc;
                      }}
                      className={`h-10 md:h-12 max-w-[180px] w-auto object-contain grayscale opacity-60 transition-all duration-700 ease-in-out hover:grayscale-0 hover:opacity-100 ${
                        inView ? 'scale-x-100' : 'scale-x-50'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Clients;
