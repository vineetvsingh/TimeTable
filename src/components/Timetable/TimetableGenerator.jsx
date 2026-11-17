import React, { useState, useEffect } from 'react';
import { User, Sun, Moon, LogOut, Sparkles, LayoutGrid, Plus } from 'lucide-react';
import StepIndicator from './StepIndicator';
import TypeSelection from './TypeSelection';
import Configuration from './Configuration';
import ActivityForm from './ActivityForm';
import GeneratedTimetable from './GeneratedTimetable';
import SavedTimetables from './SavedTimetables';
import { useTheme } from '../../context/ThemeContext';
import { useTimetable } from '../../context/TimetableContext';

const TimetableGenerator = ({ currentUser, onLogout }) => {
    const { currentStep, generatedTimetable, loadTimetable, refreshSavedTimetables } = useTimetable();
    const { darkMode, toggleDarkMode } = useTheme();
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
        <div className="min-h-screen transition-all duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto p-4">
                {/* User Info, Dark Mode Toggle & Logout */}
                <div className="flex justify-end items-center gap-2 sm:gap-4 print:hidden">
                    <div className="px-3 sm:px-4 py-2 rounded-full bg-white text-gray-800 dark:bg-gray-800 dark:text-white shadow-lg flex items-center gap-2 min-w-0">
                        <User className="w-5 h-5 shrink-0" />
                        <span className="font-semibold truncate max-w-[10rem] sm:max-w-xs">{currentUser.name}</span>
                    </div>
                    <button
                        onClick={() => toggleDarkMode()}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        className={`${iconButton} bg-white text-gray-800 hover:bg-gray-100 shadow-lg shadow-gray-400/20 dark:bg-gray-800 dark:text-yellow-400 dark:hover:bg-gray-700 dark:shadow-yellow-400/20`}
                    >
                        {darkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                    <button
                        onClick={onLogout}
                        aria-label="Log out"
                        className={`${iconButton} bg-red-500 text-white hover:bg-red-600 shadow-lg dark:bg-red-800 dark:hover:bg-red-700`}
                    >
                        <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-8 pt-6 print:hidden">
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="hidden sm:block w-8 h-8 mr-2 shrink-0 text-purple-600 dark:text-purple-400" />
                        <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-gradient">
                            Smart Timetable Generator
                        </h1>
                        <Sparkles className="hidden sm:block w-8 h-8 ml-2 shrink-0 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                        Intelligent scheduling with conflict detection and optimization
                    </p>

                    {/* View Toggle */}
                    <div className="flex flex-wrap justify-center mt-6 gap-3 sm:gap-4">
                        <button
                            onClick={() => setView('generator')}
                            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${view === 'generator'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            New Timetable
                        </button>
                        <button
                            onClick={() => {
                                setView('saved');
                                refreshSavedTimetables();
                            }}
                            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${view === 'saved'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            My Timetables
                        </button>
                    </div>
                </div>

                {view === 'saved' ? (
                    <div className="rounded-2xl shadow-2xl p-4 sm:p-8 mt-8 transition-all duration-300 bg-white/90 backdrop-blur-lg dark:bg-gray-800/90 dark:border dark:border-gray-700">
                        <SavedTimetables
                            openTimetable={(timetable) => {
                                loadTimetable(timetable);
                                setView('generator');
                            }}
                            printTimetable={(timetable) => {
                                loadTimetable(timetable);
                                setView('generator');
                                setPrintPending(true);
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <div className="print:hidden">
                            <StepIndicator currentStep={currentStep} />
                        </div>

                        <div className="rounded-2xl shadow-2xl p-4 sm:p-8 mt-12 transition-all duration-300 print:shadow-none print:p-0 print:mt-0 bg-white/90 backdrop-blur-lg dark:bg-gray-800/90 dark:border dark:border-gray-700">

                            {currentStep === 1 && (
                                <TypeSelection />
                            )}

                            {currentStep === 2 && (
                                <Configuration />
                            )}

                            {currentStep === 3 && (
                                <ActivityForm />
                            )}

                            {currentStep === 4 && generatedTimetable && (
                                <GeneratedTimetable />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TimetableGenerator;
