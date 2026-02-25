
import { useState, useEffect } from 'react';

export function useCountUp(target: number, active: boolean): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    let animationFrameId: number;
    const t0 = performance.now();
    
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1600, 1);
      const easedProgress = 1 - Math.pow(1 - p, 3); // Ease out cubic
      setVal(Math.floor(easedProgress * target));
      
      if (p < 1) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [active, target]);

  return val;
}
