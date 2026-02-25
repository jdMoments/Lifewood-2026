import React, { useState, useEffect, useRef } from 'react';

const videoUrls = [
  "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-background-9937-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-binary-code-background-video-4835-large.mp4"
];

const Background: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<'video1' | 'video2'>('video1');
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);

  // This handler is only for the first video to transition to the second
  const handleFirstVideoEnd = () => {
    if (activeVideo === 'video1') {
        setActiveVideo('video2');
        videoRef2.current?.play().catch(() => {});
    }
  };
  
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      <video
        ref={videoRef1}
        src={videoUrls[0]}
        muted
        autoPlay
        playsInline
        preload="auto"
        onEnded={handleFirstVideoEnd}
        className={`absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${activeVideo === 'video1' ? 'opacity-100' : 'opacity-0'}`}
      />
      <video
        ref={videoRef2}
        src={videoUrls[1]}
        muted
        playsInline
        preload="auto"
        loop 
        className={`absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${activeVideo === 'video2' ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
};

export default Background;