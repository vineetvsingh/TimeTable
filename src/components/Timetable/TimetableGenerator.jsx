import React, { useState, useEffect } from 'react';
import { User, Sun, Moon, LogOut, Sparkles, LayoutGrid, Plus } from 'lucide-react';
import StepIndicator from './StepIndicator';
import TypeSelection from './TypeSelection';
import Configuration from './Configuration';
import ActivityForm from './ActivityForm';
import GeneratedTimetable from './GeneratedTimetable';
import SavedTimetables from './SavedTimetables';

const TimetableGenerator = ({
    currentStep,
    setCurrentStep,
    timetableData,
    setTimetableData,
    currentActivity,
    setCurrentActivity,
    generatedTimetable,
    conflicts,
    optimizationSettings,
    setOptimizationSettings,
    handleTypeSelection,
    addTimeSlot,
    removeTimeSlot,
    addActivity,
    removeActivity,
    togglePreference,
    generateTimetable,
    regenerateTimetable,
    exportTimetable,
    saveTimetable,
    isSaving,
    isSavedTimetable,
    resetGenerator,
    getConflictIcon,
    darkMode,
    setDarkMode,
    currentUser,
    handleLogout,
    timetableTypes,
    timeSlots,
    priorityLevels,
    colors,
    days,
    savedTimetables = [],
    savedStatus,
    loadTimetable,
    deleteTimetable,
    fetchSavedTimetables
}) => {
    const [view, setView] = useState('generator'); // 'generator' or 'saved'
    // Set when "Print" is chosen on a saved timetable: once it has been loaded
    // and rendered in the generator view, open the print dialog.
    const [printPending, setPrintPending] = useState(false);

    useEffect(() => {
        if (!printPending || view !== 'generator' || currentStep !== 4 || !generatedTimetable) return;
        const timer = setTimeout(() => {
            setPrintPending(false);
            window.print();
        }, 100);
        return () => clearTimeout(timer);
    }, [printPending, view, currentStep, generatedTimetable]);

    const iconButton = 'p-2 sm:p-3 rounded-full transition-all duration-300';

    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
            }`}>
            <div className="max-w-7xl mx-auto p-4">
                {/* User Info, Dark Mode Toggle & Logout */}
                <div className="flex justify-end items-center gap-2 sm:gap-4 print:hidden">
                    <div className={`px-3 sm:px-4 py-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg flex items-center gap-2 min-w-0`}>
                        <User className="w-5 h-5 shrink-0" />
                        <span className="font-semibold truncate max-w-[10rem] sm:max-w-xs">{currentUser.name}</span>
                    </div>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        className={`${iconButton} ${darkMode
                            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 shadow-lg shadow-yellow-400/20'
                            : 'bg-white text-gray-800 hover:bg-gray-100 shadow-lg shadow-gray-400/20'
                            }`}
                    >
                        {darkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    <button
                        onClick={handleLogout}
                        aria-label="Log out"
                        className={`${iconButton} ${darkMode
                            ? 'bg-red-800 text-white hover:bg-red-700 shadow-lg'
                            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                            }`}
                    >
                        <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-8 pt-6 print:hidden">
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className={`hidden sm:block w-8 h-8 mr-2 shrink-0 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        <h1 className={`text-3xl sm:text-5xl font-bold bg-gradient-to-r ${darkMode
                            ? 'from-blue-400 via-purple-400 to-pink-400'
                            : 'from-blue-600 via-purple-600 to-pink-600'
                            } bg-clip-text text-transparent animate-gradient`}>
                            Smart Timetable Generator
                        </h1>
                        <Sparkles className={`hidden sm:block w-8 h-8 ml-2 shrink-0 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-base sm:text-lg`}>
                        Intelligent scheduling with conflict detection and optimization
                    </p>

                    {/* View Toggle */}
                    <div className="flex flex-wrap justify-center mt-6 gap-3 sm:gap-4">
                        <button
                            onClick={() => setView('generator')}
                            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${view === 'generator'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            New Timetable
                        </button>
                        <button
                            onClick={() => {
                                setView('saved');
                                if (fetchSavedTimetables) fetchSavedTimetables();
                            }}
                            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${view === 'saved'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            My Timetables
                        </button>
                    </div>
                </div>

                {view === 'saved' ? (
                    <div className={`rounded-2xl shadow-2xl p-4 sm:p-8 mt-8 transition-all duration-300 ${darkMode
                        ? 'bg-gray-800/90 backdrop-blur-lg border border-gray-700'
                        : 'bg-white/90 backdrop-blur-lg'
                        }`}>
                        <SavedTimetables
                            savedTimetables={savedTimetables}
                            savedStatus={savedStatus}
                            onRetry={fetchSavedTimetables}
                            loadTimetable={(timetable) => {
                                loadTimetable(timetable);
                                setView('generator');
                            }}
                            printTimetable={(timetable) => {
                                loadTimetable(timetable);
                                setView('generator');
                                setPrintPending(true);
                            }}
                            deleteTimetable={deleteTimetable}
                            darkMode={darkMode}
                        />
                    </div>
                ) : (
                    <>
                        <div className="print:hidden">
                            <StepIndicator currentStep={currentStep} darkMode={darkMode} />
                        </div>

                        <div className={`rounded-2xl shadow-2xl p-4 sm:p-8 mt-12 transition-all duration-300 print:shadow-none print:p-0 print:mt-0 ${darkMode
                            ? 'bg-gray-800/90 backdrop-blur-lg border border-gray-700'
                            : 'bg-white/90 backdrop-blur-lg'
                            }`}>

                            {currentStep === 1 && (
                                <TypeSelection
                                    timetableTypes={timetableTypes}
                                    handleTypeSelection={handleTypeSelection}
                                    darkMode={darkMode}
                                />
                            )}

                            {currentStep === 2 && (
                                <Configuration
                                    timetableData={timetableData}
                                    setTimetableData={setTimetableData}
                                    timeSlots={timeSlots}
                                    addTimeSlot={addTimeSlot}
                                    removeTimeSlot={removeTimeSlot}
                                    optimizationSettings={optimizationSettings}
                                    setOptimizationSettings={setOptimizationSettings}
                                    setCurrentStep={setCurrentStep}
                                    darkMode={darkMode}
                                />
                            )}

                            {currentStep === 3 && (
                                <ActivityForm
                                    currentActivity={currentActivity}
                                    setCurrentActivity={setCurrentActivity}
                                    timetableData={timetableData}
                                    addActivity={addActivity}
                                    removeActivity={removeActivity}
                                    togglePreference={togglePreference}
                                    generateTimetable={generateTimetable}
                                    setCurrentStep={setCurrentStep}
                                    darkMode={darkMode}
                                    priorityLevels={priorityLevels}
                                    colors={colors}
                                    days={days}
                                />
                            )}

                            {currentStep === 4 && generatedTimetable && (
                                <GeneratedTimetable
                                    generatedTimetable={generatedTimetable}
                                    conflicts={conflicts}
                                    timetableData={timetableData}
                                    regenerateTimetable={regenerateTimetable}
                                    exportTimetable={exportTimetable}
                                    saveTimetable={saveTimetable}
                                    isSaving={isSaving}
                                    isSavedTimetable={isSavedTimetable}
                                    setCurrentStep={setCurrentStep}
                                    darkMode={darkMode}
                                    resetGenerator={resetGenerator}
                                    getConflictIcon={getConflictIcon}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TimetableGenerator;
