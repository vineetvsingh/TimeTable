import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TIMETABLE_TYPES, WORKING_DAYS } from '../../constants';
import { useTimetable } from '../../context/TimetableContext';

const TypeSelection = () => {
    const { selectType } = useTimetable();
    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-ink sm:text-[1.75rem]">What are you planning?</h2>
            <p className="mt-1 text-muted">This sets which days of the week your timetable covers.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {TIMETABLE_TYPES.map((type) => (
                    <button
                        type="button"
                        key={type.id}
                        onClick={() => selectType(type.id)}
                        className="group flex w-full items-center gap-4 rounded-xl border border-rule bg-surface p-4 text-left transition-colors duration-150 hover:border-accent hover:bg-sunken/60 sm:p-5"
                    >
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${type.tone}`}>
                            <type.icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-display text-lg font-semibold text-ink">{type.name}</span>
                            <span className="block text-sm text-muted">{type.description}</span>
                            <span className="mt-1 block text-xs font-medium text-muted">
                                {WORKING_DAYS[type.id].length === 7
                                    ? 'All 7 days'
                                    : `${WORKING_DAYS[type.id][0].slice(0, 3)} to ${WORKING_DAYS[type.id].at(-1).slice(0, 3)}`}
                            </span>
                        </span>
                        <ChevronRight
                            className="h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-accent"
                            aria-hidden="true"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TypeSelection;
