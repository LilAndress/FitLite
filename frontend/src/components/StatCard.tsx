import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  variation?: {
    type: 'positive' | 'negative' | 'neutral';
    text: string;
  };
  subtitle?: string;
  isPrimary?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  decimals = 0,
  suffix = '',
  icon: Icon,
  variation,
  subtitle,
  isPrimary = false,
}) => {
  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
        isPrimary
          ? 'bg-[var(--surface)] border-[var(--border)] relative overflow-hidden'
          : 'bg-[var(--surface)] border-[var(--border)]'
      }`}
    >
      {/* Top: Icon outline on left + Variation badge on right */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border ${
              isPrimary
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] font-inter">
              {title}
            </h4>
          </div>
        </div>

        {variation && (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-space border ${
              variation.type === 'positive'
                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30'
                : variation.type === 'negative'
                ? 'text-[var(--accent-error)] bg-[var(--accent-error)]/10 border-[var(--accent-error)]/30'
                : 'text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 border-[var(--accent-secondary)]/30'
            }`}
          >
            {variation.type === 'positive' ? (
              <TrendingUp className="w-3 h-3" strokeWidth={2.2} />
            ) : (
              <TrendingDown className="w-3 h-3" strokeWidth={2.2} />
            )}
            <span>{variation.text}</span>
          </div>
        )}
      </div>

      {/* Metric: Big number in Space Grotesk 700 with tabular figures */}
      <div className="my-1.5">
        <div className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-space tracking-tight flex items-baseline gap-1.5">
          <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
        </div>
      </div>

      {/* Subtitle / Description in Inter 400 */}
      {subtitle && (
        <p className="text-xs text-[var(--text-secondary)] font-inter mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
