import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { formatDuration, formatSlotRange, slotMinutesOf } from '../../utils/time';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Firestore returns map keys alphabetically, so put days back in week order.
const orderedDays = (schedule) =>
    Object.keys(schedule).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

const TimetableGrid = ({ generatedTimetable, timetableData, conflicts = [] }) => {
    const { darkMode } = useTheme();
    const days = orderedDays(generatedTimetable);
    const slots = timetableData.timeSlots;
    const slotMinutes = slotMinutesOf(timetableData);

    // A multi-hour activity is drawn once, in its first hour, spanning the
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
        <div className="overflow-x-auto rounded-xl shadow-xl print:overflow-visible print:shadow-none print-colors">
            <table className="w-full min-w-[640px] print:min-w-0 border-collapse bg-white dark:bg-gray-800">
                <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-500 dark:bg-gray-900 dark:bg-none">
                        <th scope="col" className="p-4 text-left font-bold text-white dark:text-gray-300">
                            Time
                        </th>
                        {days.map(day => (
                            <th key={day} scope="col" className="p-4 text-center font-bold text-white dark:text-gray-300">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {slots.map((slot, slotIndex) => (
                        <tr key={slot} className={slotIndex % 2 === 0 ? ('bg-gray-50 dark:bg-gray-800') : ('bg-white dark:bg-gray-700')}>
                            <th scope="row" className="p-4 text-left font-semibold whitespace-nowrap text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-900">
                                {formatSlotRange(slot, slotMinutes)}
                            </th>
                            {days.map(day => {
                                const { entry, span, covered } = cellInfo(day, slotIndex);
                                if (covered) return null;

                                return (
                                    <td key={day} rowSpan={span} className="p-2 align-top h-px">
                                        {entry ? (
                                            <div className={`h-full p-3 rounded-lg shadow-md transition-shadow duration-200 hover:shadow-xl ${darkMode ? entry.colorDark : entry.colorLight
                                                } ${entry.borderColor} border-l-4`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-sm text-gray-800 dark:text-white">
                                                        {entry.name}
                                                    </span>
                                                    {conflicts.some(c => c.day === day && c.time === slot) && (
                                                        <AlertCircle className="w-4 h-4 text-red-500 ml-1" aria-label="Conflict" />
                                                    )}
                                                </div>
                                                {span > 1 && (
                                                    <div className="text-xs mt-1 text-gray-700 dark:text-gray-200">
                                                        ⏱️ {formatDuration(span * slotMinutes)}
                                                    </div>
                                                )}
                                                {entry.instructor && (
                                                    <div className="text-xs mt-1 text-gray-700 dark:text-gray-200">
                                                        👤 {entry.instructor}
                                                    </div>
                                                )}
                                                {entry.room && (
                                                    <div className="text-xs text-gray-700 dark:text-gray-200">
                                                        📍 {entry.room}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center p-3 text-gray-400 dark:text-gray-500 italic">
                                                <span aria-hidden="true">-</span>
                                                <span className="sr-only">Free</span>
                                            </div>
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
