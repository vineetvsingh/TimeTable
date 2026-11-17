import React from 'react';
import { Info } from 'lucide-react';
import { SLOT_LENGTHS } from '../../constants';
import { slotPaletteFor, formatDuration } from '../../utils/time';
import { useTimetable } from '../../context/TimetableContext';
import Button from '../ui/Button';
import { inputClass, labelClass } from '../ui/styles';

const Configuration = () => {
    const {
        timetableData,
        setTimetableData,
        addTimeSlot,
        removeTimeSlot,
        updateSlotSettings,
        selectAllSlots,
        clearSlots,
        optimizationSettings,
        setOptimizationSettings,
        setCurrentStep
    } = useTimetable();
    const palette = slotPaletteFor(timetableData);
    const fieldClass = `${inputClass} p-3`;

    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-white">
                Configure Your Timetable
            </h2>

            <div className="space-y-8">
                <div>
                    <label htmlFor="timetable-name" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Timetable Name
                    </label>
                    <input
                        id="timetable-name"
                        type="text"
                        className={`${inputClass} p-4`}
                        placeholder="Enter a memorable name for your timetable..."
                        value={timetableData.name}
                        onChange={(e) => setTimetableData(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>

                <div>
                    <p className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Day &amp; Slot Length
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="day-start" className={labelClass}>Day starts</label>
                            <input
                                id="day-start"
                                type="time"
                                step="300"
                                className={fieldClass}
                                value={timetableData.dayStart}
                                onChange={(e) => e.target.value && updateSlotSettings({ dayStart: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="day-end" className={labelClass}>Day ends</label>
                            <input
                                id="day-end"
                                type="time"
                                step="300"
                                className={fieldClass}
                                value={timetableData.dayEnd}
                                onChange={(e) => e.target.value && updateSlotSettings({ dayEnd: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="slot-length" className={labelClass}>Slot length</label>
                            <select
                                id="slot-length"
                                className={fieldClass}
                                value={timetableData.slotMinutes}
                                onChange={(e) => updateSlotSettings({ slotMinutes: Number(e.target.value) })}
                            >
                                {SLOT_LENGTHS.map(minutes => (
                                    <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <p id="slots-label" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Select Time Slots
                        </p>
                        {palette.length > 0 && (
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={selectAllSlots}>Select all</Button>
                                <Button variant="secondary" size="sm" onClick={clearSlots} disabled={timetableData.timeSlots.length === 0}>
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                    {palette.length === 0 && (
                        <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-4">
                            No slots fit: make sure the day ends at least one slot length after it starts.
                        </p>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4" role="group" aria-labelledby="slots-label">
                        {palette.map((slot) => (
                            <button
                                type="button"
                                key={slot}
                                aria-pressed={timetableData.timeSlots.includes(slot)}
                                onClick={() => (timetableData.timeSlots.includes(slot) ? removeTimeSlot(slot) : addTimeSlot(slot))}
                                className={`p-2 text-sm rounded-lg transition-all duration-200 ${timetableData.timeSlots.includes(slot)
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    {timetableData.timeSlots.length > 0 && (
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-gray-700">
                            <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                Selected Time Slots ({timetableData.timeSlots.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {timetableData.timeSlots.map((slot) => (
                                    <button
                                        type="button"
                                        key={slot}
                                        onClick={() => removeTimeSlot(slot)}
                                        aria-label={`Remove ${slot}`}
                                        className="px-3 py-1 rounded-full text-sm cursor-pointer transition-all duration-200 bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-800 dark:bg-purple-600 dark:text-white dark:hover:bg-red-600 dark:hover:text-white"
                                    >
                                        {slot} <span aria-hidden="true">×</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Optimization Settings */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:bg-gray-700 dark:bg-none">
                    <div className="flex items-center mb-4">
                        <Info className="w-5 h-5 mr-2 text-blue-600 dark:text-purple-400" />
                        <h3 className="font-bold text-gray-800 dark:text-white">
                            AI Optimization Settings
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(optimizationSettings).map(([key, value]) => (
                            <label key={key} className="flex items-center group cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => setOptimizationSettings(prev => ({
                                            ...prev,
                                            [key]: e.target.checked
                                        }))}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-2 ${value
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-0.5'
                                            } mt-0.5`}></div>
                                    </div>
                                </div>
                                <span className="ml-3 text-gray-700 dark:text-gray-300">
                                    {key === 'prioritizePreferences' && '🎯 Prioritize time preferences'}
                                    {key === 'minimizeGaps' && '⏱️ Minimize gaps between activities'}
                                    {key === 'balanceWorkload' && '⚖️ Balance daily workload'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap justify-between gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentStep(1)}
                    >
                        ← Back
                    </Button>
                    <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={!timetableData.name || timetableData.timeSlots.length === 0}
                    >
                        Next →
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
