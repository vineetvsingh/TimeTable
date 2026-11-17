import React from 'react';
import { Info } from 'lucide-react';

const Configuration = ({
    timetableData,
    setTimetableData,
    timeSlots,
    addTimeSlot,
    removeTimeSlot,
    optimizationSettings,
    setOptimizationSettings,
    setCurrentStep,
    darkMode
}) => {
    return (
        <div className="animate-fadeIn">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Configure Your Timetable
            </h2>

            <div className="space-y-8">
                <div>
                    <label htmlFor="timetable-name" className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Timetable Name
                    </label>
                    <input
                        id="timetable-name"
                        type="text"
                        className={`w-full p-4 rounded-lg transition-all duration-200 ${darkMode
                            ? 'bg-gray-700 text-white border border-gray-600 focus:border-purple-400'
                            : 'bg-white text-gray-800 border-2 border-gray-200 focus:border-blue-500'
                            } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                        placeholder="Enter a memorable name for your timetable..."
                        value={timetableData.name}
                        onChange={(e) => setTimetableData(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>

                <div>
                    <p id="slots-label" className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Select Time Slots
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4" role="group" aria-labelledby="slots-label">
                        {timeSlots.map((slot) => (
                            <button
                                type="button"
                                key={slot}
                                aria-pressed={timetableData.timeSlots.includes(slot)}
                                onClick={() => (timetableData.timeSlots.includes(slot) ? removeTimeSlot(slot) : addTimeSlot(slot))}
                                className={`p-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ${timetableData.timeSlots.includes(slot)
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : darkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    {timetableData.timeSlots.length > 0 && (
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                            <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Selected Time Slots ({timetableData.timeSlots.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {timetableData.timeSlots.map((slot) => (
                                    <button
                                        type="button"
                                        key={slot}
                                        onClick={() => removeTimeSlot(slot)}
                                        aria-label={`Remove ${slot}`}
                                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-all duration-200 transform hover:scale-105 ${darkMode
                                            ? 'bg-purple-600 text-white hover:bg-red-600'
                                            : 'bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-800'
                                            }`}
                                    >
                                        {slot} <span aria-hidden="true">×</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Optimization Settings */}
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
                    <div className="flex items-center mb-4">
                        <Info className={`w-5 h-5 mr-2 ${darkMode ? 'text-purple-400' : 'text-blue-600'}`} />
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
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
                                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-0.5'
                                            } mt-0.5`}></div>
                                    </div>
                                </div>
                                <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {key === 'prioritizePreferences' && '🎯 Prioritize time preferences'}
                                    {key === 'minimizeGaps' && '⏱️ Minimize gaps between activities'}
                                    {key === 'balanceWorkload' && '⚖️ Balance daily workload'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${darkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        ← Back
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        disabled={!timetableData.name || timetableData.timeSlots.length === 0}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${!timetableData.name || timetableData.timeSlots.length === 0
                            ? darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                            }`}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
