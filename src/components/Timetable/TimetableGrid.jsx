import React from 'react';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Firestore returns map keys alphabetically, so put days back in week order.
const orderedDays = (schedule) =>
    Object.keys(schedule).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

const TimetableGrid = ({ generatedTimetable, timetableData, darkMode, getConflictIcon }) => {
    const days = orderedDays(generatedTimetable);
    const slots = timetableData.timeSlots;

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
            <table className={`w-full min-w-[640px] print:min-w-0 border-collapse ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <thead>
                    <tr className={darkMode ? 'bg-gray-900' : 'bg-gradient-to-r from-blue-500 to-purple-500'}>
                        <th scope="col" className={`p-4 text-left font-bold ${darkMode ? 'text-gray-300' : 'text-white'}`}>
                            Time
                        </th>
                        {days.map(day => (
                            <th key={day} scope="col" className={`p-4 text-center font-bold ${darkMode ? 'text-gray-300' : 'text-white'}`}>
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {slots.map((slot, slotIndex) => (
                        <tr key={slot} className={slotIndex % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-gray-50') : (darkMode ? 'bg-gray-700' : 'bg-white')}>
                            <th scope="row" className={`p-4 text-left font-semibold whitespace-nowrap ${darkMode ? 'text-gray-300 bg-gray-900' : 'text-gray-700 bg-gray-100'}`}>
                                {slot}
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
                                                    <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                                        {entry.name}
                                                    </span>
                                                    {getConflictIcon(day, slot)}
                                                </div>
                                                {span > 1 && (
                                                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        ⏱️ {span} hours
                                                    </div>
                                                )}
                                                {entry.instructor && (
                                                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        👤 {entry.instructor}
                                                    </div>
                                                )}
                                                {entry.room && (
                                                    <div className={`text-xs ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        📍 {entry.room}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`text-center p-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'} italic`}>
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
