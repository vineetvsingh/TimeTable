import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Type', 'Setup', 'Activities', 'Timetable'];

// The four wizard steps, in order. Done steps get a tick, the current one is filled.
const StepIndicator = ({ currentStep }) => (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Progress">
        {STEPS.map((label, index) => {
            const num = index + 1;
            const done = currentStep > num;
            const current = currentStep === num;
            return (
                <li key={label} className={`flex items-center gap-2 sm:gap-3 last:flex-none ${current ? "flex-[1_0_auto]" : "min-w-0 flex-1"}`}>
                    <span
                        aria-current={current ? 'step' : undefined}
                        className={`flex items-center gap-2 ${current ? 'shrink-0' : 'min-w-0'}`}
                    >
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${current
                                ? 'bg-accent text-on-accent'
                                : done
                                    ? 'bg-accent-soft text-accent-ink'
                                    : 'border border-rule-strong text-muted'
                                }`}
                        >
                            {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : num}
                        </span>
                        <span
                            className={`text-sm ${current ? 'font-semibold text-ink' : 'hidden truncate text-muted sm:inline'}`}
                        >
                            {label}
                            {done && <span className="sr-only"> (done)</span>}
                        </span>
                    </span>
                    {num < STEPS.length && (
                        <span
                            aria-hidden="true"
                            className={`h-px min-w-4 flex-1 ${done ? 'bg-accent' : 'bg-rule-strong'}`}
                        />
                    )}
                </li>
            );
        })}
    </ol>
);

export default StepIndicator;
