import React from 'react';

// The app mark: a week grid with a few periods filled in (same as favicon.svg).
const Logo = ({ className = 'h-8 w-8' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" className="fill-accent" />
    <g className="fill-on-accent">
      <rect x="12" y="12" width="11" height="24" rx="3" />
      <rect x="26.5" y="12" width="11" height="11" rx="3" opacity="0.45" />
      <rect x="41" y="12" width="11" height="11" rx="3" />
      <rect x="26.5" y="26" width="11" height="26" rx="3" />
      <rect x="41" y="26" width="11" height="11" rx="3" opacity="0.45" />
      <rect x="12" y="40" width="11" height="12" rx="3" opacity="0.45" />
      <rect x="41" y="40" width="11" height="12" rx="3" />
    </g>
  </svg>
);

export const Wordmark = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <Logo className="h-8 w-8 shrink-0" />
    <span className="font-display text-lg font-bold tracking-tight text-ink">Smart Timetable</span>
  </span>
);

export default Logo;
