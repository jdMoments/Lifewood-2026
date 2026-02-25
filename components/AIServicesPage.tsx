import React from 'react';
import { SERVICES_DATA } from '../constants';
import { useInView } from '../hooks/useInView';
import { useTranslation } from '../hooks/useTranslation';
import GlareHover from './GlareHover';
import ScrollFloat from './ScrollFloat';
import Threads from './Threads';
import OrbitImages from './OrbitImages';
import FloatingGlobe from './FloatingGlobe';

interface ServiceCardProps {
  icon: string;
  titleKey: string;
  descKey: string;
  delay: string;
  bgImage?: string;
  gridClasses?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, titleKey, descKey, delay, bgImage, gridClasses }) => {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const { t } = useTranslation();
  const hasBgImage = !!bgImage;

  return (
    <div 
      ref={ref} 
      className={`h-full ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${gridClasses}`}
      style={{ transitionDelay: delay, transitionProperty: 'opacity, transform', transitionDuration: '500ms' }}
    >
      <GlareHover
        glareColor="#ffffff"
        glareOpacity={0.3}
        glareAngle={-30}
        glareSize={300}
        transitionDuration={800}
        playOnce={false}
        className="h-full"
      >
        <div className={`group p-9 cursor-pointer relative overflow-hidden transition-all duration-500 ease-out hover:-translate-y-2 h-full ${hasBgImage ? 'bg-black' : 'bg-lw-bg-card hover:bg-[#e2ede4]'}`}>
          {hasBgImage && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${bgImage})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            </>
          )}

          <div className={`absolute inset-0 bg-gradient-to-br from-lw-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${hasBgImage ? 'hidden' : ''}`} />
          
          <div className="relative z-10 flex flex-col h-full">
            <div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 transition-all duration-300 group-hover:scale-110 ${hasBgImage ? 'bg-white/10 border border-white/25' : 'bg-lw-green/10 border border-lw-green/25 group-hover:bg-lw-green/20 group-hover:border-lw-green'}`}>
                {icon}
              </div>
              <h3 className={`text-lg font-bold mb-2.5 ${hasBgImage ? 'text-white' : 'text-lw-text-dark'}`}>{t(titleKey)}</h3>
              <p className={`text-sm leading-relaxed ${hasBgImage ? 'text-white/70' : 'text-lw-text-muted'}`}>{t(descKey)}</p>
            </div>
            <span className={`inline-block mt-auto text-xl transition-transform duration-300 group-hover:translate-x-1.5 self-start ${hasBgImage ? 'text-white/90' : 'text-lw-green'}`}>→</span>
          </div>
        </div>
      </GlareHover>
    </div>
  );
};

const AIServicesPage: React.FC = () => {
  const { t } = useTranslation();

  const dataAcquisitionImages = [
    "https://framerusercontent.com/images/yjMdJFr66IhvYe68neYuBjcicH0.jpg?width=3168&height=4752",
    "https://framerusercontent.com/images/NB7aENgh9ZJyVP5IyTOGJnVmQ.jpg?width=6720&height=4480",
    "https://framerusercontent.com/images/q7WBxGZtdVapY1wkpjR5DnoqoB8.jpg?width=5040&height=3360",
    "https://framerusercontent.com/images/EbS8XldkcKlgh0Xm4VrXKNJPFgI.jpg?width=5534&height=3694",
    "https://framerusercontent.com/images/7UqrKTFGE0Gn4FEGPuTbi5sk.jpg?width=6016&height=4016",
    "https://framerusercontent.com/images/3sCfN00csSYqscMgbgLnn0sbnoQ.jpg?width=3643&height=5464",
    "https://framerusercontent.com/images/Mg11nxppNqUGtQctTKiGgumMuo.jpg?width=4000&height=2667"
  ];

  return (
    <div className="relative bg-white min-h-screen">
      {/* First Section: Hero */}
      <section className="relative px-8 md:px-20 pt-48 pb-24 min-h-[80vh] flex flex-col justify-center bg-lw-bg-base z-10 overflow-hidden">
        <Threads 
          color={[0.11, 0.73, 0.33]} 
          amplitude={1.5} 
          distance={0.2} 
          enableMouseInteraction={true} 
        />
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-black"></div>
              <div className="w-5 h-5 rounded-full bg-white border border-black/20"></div>
            </div>
            <div className="h-[1px] w-32 bg-black/20"></div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-lw-text-dark mb-10 tracking-tight uppercase leading-none">
            AI DATA SERVICES
          </h1>
          
          <p className="text-black text-xl md:text-2xl max-w-5xl leading-relaxed mb-14 font-bold">
            Lifewood delivers end-to-end AI data solutions—from multi-language data collection and annotation to model training and generative AI content. Leveraging our global workforce, industrialized methodology, and proprietary LiFT platform, we enable organizations to scale efficiently, reduce costs, and accelerate decision-making with high-quality, domain-specific datasets.
          </p>
          
          <div className="flex items-center gap-6">
            <a 
              href="#/contact" 
              className="px-10 py-4 bg-[#FFB347] text-lw-text-dark rounded-full font-bold text-lg no-underline shadow-xl shadow-orange-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
            >
              Contact Us
            </a>
            <div className="w-12 h-12 rounded-full bg-lw-green-deep flex items-center justify-center text-white shadow-lg">
              <span className="text-lg">↗</span>
            </div>
          </div>
        </div>
      </section>

      {/* Second Section: Services Grid */}
      <section id="services" className="relative z-10 px-8 md:px-20 py-32 min-h-screen flex flex-col justify-center bg-white">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-px bg-lw-border border border-lw-border rounded-3xl overflow-hidden shadow-2xl shadow-lw-green/10">
            {SERVICES_DATA.map((c, i) => <ServiceCard key={i} {...c} delay={`${i * 0.1}s`} />)}
          </div>
        </div>
      </section>

      {/* Third Section: Video */}
      <section className="px-8 md:px-20 py-32 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="aspect-w-16 aspect-h-9 rounded-3xl overflow-hidden shadow-2xl border border-lw-border">
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/g_JvAVL0WY4?si=_gPN53-h0MYe6g6J" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Fourth Section: Comprehensive Data Solutions */}
      <section className="px-8 md:px-20 py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-2 text-lw-text-muted text-sm font-bold uppercase tracking-widest mb-4">
              <span>✦</span>
              <span>Why brands trust us</span>
            </div>
            <ScrollFloat 
              containerClassName="text-5xl md:text-7xl font-bold text-lw-text-dark mb-8 tracking-tight"
              animationDuration={1}
              stagger={0.03}
              scrollStart="top bottom-=10%"
              scrollEnd="bottom center"
            >
              Comprehensive Data Solutions
            </ScrollFloat>
            <div className="flex justify-center">
              <button className="group flex items-center gap-3 bg-lw-text-dark text-white px-8 py-3 rounded-full font-bold transition-all hover:bg-black">
                Get started
                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)]">
            
            {/* Data Validation - Tall Card */}
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="md:col-span-4 md:row-span-2"
              borderRadius="2.5rem"
            >
              <div className="bg-[#111] p-10 flex flex-col relative overflow-hidden text-white h-full">
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-6">Data Validation</h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    The goal is to create data that is consistent, accurate and complete, preventing data loss or errors in transfer, code or configuration.
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed">
                    We verify that data conforms to predefined standards, rules or constraints, ensuring the information is trustworthy and fit for its intended purpose.
                  </p>
                </div>
                <div className="mt-auto relative z-10">
                  <img 
                    src="https://framerusercontent.com/images/ZywE1VmIeWyUjcGlRI6E373zLc.png?width=668&height=791" 
                    alt="Data Validation" 
                    className="w-full h-auto object-contain transform translate-y-10"
                  />
                  <p className="text-[10px] text-white/30 mt-4">© 2025 Lifewood Data Technology</p>
                </div>
              </div>
            </GlareHover>

            {/* Data Collection */}
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="md:col-span-4"
              borderRadius="2.5rem"
            >
              <div className="bg-lw-bg-section p-8 flex flex-col relative overflow-hidden h-full">
                <h3 className="text-2xl font-bold mb-4">Data Collection</h3>
                <p className="text-lw-text-body text-xs leading-relaxed mb-6">
                  Lifewood delivers multi-modal data collection across text, audio, image, and video, supported by advanced workflows for categorization, labeling, tagging, transcription, sentiment analysis, and subtitle generation.
                </p>
                <div className="mt-auto bg-[#0a0a0a] rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col items-center min-h-[300px] z-10">
                  <div className="relative w-full h-32 mb-6">
                    <img 
                      src="https://framerusercontent.com/images/ayxRublSHK8bjPit8Z9EPhPsv4.png?width=6000&height=3375" 
                      alt="Folder" 
                      className="w-28 h-auto absolute left-1/2 top-1/2 -translate-y-1/2"
                      style={{ 
                        willChange: 'transform', 
                        opacity: 1, 
                        transform: 'translateX(-50%) rotateY(36.135deg)',
                      }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed font-medium text-center max-w-[220px] relative z-20">
                    Our scalable processes ensure accuracy and cultural nuance across 30+ languages and regions.
                  </p>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mb-10"></div>
                </div>
                {/* Wavy background decoration */}
                <div className="absolute bottom-0 left-0 w-full h-24 opacity-30 pointer-events-none">
                  <img 
                    src="https://framerusercontent.com/images/ayxRublSHK8bjPit8Z9EPhPsv4.png?width=6000&height=3375" 
                    className="w-full h-full object-cover object-bottom filter grayscale"
                    alt=""
                  />
                </div>
              </div>
            </GlareHover>

            {/* Data Acquisition */}
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="md:col-span-4"
              borderRadius="2.5rem"
            >
              <div className="bg-lw-bg-section p-8 flex flex-col relative overflow-hidden h-full">
                <h3 className="text-2xl font-bold mb-4">Data Acquisition</h3>
                <p className="text-lw-text-body text-xs leading-relaxed mb-6">
                  We provide end-to-end data acquisition solutions—capturing, processing, and managing large-scale, diverse datasets.
                </p>
                <div className="mt-auto flex justify-center items-center relative py-10 overflow-hidden">
                  <OrbitImages 
                    images={dataAcquisitionImages}
                    shape="circle"
                    radius={100}
                    itemSize={60}
                    duration={20}
                    responsive={true}
                    baseWidth={400}
                    centerContent={
                      <div className="w-40 h-40 opacity-80">
                        <FloatingGlobe />
                      </div>
                    }
                  />
                </div>
              </div>
            </GlareHover>

            {/* Data Curation */}
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="md:col-span-4"
              borderRadius="2.5rem"
            >
              <div className="bg-lw-bg-section p-8 flex flex-col relative overflow-hidden h-full">
                <h3 className="text-2xl font-bold mb-4">Data Curation</h3>
                <p className="text-lw-text-body text-xs leading-relaxed mb-8">
                  We sift, select and index data to ensure reliability, accessibility and ease of classification. Data can be curated to support business decisions, academic research, genealogies, scientific research and more.
                </p>
                <div className="mt-auto grid grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`aspect-square rounded-full ${i % 3 === 0 ? 'bg-lw-green-deep' : 'bg-orange-400'}`}></div>
                  ))}
                </div>
              </div>
            </GlareHover>

            {/* Data Annotation */}
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="md:col-span-4"
              borderRadius="2.5rem"
            >
              <div className="bg-lw-bg-section p-8 flex flex-col relative overflow-hidden h-full">
                <h3 className="text-2xl font-bold mb-4">Data Annotation</h3>
                <p className="text-lw-text-body text-xs leading-relaxed mb-8">
                  In the age of AI, data is the fuel for all analytic and machine learning. With our in-depth library of services, we're here to be an integral part of your digital strategy, accelerating your organization's cognitive systems development.
                </p>
                <div className="mt-auto">
                  <div className="bg-black text-white rounded-full py-3 px-6 text-[10px] leading-tight mb-6 inline-block">
                    Lifewood provides high quality annotation services for a wide range of mediums including text, image, audio and video for both computer vision and natural language processing.
                  </div>
                  <div className="flex justify-end">
                    <img src="https://picsum.photos/seed/hands/200/100" alt="Hands" className="w-32 h-auto opacity-80" />
                  </div>
                </div>
              </div>
            </GlareHover>

          </div>
        </div>
      </section>
    </div>
  );
};

export default AIServicesPage;