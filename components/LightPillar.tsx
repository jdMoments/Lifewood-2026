import React from 'react';
import FloatingLines from './FloatingLines';

type LightPillarQuality = 'low' | 'medium' | 'high';

type LightPillarProps = {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  glowAmount?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  noiseIntensity?: number;
  pillarRotation?: number;
  interactive?: boolean;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
  quality?: LightPillarQuality;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const normalized = clean.length === 6 ? clean : 'ffffff';
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const hexToRgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
};

const QUALITY_LINE_COUNT: Record<LightPillarQuality, [number, number, number]> = {
  low: [5, 7, 5],
  medium: [7, 9, 7],
  high: [9, 12, 9],
};

const LightPillar: React.FC<LightPillarProps> = ({
  topColor = '#5227FF',
  bottomColor = '#FF9FFC',
  intensity = 1,
  rotationSpeed = 0.3,
  glowAmount = 0.002,
  pillarWidth = 3,
  pillarHeight = 0.4,
  noiseIntensity = 0.5,
  pillarRotation = 25,
  interactive = false,
  mixBlendMode = 'screen',
  quality = 'high',
  className = '',
}) => {
  const safeIntensity = clamp(intensity, 0.1, 1.6);
  const safePillarWidth = clamp(pillarWidth, 1, 8);
  const safePillarHeight = clamp(pillarHeight, 0.1, 1);
  const safeNoise = clamp(noiseIntensity, 0, 1);
  const safeRotation = clamp(pillarRotation, -90, 90) / 90;
  const lineDistance = clamp(3 + safePillarWidth * 0.8, 2.5, 9);

  const linesGradient = [topColor, bottomColor];
  const lineCount = QUALITY_LINE_COUNT[quality];
  const animationSpeed = clamp(rotationSpeed * 2.2, 0.1, 2.4);
  const glowBlurPx = clamp(glowAmount * 35000, 2, 30);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <FloatingLines
        className="absolute inset-0"
        linesGradient={linesGradient}
        enabledWaves={['top', 'middle', 'bottom']}
        lineCount={lineCount}
        lineDistance={[lineDistance, lineDistance + 1, lineDistance]}
        topWavePosition={{
          x: 9.5,
          y: 0.35 + safePillarHeight * 0.35,
          rotate: -0.35 - safeRotation * 0.45,
        }}
        middleWavePosition={{
          x: 5.2,
          y: 0.02 + safePillarHeight * 0.1,
          rotate: 0.15 + safeRotation * 0.25,
        }}
        bottomWavePosition={{
          x: 2.3,
          y: -0.75 + safePillarHeight * 0.2,
          rotate: 0.35 + safeRotation * 0.45,
        }}
        animationSpeed={animationSpeed}
        interactive={interactive}
        parallax={interactive}
        parallaxStrength={interactive ? 0.14 : 0.06}
        mixBlendMode={mixBlendMode}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: clamp(0.65 * safeIntensity, 0.2, 1),
          filter: `blur(${glowBlurPx}px)`,
          background: `
            radial-gradient(60% 40% at 50% 15%, ${hexToRgba(topColor, 0.22 + safeNoise * 0.15)} 0%, transparent 65%),
            radial-gradient(55% 45% at 55% 85%, ${hexToRgba(bottomColor, 0.2 + safeNoise * 0.14)} 0%, transparent 70%)
          `,
        }}
      />
    </div>
  );
};

export default LightPillar;
