import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import StarBorder from './StarBorder';
import './ChromaGrid.css';

export interface ChromaGridItem {
  image?: string;
  title: string;
  subtitle?: string;
  handle?: string;
  location?: string;
  borderColor?: string;
  gradient?: string;
  url?: string;
  hideImage?: boolean;
}

interface ChromaGridProps {
  items?: ChromaGridItem[];
  className?: string;
  radius?: number;
  columns?: number;
  rows?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
  onItemClick?: (item: ChromaGridItem, index: number) => void;
  activeIndex?: number;
}

export const ChromaGrid: React.FC<ChromaGridProps> = ({
  items,
  className = '',
  radius = 300,
  columns = 3,
  rows = 2,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out',
  onItemClick,
  activeIndex
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const setX = useRef<((value: number) => void) | null>(null);
  const setY = useRef<((value: number) => void) | null>(null);
  const pos = useRef({ x: 0, y: 0 });

  const demo: ChromaGridItem[] = [
    { title: 'Alex Rivera', subtitle: 'Full Stack Developer', image: 'https://i.pravatar.cc/300?img=8', borderColor: '#4F46E5' },
    { title: 'Jordan Chen', subtitle: 'DevOps Engineer', image: 'https://i.pravatar.cc/300?img=11', borderColor: '#10B981' },
    { title: 'Morgan Blake', subtitle: 'UI/UX Designer', image: 'https://i.pravatar.cc/300?img=3', borderColor: '#F59E0B' },
    { title: 'Casey Park', subtitle: 'Data Scientist', image: 'https://i.pravatar.cc/300?img=16', borderColor: '#EF4444' },
    { title: 'Sam Kim', subtitle: 'Mobile Developer', image: 'https://i.pravatar.cc/300?img=25', borderColor: '#8B5CF6' },
    { title: 'Tyler Rodriguez', subtitle: 'Cloud Architect', image: 'https://i.pravatar.cc/300?img=60', borderColor: '#06B6D4' }
  ];

  const data = items?.length ? items : demo;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    setX.current = gsap.quickSetter(el, '--x', 'px');
    setY.current = gsap.quickSetter(el, '--y', 'px');

    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x: number, y: number) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true
    });
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    moveTo(e.clientX - rect.left, e.clientY - rect.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true
    });
  };

  const handleCardClick = (item: ChromaGridItem, index: number) => {
    onItemClick?.(item, index);
    const { url } = item;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${className}`}
      style={
        {
          '--r': `${radius}px`,
          '--cols': columns,
          '--rows': rows
        } as React.CSSProperties
      }
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {data.map((c, i) => (
        <StarBorder
          as="article"
          key={`${c.title}-${i}`}
          className={`chroma-card-shell ${activeIndex === i ? 'is-active' : ''}`}
          color={c.borderColor || '#f6bf4f'}
          speed="6s"
          thickness={1}
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c, i)}
        >
          <div
            className="chroma-card"
            style={
              {
                '--card-border': c.borderColor || 'rgba(14, 42, 30, 0.2)',
                '--card-gradient': c.gradient || 'linear-gradient(145deg, rgba(14, 42, 30, 0.08), rgba(14, 42, 30, 0.01))',
                cursor: c.url || onItemClick ? 'pointer' : 'default'
              } as React.CSSProperties
            }
          >
            <div className="chroma-img-wrapper">
              {c.image && !c.hideImage ? (
                <img src={c.image} alt={c.title} loading="lazy" />
              ) : (
                <div className="chroma-empty-frame" aria-hidden="true" />
              )}
            </div>
            <footer className="chroma-info">
              <h3 className="chroma-name">{c.title}</h3>
              {c.handle && <span className="handle">{c.handle}</span>}
              {c.subtitle && <p className="role">{c.subtitle}</p>}
              {c.location && <span className="location">{c.location}</span>}
            </footer>
          </div>
        </StarBorder>
      ))}
      <div className="chroma-overlay" />
      <div ref={fadeRef} className="chroma-fade" />
    </div>
  );
};

export default ChromaGrid;
