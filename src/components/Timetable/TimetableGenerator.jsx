import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import StepIndicator from './StepIndicator';
import TypeSelection from './TypeSelection';
import Configuration from './Configuration';
import ActivityForm from './ActivityForm';
import GeneratedTimetable from './GeneratedTimetable';
import SavedTimetables from './SavedTimetables';
import { Wordmark } from '../ui/Logo';
import { useTheme } from '../../context/ThemeContext';
import { useTimetable } from '../../context/TimetableContext';
import { useStepHistory, parseHash } from '../../hooks/useStepHistory';

const iconButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-sunken hover:text-ink';

const TimetableGenerator = ({ currentUser, onLogout }) => {
    const {
        currentStep,
        setCurrentStep,
        timetableData,
        generatedTimetable,
        loadTimetable,
        refreshSavedTimetables
    } = useTimetable();
    const { darkMode, toggleDarkMode } = useTheme();
    // 'generator' or 'saved'; opening the app at #saved starts on the list.
    const [view, setView] = useState(() => parseHash(window.location.hash)?.view || 'generator');

    // Browser Back/Forward move between steps and the saved list.
    useStepHistory({
        view,
        setView,
        step: currentStep,
        setStep: setCurrentStep,
        canShowStep: (step) => {
            if (step === 3) return Boolean(timetableData.name && timetableData.timeSlots.length);
            if (step === 4) return Boolean(generatedTimetable);
            return true;
        }
    });
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

    const tab = (active) =>
        `relative h-9 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 ${active
            ? 'bg-sunken text-ink'
            : 'text-muted hover:text-ink'
        }`;

    const initial = (currentUser.name || '?').trim().charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-paper text-ink">
            <header className="sticky top-0 z-40 border-b border-rule bg-surface/90 backdrop-blur print:hidden">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
                    <Wordmark />

                    <nav aria-label="Main" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
                        <button
                            type="button"
                            aria-current={view === 'generator' ? 'page' : undefined}
                            onClick={() => setView('generator')}
                            className={tab(view === 'generator')}
                        >
                            New timetable
                        </button>
                        <button
                            type="button"
                            aria-current={view === 'saved' ? 'page' : undefined}
                            onClick={() => {
                                setView('saved');
                                refreshSavedTimetables();
                            }}
                            className={tab(view === 'saved')}
                        >
                            My timetables
                        </button>
                    </nav>

                    <div className="ml-auto flex items-center gap-1">
                        <span className="mr-2 hidden items-center gap-2 text-sm text-muted sm:flex">
                            <span
                                aria-hidden="true"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink"
                            >
                                {initial}
                            </span>
                            <span className="max-w-[12rem] truncate font-medium text-ink">{currentUser.name}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => toggleDarkMode()}
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            className={iconButton}
                        >
                            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                        </button>
                        <button type="button" onClick={onLogout} aria-label="Log out" title="Log out" className={iconButton}>
                            <LogOut className="h-[18px] w-[18px]" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 print:max-w-none print:p-0">
                {view === 'saved' ? (
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
                ) : (
                    <>
                        <div className="mb-6 print:hidden">
                            <StepIndicator currentStep={currentStep} />
                        </div>

                        <div className="rounded-2xl border border-rule bg-surface p-5 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none">
                            {currentStep === 1 && <TypeSelection />}
                            {currentStep === 2 && <Configuration />}
                            {currentStep === 3 && <ActivityForm />}
                            {currentStep === 4 && generatedTimetable && <GeneratedTimetable />}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default TimetableGenerator;
