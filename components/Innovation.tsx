import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltImageProps {
  src: string;
  alt: string;
  className?: string;
}

const TiltImage: React.FC<TiltImageProps> = ({ src, alt, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer ${className}`}
    >
      <div
        style={{
          transform: "translateZ(50px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {/* Subtle inner glow/overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center block transition-transform duration-500 group-hover:scale-105"
        style={{ borderRadius: 'inherit' }}
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};

const Innovation: React.FC = () => {
  return (
    <section id="innovation" className="py-24 bg-white dark:bg-[#050a05] px-8 md:px-20 overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold text-lw-text-dark dark:text-white text-center mb-16 tracking-tight">
          Constant Innovation: Unlimited Possibilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* First Photo - Global+ style */}
          <div className="md:col-span-4 h-[400px]">
            <TiltImage 
              src="https://framerusercontent.com/images/NB7aENgh9ZJyVP5IyTOGJnVmQ.jpg?width=1600" 
              alt="Global AI Data Projects"
              className="h-full w-full group"
            />
          </div>

          {/* Second Photo - Long image */}
          <div className="md:col-span-8 h-[400px]">
            <TiltImage 
              src="https://framerusercontent.com/images/sNxmbNlbSdjE4PpCqPIEhhq1z8w.png?scale-down-to=1024&width=3362&height=1892" 
              alt="Innovation Showcase"
              className="h-full w-full group"
            />
          </div>
        </div>

        <p className="text-lw-text-body dark:text-gray-400 text-center text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
          No matter the industry, size or the type of data involved, our solutions are capable of satisfying any AI-data processing requirement.
        </p>
      </div>
    </section>
  );
};

export default Innovation;
