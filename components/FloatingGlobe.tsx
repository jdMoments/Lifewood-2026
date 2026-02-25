import React from 'react';

const FloatingGlobe: React.FC = () => {
  const dots = [
    { top: '20%', left: '55%', delay: '0s' },
    { top: '40%', left: '20%', delay: '0.3s' },
    { top: '65%', left: '70%', delay: '0.6s' },
    { top: '80%', left: '35%', delay: '0.9s' },
    { top: '50%', left: '90%', delay: '1.2s' },
    { top: '30%', left: '85%', delay: '0.2s' },
    { top: '90%', left: '60%', delay: '0.7s' },
  ];

  return (
    <div className="animate-orb-float" style={{ perspective: '1000px', width: '100%', height: '100%' }}>
        {/* Rotating Ring */}
        <div className="absolute inset-0 border-[1px] border-lw-green/30 rounded-full animate-ring-rotate" style={{ transformStyle: 'preserve-3d' }}></div>

        {/* Main Globe Orb */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-lw-green/10 via-transparent to-transparent relative animate-globe-pulse shadow-2xl shadow-lw-green/10">
            {/* Globe Grid SVG - subtle grid lines */}
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-20" style={{transform: "rotateX(15deg) rotateY(-15deg)"}}>
                {/* Longitude lines */}
                <path d="M50,0 A50,50 0 0,1 50,100" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                <path d="M50,0 A50,50 0 0,0 50,100" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                <path d="M25,9.2 A60,60 0 0,1 75,9.2" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                <path d="M25,90.8 A60,60 0 0,0 75,90.8" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                <path d="M10.2,27.2 A70,70 0 0,1 89.8,27.2" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                <path d="M10.2,72.8 A70,70 0 0,0 89.8,72.8" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                {/* Latitude lines */}
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-lw-green"/>
            </svg>

             {/* Pulsing Dots */}
            {dots.map((dot, index) => (
                <div
                    key={index}
                    className="absolute w-1.5 h-1.5 bg-lw-green rounded-full animate-dot-pulse"
                    style={{
                        top: dot.top,
                        left: dot.left,
                        animationDelay: dot.delay,
                        transform: 'translate(-50%, -50%)',
                    }}
                ></div>
            ))}
        </div>
    </div>
  );
};

export default FloatingGlobe;