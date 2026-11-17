import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Trash2, Printer, RefreshCw, AlertCircle, CalendarPlus } from 'lucide-react';
import { TIMETABLE_TYPES } from '../../constants';
import Button from '../ui/Button';

const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const typeOf = (id) => TIMETABLE_TYPES.find(t => t.id === id);

const iconAction =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink';

const SavedTimetables = ({ openTimetable, printTimetable }) => {
    const { savedTimetables, savedStatus, refreshSavedTimetables, deleteTimetable } = useTimetable();

    const header = (
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink sm:text-[1.75rem]">My timetables</h2>
            <p className="mt-1 text-muted">Timetables you've saved. Open one to view, print or edit it.</p>
        </div>
    );

    // Only show the full-page states when there is nothing to list yet; while
    // refreshing an existing list, keep showing it.
    if (savedTimetables.length === 0 && savedStatus === 'loading') {
        return (
            <div className="animate-fadeIn">
                {header}
                <div className="rounded-2xl border border-rule bg-surface py-16 text-center" role="status">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-accent" aria-hidden="true" />
                    <p className="mt-3 text-muted">Loading your timetables…</p>
                </div>
            </div>
        );
    }

    if (savedStatus === 'error' && savedTimetables.length === 0) {
        return (
            <div className="animate-fadeIn">
                {header}
                <div className="rounded-2xl border border-rule bg-surface px-6 py-16 text-center" role="alert">
                    <AlertCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-semibold text-ink">Couldn't load your timetables</h3>
                    <p className="mt-1 text-muted">Check your internet connection and try again.</p>
                    <Button size="sm" className="mt-5" onClick={refreshSavedTimetables}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Try again
                    </Button>
                </div>
            </div>
        );
    }

    if (savedTimetables.length === 0) {
        return (
            <div className="animate-fadeIn">
                {header}
                <div className="rounded-2xl border border-dashed border-rule-strong bg-surface px-6 py-16 text-center">
                    <CalendarPlus className="mx-auto h-8 w-8 text-faint" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-semibold text-ink">No saved timetables yet</h3>
                    <p className="mt-1 text-muted">Build a timetable, then choose Save to my timetables to keep it here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {header}
            <ul className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface">
                {savedTimetables.map((timetable) => {
                    const type = typeOf(timetable.type);
                    const name = timetable.name || 'Untitled timetable';
                    return (
                        <li key={timetable.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:px-5">
                            <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex ${type?.tone || 'bg-sunken text-muted'}`}>
                                {type ? <type.icon className="h-5 w-5" aria-hidden="true" /> : null}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-ink">{name}</p>
                                <p className="text-sm text-muted">
                                    {type ? type.name : 'Timetable'}, {timetable.activities?.length || 0} activities, {timetable.timeSlots?.length || 0} slots.
                                    {' '}Saved {formatDate(timetable.createdAt)}.
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openTimetable(timetable)}
                                    aria-label="Open timetable"
                                >
                                    Open
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => printTimetable(timetable)}
                                    className={iconAction}
                                    title="Print or save as PDF"
                                    aria-label="Print timetable"
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteTimetable(timetable.id)}
                                    className={`${iconAction} hover:text-red-600 dark:hover:text-red-400`}
                                    title="Delete"
                                    aria-label="Delete timetable"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default SavedTimetables;
