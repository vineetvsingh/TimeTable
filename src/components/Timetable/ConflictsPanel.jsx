import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Problems found in the generated timetable, with a hint on how to fix them.
const ConflictsPanel = ({ conflicts }) => {
    if (conflicts.length === 0) return null;

    return (
        <section
            aria-labelledby="conflicts-heading"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-400/10"
        >
            <h3 id="conflicts-heading" className="flex items-center gap-2 font-sans text-base font-semibold text-amber-950 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Some activities didn't fit
            </h3>
            <ul className="mt-2 space-y-1.5">
                {conflicts.map((conflict, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-950 dark:text-amber-100">
                        <span
                            className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${conflict.severity === 'high'
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-400 text-gray-900'
                                }`}
                        >
                            {conflict.severity === 'high' ? 'High' : 'Medium'}
                        </span>
                        <span>{conflict.message}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-3 text-sm text-amber-900 dark:text-amber-200">
                To fix this, select more time slots, shorten long activities, or loosen their timing preferences, then regenerate.
            </p>
        </section>
    );
};

export default ConflictsPanel;
