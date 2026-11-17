import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Calendar, Download, Trash2, Clock, User, Printer, RefreshCw, AlertCircle } from 'lucide-react';

const SavedTimetables = ({ openTimetable, printTimetable }) => {
    const { savedTimetables, savedStatus, refreshSavedTimetables, deleteTimetable } = useTimetable();
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'school':
            case 'college':
                return <Calendar className="w-5 h-5" />;
            case 'personal':
                return <User className="w-5 h-5" />;
            case 'work':
                return <Clock className="w-5 h-5" />;
            default:
                return <Calendar className="w-5 h-5" />;
        }
    };

    // Only show the full-page states when there is nothing to list yet; while
    // refreshing an existing list, keep showing it.
    if (savedTimetables.length === 0 && (savedStatus === 'loading')) {
        return (
            <div className="text-center py-12" role="status">
                <RefreshCw className="w-10 h-10 mx-auto mb-4 animate-spin text-purple-500" aria-hidden="true" />
                <p className="text-gray-600 dark:text-gray-300">Loading your timetables...</p>
            </div>
        );
    }

    if (savedStatus === 'error' && savedTimetables.length === 0) {
        return (
            <div className="text-center py-12" role="alert">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                    Couldn't load your timetables
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Check your internet connection and try again.
                </p>
                <button
                    type="button"
                    onClick={refreshSavedTimetables}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg"
                >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Try again
                </button>
            </div>
        );
    }

    if (savedTimetables.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                    No Saved Timetables
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Create and save a timetable to see it here
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-white">
                My Saved Timetables
            </h2>

            <div className="overflow-hidden rounded-xl shadow-lg bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left">
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Date Created</th>
                                <th className="p-4 font-semibold">Details</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {savedTimetables.map((timetable) => (
                                <tr
                                    key={timetable.id}
                                    className="transition-colors duration-150 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                                >
                                    <td className="p-4 font-medium">
                                        {timetable.name || 'Untitled Timetable'}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {getTypeIcon(timetable.type)}
                                            {timetable.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {formatDate(timetable.createdAt)}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {timetable.activities?.length || 0} activities • {timetable.timeSlots?.length || 0} slots
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openTimetable(timetable)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20"
                                                title="Open Timetable"
                                                aria-label="Open timetable"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => printTimetable(timetable)}
                                                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:bg-indigo-900/20"
                                                title="Print / Save as PDF"
                                                aria-label="Print timetable"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteTimetable(timetable.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
                                                title="Delete Timetable"
                                                aria-label="Delete timetable"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SavedTimetables;
