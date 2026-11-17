import React from 'react';
import { Plus, X, Sparkles, Pencil, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTimetable } from '../../context/TimetableContext';
import { PRIORITY_LEVELS, COLORS, DAYS } from '../../constants';
import { formatDuration, slotMinutesOf } from '../../utils/time';
import Button from '../ui/Button';
import { compactInputClass } from '../ui/styles';

const ActivityForm = () => {
    const {
        currentActivity,
        setCurrentActivity,
        timetableData,
        addActivity,
        removeActivity,
        editingActivityId,
        startEditActivity,
        cancelEditActivity,
        togglePreference,
        generateTimetable,
        setCurrentStep
    } = useTimetable();
    const slotMinutes = slotMinutesOf(timetableData);
    // With hourly slots show "2 hours"; otherwise "2 slots (1 h 30 min)".
    const lengthLabel = (slots) => (slotMinutes === 60
        ? formatDuration(slots * 60)
        : `${slots} slot${slots > 1 ? 's' : ''} (${formatDuration(slots * slotMinutes)})`);
    const { darkMode } = useTheme();
    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-white">
                Add Activities & Subjects
            </h2>

            <div className="space-y-6">
                {/* Activity Form */}
                <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="activity-name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Activity Name *
                            </label>
                            <input
                                type="text"
                                id="activity-name"
                                value={currentActivity.name}
                                onChange={(e) => setCurrentActivity(prev => ({ ...prev, name: e.target.value }))}
                                className={compactInputClass}
                                placeholder="e.g., Mathematics, Meeting"
                            />
                        </div>
                        <div>
                            <label htmlFor="activity-duration" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Duration
                            </label>
                            <select
                                id="activity-duration"
                                value={currentActivity.duration}
                                onChange={(e) => setCurrentActivity(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                className={compactInputClass}
                            >
                                {[1, 2, 3, 4].map(num => (
                                    <option key={num} value={num}>{lengthLabel(num)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="activity-instructor" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Instructor/Person
                            </label>
                            <input
                                type="text"
                                id="activity-instructor"
                                value={currentActivity.instructor}
                                onChange={(e) => setCurrentActivity(prev => ({ ...prev, instructor: e.target.value }))}
                                className={compactInputClass}
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label htmlFor="activity-room" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Room/Location
                            </label>
                            <input
                                type="text"
                                id="activity-room"
                                value={currentActivity.room}
                                onChange={(e) => setCurrentActivity(prev => ({ ...prev, room: e.target.value }))}
                                className={compactInputClass}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="activity-description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Description/Notes
                        </label>
                        <textarea
                            id="activity-description"
                                value={currentActivity.description}
                            onChange={(e) => setCurrentActivity(prev => ({ ...prev, description: e.target.value }))}
                            className={compactInputClass}
                            rows="2"
                            placeholder="Optional notes about this activity..."
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p id="priority-label" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Priority
                            </p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="priority-label">
                                {PRIORITY_LEVELS.map(priority => (
                                    <button
                                        key={priority}
                                        type="button"
                                        aria-pressed={currentActivity.priority === priority}
                                        onClick={() => setCurrentActivity(prev => ({ ...prev, priority }))}
                                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-200 ${currentActivity.priority === priority
                                            ? priority === 'high'
                                                ? 'bg-red-600 text-white'
                                                : priority === 'medium'
                                                    ? 'bg-amber-400 text-gray-900'
                                                    : 'bg-green-700 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                            }`}
                                    >
                                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p id="color-label" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Color Theme
                            </p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="color-label">
                                {COLORS.slice(0, 6).map(color => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        aria-pressed={currentActivity.color === color.name}
                                        aria-label={`${color.name} colour`}
                                        title={color.name}
                                        onClick={() => setCurrentActivity(prev => ({ ...prev, color: color.name }))}
                                        className={`w-10 h-10 rounded-lg ${darkMode ? color.dark : color.light} ${color.border} border-2 transition-all duration-200 ${currentActivity.color === color.name ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={currentActivity.recurring}
                            onChange={(e) => setCurrentActivity(prev => ({ ...prev, recurring: e.target.checked }))}
                            className="mr-2"
                        />
                        <label htmlFor="recurring" className="text-gray-700 dark:text-gray-300">
                            Recurring activity (appears multiple times per week)
                        </label>
                    </div>
                </div>

                {/* Time Preferences */}
                <div className="p-6 rounded-xl bg-blue-50 dark:bg-gray-700/50">
                    <h3 className="font-bold mb-4 text-gray-800 dark:text-white">
                        ⚙️ Time Preferences (Optional)
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <p id="days-label" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Preferred Days
                            </p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="days-label">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        aria-pressed={currentActivity.preferredDays.includes(day)}
                                        aria-label={day}
                                        onClick={() => togglePreference('preferredDays', day)}
                                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${currentActivity.preferredDays.includes(day)
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 dark:border-transparent'
                                            }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p id="times-label" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Preferred Times
                            </p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="times-label">
                                {timetableData.timeSlots.map(time => (
                                    <button
                                        key={time}
                                        type="button"
                                        aria-pressed={currentActivity.preferredTimes.includes(time)}
                                        onClick={() => togglePreference('preferredTimes', time)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${currentActivity.preferredTimes.includes(time)
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 dark:border-transparent'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p id="avoid-label" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Avoid Times
                            </p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="avoid-label">
                                {timetableData.timeSlots.map(time => (
                                    <button
                                        key={time}
                                        type="button"
                                        aria-pressed={currentActivity.avoidTimes.includes(time)}
                                        onClick={() => togglePreference('avoidTimes', time)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${currentActivity.avoidTimes.includes(time)
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 dark:border-transparent'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {editingActivityId && (
                    <p role="status" className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Editing an activity. Change the details above, then save.
                    </p>
                )}
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[12rem]">
                    <Button
                        variant="success"
                        fullWidth
                        onClick={addActivity}
                        disabled={!currentActivity.name.trim()}
                    >
                        {editingActivityId ? (
                            <>
                                <Save className="w-5 h-5" aria-hidden="true" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" aria-hidden="true" />
                                Add Activity
                            </>
                        )}
                    </Button>
                    </div>
                    {editingActivityId && (
                        <Button
                            variant="secondary"
                            onClick={cancelEditActivity}
                        >
                            Cancel
                        </Button>
                    )}
                </div>

                {/* Activities List */}
                {timetableData.activities.length > 0 && (
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-bold mb-4 text-gray-800 dark:text-white">
                            Added Activities ({timetableData.activities.length})
                        </h3>
                        <div className="space-y-3">
                            {timetableData.activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`p-4 rounded-lg border-l-4 ${activity.id === editingActivityId ? 'ring-2 ring-purple-500' : ''} ${darkMode ? activity.colorDark : activity.colorLight} ${activity.borderColor} transition-all duration-200 hover:shadow-lg`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <h4 className="font-bold text-lg text-gray-800 dark:text-white">
                                                    {activity.name}
                                                </h4>
                                                <span className={`ml-3 px-2 py-1 rounded text-xs font-semibold ${activity.priority === 'high'
                                                    ? 'bg-red-600 text-white'
                                                    : activity.priority === 'medium'
                                                        ? 'bg-amber-400 text-gray-900'
                                                        : 'bg-green-700 text-white'
                                                    }`}>
                                                    {activity.priority.toUpperCase()}
                                                </span>
                                                {activity.recurring && (
                                                    <span className="ml-2 px-2 py-1 bg-purple-500 text-white rounded text-xs font-semibold">
                                                        RECURRING
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                                                <div>⏱️ Duration: {lengthLabel(activity.duration)}</div>
                                                {activity.instructor && <div>👤 Instructor: {activity.instructor}</div>}
                                                {activity.room && <div>📍 Room: {activity.room}</div>}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                startEditActivity(activity);
                                                // Move focus (and scroll) to the form being edited.
                                                setTimeout(() => document.getElementById('activity-name')?.focus(), 0);
                                            }}
                                            aria-label={`Edit ${activity.name}`}
                                            className="ml-2 p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all duration-200"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeActivity(activity.id)}
                                            aria-label={`Remove ${activity.name}`}
                                            className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap justify-between gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentStep(2)}
                    >
                        ← Back
                    </Button>
                    <Button
                        onClick={generateTimetable}
                        disabled={timetableData.activities.length === 0}
                    >
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                        Generate Smart Timetable
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ActivityForm;
