import React from 'react';

const StatsDashboard = ({ timetableData, generatedTimetable, conflicts }) => {
    return (
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:bg-gray-700 dark:bg-none">
            <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">
                📊 Schedule Analytics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg text-center bg-white dark:bg-gray-800 shadow-lg">
                    <div className="text-3xl font-bold text-blue-500">
                        {timetableData.activities.length}
                    </div>
                    <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        Total Activities
                    </div>
                </div>
                <div className="p-4 rounded-lg text-center bg-white dark:bg-gray-800 shadow-lg">
                    <div className="text-3xl font-bold text-green-500">
                        {Object.values(generatedTimetable).reduce((total, day) =>
                            total + Object.keys(day).length, 0
                        )}
                    </div>
                    <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        Scheduled Slots
                    </div>
                </div>
                <div className="p-4 rounded-lg text-center bg-white dark:bg-gray-800 shadow-lg">
                    <div className="text-3xl font-bold text-purple-500">
                        {timetableData.activities.filter(a => a.priority === 'high').length}
                    </div>
                    <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        High Priority
                    </div>
                </div>
                <div className="p-4 rounded-lg text-center bg-white dark:bg-gray-800 shadow-lg">
                    <div className={`text-3xl font-bold ${conflicts.length === 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {conflicts.length}
                    </div>
                    <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        Conflicts
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
