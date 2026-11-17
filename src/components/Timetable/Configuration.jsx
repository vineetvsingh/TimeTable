import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { SLOT_LENGTHS } from '../../constants';
import { slotPaletteFor, formatDuration } from '../../utils/time';
import { useTimetable } from '../../context/TimetableContext';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import { fieldClass, labelClass, sectionTitleClass, hintClass } from '../ui/styles';

const PREFERENCE_LABELS = {
    prioritizePreferences: ['Honour preferred times first', 'Activities with a preferred time get it before others are placed.'],
    minimizeGaps: ['Keep the day compact', 'Place activities next to each other to avoid free periods.'],
    balanceWorkload: ['Spread work across the week', 'Prefer lighter days when there is a choice.']
};

const Section = ({ title, hint, action, children }) => (
    <section className="border-t border-rule pt-6 first:border-t-0 first:pt-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
                <h3 className={sectionTitleClass}>{title}</h3>
                {hint && <p className={hintClass}>{hint}</p>}
            </div>
            {action}
        </div>
        {children}
    </section>
);

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
    const selectedCount = timetableData.timeSlots.length;

    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-ink sm:text-[1.75rem]">Set up your day</h2>
            <p className="mt-1 text-muted">Name the timetable, then choose when activities can happen.</p>

            <div className="mt-8 space-y-6">
                <Section title="Name">
                    <label htmlFor="timetable-name" className="sr-only">Timetable name</label>
                    <input
                        id="timetable-name"
                        type="text"
                        className={`${fieldClass} max-w-xl`}
                        placeholder="e.g. Class 10B, Term 2"
                        value={timetableData.name}
                        onChange={(e) => setTimetableData(prev => ({ ...prev, name: e.target.value }))}
                    />
                </Section>

                <Section title="Hours" hint="Slots are made from these. Change them to get 45-minute periods, for example.">
                    <div className="grid max-w-xl gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="day-start" className={labelClass}>Day starts</label>
                            <input
                                id="day-start"
                                type="time"
                                step="300"
                                className={`${fieldClass} tabular-nums`}
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
                                className={`${fieldClass} tabular-nums`}
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
                </Section>

                <Section
                    title="Time slots"
                    hint={selectedCount > 0
                        ? `${selectedCount} of ${palette.length} selected. Leave out breaks such as lunch.`
                        : 'Pick the slots activities can use. Leave out breaks such as lunch.'}
                    action={palette.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={selectAllSlots}>Select all</Button>
                            <Button variant="ghost" size="sm" onClick={clearSlots} disabled={selectedCount === 0}>
                                Clear
                            </Button>
                        </div>
                    )}
                >
                    {palette.length === 0 && (
                        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                            No slots fit. Make the day end at least one slot length after it starts.
                        </p>
                    )}
                    <p id="slots-label" className="sr-only">Time slots</p>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] gap-2" role="group" aria-labelledby="slots-label">
                        {palette.map((slot) => {
                            const selected = timetableData.timeSlots.includes(slot);
                            return (
                                <Chip
                                    key={slot}
                                    selected={selected}
                                    onClick={() => (selected ? removeTimeSlot(slot) : addTimeSlot(slot))}
                                >
                                    {slot}
                                </Chip>
                            );
                        })}
                    </div>
                </Section>

                <Section title="Scheduling preferences">
                    <div className="space-y-4">
                        {Object.entries(optimizationSettings).map(([key, value]) => (
                            <label key={key} className="flex cursor-pointer items-start gap-3">
                                <span className="relative mt-0.5 shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => setOptimizationSettings(prev => ({
                                            ...prev,
                                            [key]: e.target.checked
                                        }))}
                                        className="peer sr-only"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className={`block h-6 w-10 rounded-full transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${value ? 'bg-accent' : 'bg-rule-strong'}`}
                                    >
                                        <span
                                            className={`mt-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
                                        />
                                    </span>
                                </span>
                                <span>
                                    <span className="block font-medium text-ink">{PREFERENCE_LABELS[key]?.[0] || key}</span>
                                    <span className="block text-sm text-muted">{PREFERENCE_LABELS[key]?.[1]}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </Section>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
                <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                </Button>
                <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!timetableData.name || selectedCount === 0}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default Configuration;
