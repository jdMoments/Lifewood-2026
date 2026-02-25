
import React, { useMemo } from 'react';

const Particles: React.FC = () => {
  const particleArray = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      size: (Math.random() > 0.7 ? 4 : 3),
      left: `${Math.random() * 100}%`,
      animationDuration: `${5 + Math.random() * 6}s`,
      animationDelay: `${Math.random() * 9}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particleArray.map(p => (
        <div
          key={p.id}
          className="absolute bg-lw-green rounded-full opacity-0"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            animationName: 'particleRise',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

export default Particles;
