import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'motion/react';

interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: 'slowDown' | 'speedUp' | 'pause' | 'goBonkers' | '';
  className?: string;
}

const getRotationTransition = (duration: number, from: number, loop = true) => ({
  from,
  to: from + 360,
  ease: 'linear' as const,
  duration,
  type: 'tween' as const,
  repeat: loop ? Infinity : 0
});

const getTransition = (duration: number, from: number) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 300
  }
});

const CircularText: React.FC<CircularTextProps> = ({ 
  text, 
  spinDuration = 20, 
  onHover = 'speedUp', 
  className = '' 
}) => {
  const letters = Array.from(text);
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  }, [spinDuration, text, onHover, controls, rotation]);

  const handleHoverStart = () => {
    const start = rotation.get();
    if (!onHover) return;

    let transitionConfig;
    let scaleVal = 1;

    switch (onHover) {
      case 'slowDown':
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case 'speedUp':
        transitionConfig = getTransition(spinDuration / 4, start);
        break;
      case 'pause':
        transitionConfig = {
          rotate: { type: 'spring' as const, damping: 20, stiffness: 300 },
          scale: { type: 'spring' as const, damping: 20, stiffness: 300 }
        };
        scaleVal = 1;
        break;
      case 'goBonkers':
        transitionConfig = getTransition(spinDuration / 20, start);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(spinDuration, start);
    }

    controls.start({
      rotate: start + 360,
      scale: scaleVal,
      transition: transitionConfig
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  };

  return (
    <div className={`relative flex items-center justify-center w-32 h-32 ${className}`}>
      {/* Center Sun Element - Based on 2nd image */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="relative flex flex-col items-center">
          {/* Sun Circle */}
          <div className="relative flex items-center justify-center">
            {/* Soft Glow */}
            <div className="absolute w-10 h-10 bg-[#FFB347]/30 rounded-full blur-md"></div>
            {/* Main Circle with white hole */}
            <div className="w-6 h-6 rounded-full bg-[#FFB347] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
          {/* Downward Arrow - Based on 2nd image */}
          <div className="absolute top-full mt-2 flex flex-col items-center">
            <div className="w-[1px] h-16 bg-[#FFB347] opacity-60"></div>
            <div className="w-2.5 h-2.5 border-b border-r border-[#FFB347] rotate-45 -mt-2.5 opacity-80"></div>
          </div>
        </div>
      </div>

      {/* Rotating Text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ rotate: rotation }}
        initial={{ rotate: 0 }}
        animate={controls}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
      >
        {letters.map((letter, i) => {
          const rotationDeg = (360 / letters.length) * i;
          return (
            <span 
              key={i} 
              className="absolute text-[10px] font-bold text-[#4ADE80] uppercase tracking-widest"
              style={{ 
                transform: `rotate(${rotationDeg}deg) translateY(-45px)`,
                transformOrigin: 'center center'
              }}
            >
              {letter}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
};

export default CircularText;
