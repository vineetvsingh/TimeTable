import React from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Download, Pencil, Cloud, Printer, RotateCcw } from 'lucide-react';
import ConflictsPanel from './ConflictsPanel';
import TimetableGrid from './TimetableGrid';
import { useTimetable } from '../../context/TimetableContext';
import Button from '../ui/Button';

const GeneratedTimetable = () => {
    const {
        generatedTimetable,
        conflicts,
        timetableData,
        generateTimetable,
        exportTimetable,
        saveTimetable,
        isSaving,
        isSavedTimetable,
        setCurrentStep,
        resetGenerator
    } = useTimetable();

    const days = Object.keys(generatedTimetable);
    const filled = Object.values(generatedTimetable).reduce((total, day) => total + Object.keys(day).length, 0);
    const capacity = days.length * timetableData.timeSlots.length;
    const activityCount = timetableData.activities.length;

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <h2 className="truncate text-2xl font-bold text-ink sm:text-[1.75rem] print:text-black">
                        {timetableData.name || 'Your timetable'}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted print:hidden">
                        {conflicts.length === 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                No conflicts detected.
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 font-medium text-red-700 dark:text-red-300">
                                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                {conflicts.length} {conflicts.length === 1 ? 'problem' : 'problems'} to look at.
                            </span>
                        )}
                        <span>
                            {activityCount} {activityCount === 1 ? 'activity' : 'activities'} in {filled} of {capacity} slots across {days.length} days.
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:shrink-0 lg:flex-nowrap print:hidden">
                    <Button variant="secondary" size="sm" onClick={() => setCurrentStep(3)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={generateTimetable}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Regenerate
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" aria-hidden="true" />
                        Print
                    </Button>
                    <Button variant="secondary" size="sm" onClick={exportTimetable}>
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Export
                    </Button>
                    <Button size="sm" onClick={saveTimetable} disabled={isSaving}>
                        <Cloud className="h-4 w-4" aria-hidden="true" />
                        {isSaving ? 'Saving…' : isSavedTimetable ? 'Update saved copy' : 'Save to my timetables'}
                    </Button>
                </div>
            </div>

            <div className="mt-6 print:hidden">
                <ConflictsPanel conflicts={conflicts} />
            </div>

            <div className="mt-6 print:mt-4">
                <TimetableGrid
                    generatedTimetable={generatedTimetable}
                    timetableData={timetableData}
                    conflicts={conflicts}
                />
            </div>

            <div className="mt-8 border-t border-rule pt-6 print:hidden">
                <Button variant="ghost" onClick={resetGenerator}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Start over
                </Button>
            </div>
        </div>
    );
};

export default GeneratedTimetable;
