import { memo, useEffect, useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  score: number;
  location?: string;
  onChangeLocation?: () => void;
}

const SIZE = 200;
const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

function tier(score: number) {
  if (score >= 80) return { label: 'SECURE', color: '#7C3AED' };
  if (score >= 60) return { label: 'MODERATE', color: '#FF9500' };
  if (score >= 40) return { label: 'ELEVATED', color: '#FF9500' };
  return { label: 'HIGH RISK', color: '#FF3B30' };
}

const ScoreRing = memo(({ score, location = 'Cape Town Central · Ward 57', onChangeLocation }: Props) => {
  const value = useCountUp(score, 1100);
  const { label, color } = tier(score);
  const offset = CIRC - (score / 100) * CIRC;

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ width: '100%', padding: '16px 0', textAlign: 'center' }}>
      <div style={{ width: SIZE, height: SIZE, margin: '0 auto', position: 'relative' }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} xmlns="http://www.w3.org/2000/svg">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="#1F1F1F" strokeWidth="6" fill="none" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={animate ? offset : CIRC}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 52 }}
          >
            {value}
          </text>
          <text
            x="50%"
            y="68%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em' }}
          >
            {label}
          </text>
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: SIZE,
          margin: '8px auto 0',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: '#555',
          letterSpacing: '0.2em',
        }}
      >
        <span>COMMUNITY</span>
        <span>GUARDIAN</span>
      </div>

      <button
        onClick={onChangeLocation}
        style={{
          marginTop: 12,
          fontSize: 12,
          color: '#555',
          background: 'transparent',
          border: 'none',
          cursor: onChangeLocation ? 'pointer' : 'default',
        }}
      >
        {location}
      </button>
    </div>
  );
});

ScoreRing.displayName = 'ScoreRing';
export default ScoreRing;
