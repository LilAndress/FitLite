import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 80,
  strokeWidth = 6.5,
  label = 'Adherencia',
  sublabel = 'Semanal',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--accent-primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
        {/* Value in the center: Space Grotesk 700 with tabular figures */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-[var(--text-primary)] font-space leading-none">
            <AnimatedCounter value={percentage} suffix="%" duration={1000} />
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-[var(--text-primary)] font-space tracking-tight">
          {label}
        </span>
        <span className="text-[11px] text-[var(--text-secondary)] font-inter mt-0.5">
          {sublabel}
        </span>
      </div>
    </div>
  );
};
