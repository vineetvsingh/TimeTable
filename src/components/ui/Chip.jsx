import React from 'react';
import { Check } from 'lucide-react';

// A toggle button for picking time slots, days and times.
// tone="avoid" marks a selection that means "not this one" (shown in red).

const TONES = {
  default: 'bg-accent-soft text-accent-ink border-accent',
  avoid: 'bg-red-50 text-red-800 border-red-400 dark:bg-red-400/15 dark:text-red-200 dark:border-red-400/60'
};

const Chip = ({ selected, tone = 'default', className = '', children, ...props }) => (
  <button
    type="button"
    aria-pressed={selected}
    className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-sm font-medium tabular-nums transition-colors duration-150 ${selected
      ? TONES[tone]
      : 'bg-surface text-ink border-rule-strong hover:border-muted'
      } ${className}`}
    {...props}
  >
    {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
    {children}
  </button>
);

export default Chip;
