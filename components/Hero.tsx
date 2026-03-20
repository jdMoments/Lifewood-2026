import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';

type HeroSlide = {
  id: string;
  type: 'iframe' | 'video';
  src: string;
  title: string;
};

const SLIDE_DURATION_MS = 10000;
const SWIPE_THRESHOLD = 40;

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'wistia-intro',
    type: 'iframe',
    src: 'https://fast.wistia.net/embed/iframe/tckyta4hyq?playbar=true&playButton=false&smallPlayButton=true&qualityControl=true&playbackRateControl=true&volumeControl=false&settingsControl=true&controlsVisibleOnLoad=true&videoFoam=false&fullscreenButton=true&fitStrategy=none&playerColor=046421&autoPlay=true&muted=true&endVideoBehavior=loop',
    title: 'Lifewood Intro Video',
  },
  {
    id: 'current-background',
    type: 'video',
    src: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-binary-code-background-video-4835-large.mp4',
    title: 'Current Background Video',
  },
  {
    id: 'youtube-feature',
    type: 'iframe',
    src: 'https://www.youtube.com/embed/9LjMAJrOirU?autoplay=1&mute=1&loop=1&playlist=9LjMAJrOirU&controls=0&modestbranding=1&rel=0',
    title: 'Lifewood Feature Video',
  },
];

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [scrollStyle, setScrollStyle] = useState({ opacity: 1, transform: 'scale(1)' });
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const screenHeight = window.innerHeight;
      
      // The effect will complete over the first 60% of a viewport scroll
      const scrollPercent = Math.min(scrollY / (screenHeight * 0.6), 1);

      const opacity = 1 - scrollPercent;
      const scale = 1 - (scrollPercent * 0.1); // Scale down from 1 to 0.9

      setScrollStyle({
        opacity: opacity,
        transform: `scale(${scale})`,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [activeSlide]);

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const goToPreviousSlide = () => {
    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;

    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      goToNextSlide();
    } else {
      goToPreviousSlide();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      goToNextSlide();
    } else {
      goToPreviousSlide();
    }
  };

  return (
    <section 
      id="home" 
      className="sticky top-0 z-10 h-screen flex flex-col justify-center items-center text-center px-8 sm:px-12 md:px-20 overflow-hidden"
    >
      {/* Video Background */}
      <div
        className="absolute inset-0 z-0"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {slide.type === 'video' ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover pointer-events-none"
              >
                <source src={slide.src} type="video/mp4" />
                <source src="https://www.pexels.com/download/video/10922866/" type="video/mp4" />
              </video>
            ) : (
              <iframe
                src={slide.src}
                title={slide.title}
                className="w-full h-full pointer-events-none"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div 
        style={scrollStyle}
        className="transition-all duration-100 ease-linear relative z-10"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/40 rounded-full text-xs text-white tracking-widest uppercase font-semibold mb-7 bg-white/10 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="w-2 h-2 rounded-full bg-lw-green animate-pulse-dot inline-block" />
          {t('hero.subheading')}
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight max-w-5xl mb-7 text-white animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {t('hero.heading.part1')} <span className="text-lw-green">{t('hero.heading.part2')}</span> {t('hero.heading.part3')}
        </h1>

        <div
          className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.6s' }}
        >
          <a href="#/contact" className="px-9 py-4 bg-lw-green-light text-lw-green rounded-lg font-bold text-base no-underline shadow-lg shadow-lw-green-light/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-lw-green-light/50 hover:bg-lw-green-light/90 inline-block">
            {t('hero.ctaContact')}
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              index === activeSlide ? 'bg-lw-green-light scale-110' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
