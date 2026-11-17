import React from 'react';
import { AlertCircle, Clock, User, MapPin } from 'lucide-react';
import { colorStyle } from '../../constants';
import { formatDuration, formatTime, slotMinutesOf, toMinutes } from '../../utils/time';
import { orderedDays } from '../../utils/exporters';

const iconClass = 'h-3 w-3 shrink-0';

const Meta = ({ icon, children }) => (
    <span className="flex min-w-0 items-center gap-1 text-xs text-muted">
        {icon}
        <span className="truncate">{children}</span>
    </span>
);

const TimetableGrid = ({ generatedTimetable, timetableData, conflicts = [] }) => {
    const days = orderedDays(generatedTimetable);
    const slots = timetableData.timeSlots;
    const slotMinutes = slotMinutesOf(timetableData);

    // A multi-slot activity is drawn once, in its first slot, spanning the
    // following rows; the cells it covers are skipped.
    const cellInfo = (day, slotIndex) => {
        const daySchedule = generatedTimetable[day] || {};
        const entry = daySchedule[slots[slotIndex]];
        if (!entry) return { entry: null, span: 1 };

        const prev = daySchedule[slots[slotIndex - 1]];
        if (prev && prev.id === entry.id) return { covered: true };

        let span = 1;
        while (daySchedule[slots[slotIndex + span]]?.id === entry.id) span++;
        return { entry, span };
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-rule bg-surface print:overflow-visible print:border-gray-300 print-colors">
            <table className="w-full min-w-[680px] table-fixed border-collapse print:min-w-0">
                <colgroup>
                    <col className="w-24 sm:w-28" />
                    {days.map(day => <col key={day} />)}
                </colgroup>
                <thead>
                    <tr className="border-b border-rule bg-sunken">
                        <th scope="col" className="sticky left-0 z-10 bg-sunken px-3 py-3 text-left text-xs font-medium text-muted sm:px-4">
                            Time
                        </th>
                        {days.map(day => (
                            <th key={day} scope="col" className="border-l border-rule px-3 py-3 text-left font-display text-sm font-semibold text-ink">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {slots.map((slot, slotIndex) => (
                        <tr key={slot} className="border-b border-rule last:border-b-0">
                            <th
                                scope="row"
                                className="sticky left-0 z-10 h-[5.25rem] whitespace-nowrap bg-surface px-3 py-2 text-left align-top tabular-nums sm:px-4 print:static print:h-auto print:py-1.5"
                            >
                                <span className="block text-sm font-semibold text-ink">{slot}</span>{' '}
                                <span className="block text-xs font-normal text-muted">
                                    to {formatTime(toMinutes(slot) + slotMinutes)}
                                </span>
                            </th>
                            {days.map(day => {
                                const { entry, span, covered } = cellInfo(day, slotIndex);
                                if (covered) return null;

                                return (
                                    <td key={day} rowSpan={span} className="h-px border-l border-rule p-1.5 align-top print:p-1">
                                        {entry ? (
                                            <div
                                                className={`flex h-full min-h-[4.5rem] flex-col gap-1 rounded-md border-l-[3px] px-2.5 py-2 print:min-h-0 print:gap-0.5 print:py-1 ${colorStyle(entry.color).block}`}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="text-sm font-semibold leading-snug text-ink">
                                                        {entry.name}
                                                    </span>
                                                    {conflicts.some(c => c.day === day && c.time === slot) && (
                                                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-label="Conflict" />
                                                    )}
                                                </div>
                                                {(span > 1 || entry.instructor || entry.room) && (
                                                    <div className="flex flex-col gap-1 print:flex-row print:flex-wrap print:gap-x-2.5 print:gap-y-0">
                                                        {span > 1 && <Meta icon={<Clock className={iconClass} aria-hidden="true" />}>{formatDuration(span * slotMinutes)}</Meta>}
                                                        {entry.instructor && <Meta icon={<User className={iconClass} aria-hidden="true" />}>{entry.instructor}</Meta>}
                                                        {entry.room && <Meta icon={<MapPin className={iconClass} aria-hidden="true" />}>{entry.room}</Meta>}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="sr-only">Free</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimetableGrid;
