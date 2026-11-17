import React from 'react';
import { Plus, X, Pencil, Save, ChevronLeft, Check, Repeat, ListPlus } from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { PRIORITY_LEVELS, PRIORITY_STYLES, COLORS, DAYS, colorStyle } from '../../constants';
import { formatDuration, slotMinutesOf } from '../../utils/time';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import { fieldClass, labelClass, sectionTitleClass, hintClass } from '../ui/styles';

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

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
    const set = (field) => (e) => setCurrentActivity(prev => ({ ...prev, [field]: e.target.value }));
    const activities = timetableData.activities;

    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-ink sm:text-[1.75rem]">Add activities</h2>
            <p className="mt-1 text-muted">Add each subject, class or task. Then generate, and the timetable is filled in for you.</p>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                {/* The form */}
                <div className="space-y-6">
                    <section className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="activity-name" className={labelClass}>Activity name</label>
                                <input
                                    type="text"
                                    id="activity-name"
                                    required
                                    value={currentActivity.name}
                                    onChange={set('name')}
                                    className={fieldClass}
                                    placeholder="e.g. Mathematics"
                                />
                            </div>
                            <div>
                                <label htmlFor="activity-duration" className={labelClass}>Duration</label>
                                <select
                                    id="activity-duration"
                                    value={currentActivity.duration}
                                    onChange={(e) => setCurrentActivity(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                    className={fieldClass}
                                >
                                    {[1, 2, 3, 4].map(num => (
                                        <option key={num} value={num}>{lengthLabel(num)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="activity-instructor" className={labelClass}>
                                    Teacher or person <span className="font-normal text-muted">(optional)</span>
                                </label>
                                <input type="text" id="activity-instructor" value={currentActivity.instructor} onChange={set('instructor')} className={fieldClass} />
                            </div>
                            <div>
                                <label htmlFor="activity-room" className={labelClass}>
                                    Room or place <span className="font-normal text-muted">(optional)</span>
                                </label>
                                <input type="text" id="activity-room" value={currentActivity.room} onChange={set('room')} className={fieldClass} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="activity-description" className={labelClass}>
                                Notes <span className="font-normal text-muted">(optional)</span>
                            </label>
                            <textarea
                                id="activity-description"
                                value={currentActivity.description}
                                onChange={set('description')}
                                className={`${fieldClass} h-auto py-2.5`}
                                rows="2"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p id="priority-label" className={labelClass}>Priority</p>
                                <div className="inline-flex w-full rounded-lg bg-sunken p-1" role="group" aria-labelledby="priority-label">
                                    {PRIORITY_LEVELS.map(priority => {
                                        const selected = currentActivity.priority === priority;
                                        return (
                                            <button
                                                key={priority}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => setCurrentActivity(prev => ({ ...prev, priority }))}
                                                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${selected
                                                    ? 'bg-surface text-ink shadow-sm'
                                                    : 'text-muted hover:text-ink'
                                                    }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`h-2 w-2 rounded-full ${priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-green-600'}`}
                                                />
                                                {capitalise(priority)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <p id="color-label" className={labelClass}>Colour</p>
                                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="color-label">
                                    {COLORS.map(color => {
                                        const selected = currentActivity.color === color.name;
                                        return (
                                            <button
                                                key={color.name}
                                                type="button"
                                                aria-pressed={selected}
                                                aria-label={`${color.name} colour`}
                                                title={capitalise(color.name)}
                                                onClick={() => setCurrentActivity(prev => ({ ...prev, color: color.name }))}
                                                className={`flex h-8 w-8 items-center justify-center rounded-full ${color.swatch} text-white transition-shadow duration-150 ${selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''}`}
                                            >
                                                {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <label htmlFor="recurring" className="flex cursor-pointer items-start gap-3 rounded-lg border border-rule p-3">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={currentActivity.recurring}
                                onChange={(e) => setCurrentActivity(prev => ({ ...prev, recurring: e.target.checked }))}
                                className="mt-1 h-4 w-4"
                            />
                            <span>
                                <span className="block font-medium text-ink">Repeat every day</span>
                                <span className="block text-sm text-muted">Placed on every day of the timetable (or every day picked below) instead of once a week.</span>
                            </span>
                        </label>
                    </section>

                    <section className="space-y-4 border-t border-rule pt-6">
                        <div>
                            <h3 className={sectionTitleClass}>Timing preferences</h3>
                            <p className={hintClass}>Optional. The scheduler tries to follow these.</p>
                        </div>
                        <div>
                            <p id="days-label" className={labelClass}>Only on these days</p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="days-label">
                                {DAYS.map(day => (
                                    <Chip
                                        key={day}
                                        selected={currentActivity.preferredDays.includes(day)}
                                        aria-label={day}
                                        onClick={() => togglePreference('preferredDays', day)}
                                    >
                                        {day.slice(0, 3)}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p id="times-label" className={labelClass}>Preferred start times</p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="times-label">
                                {timetableData.timeSlots.map(time => (
                                    <Chip
                                        key={time}
                                        selected={currentActivity.preferredTimes.includes(time)}
                                        onClick={() => togglePreference('preferredTimes', time)}
                                    >
                                        {time}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p id="avoid-label" className={labelClass}>Never at</p>
                            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="avoid-label">
                                {timetableData.timeSlots.map(time => (
                                    <Chip
                                        key={time}
                                        tone="avoid"
                                        selected={currentActivity.avoidTimes.includes(time)}
                                        onClick={() => togglePreference('avoidTimes', time)}
                                    >
                                        {time}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
                        <Button onClick={addActivity} disabled={!currentActivity.name.trim()}>
                            {editingActivityId ? (
                                <>
                                    <Save className="h-4 w-4" aria-hidden="true" />
                                    Save changes
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                    Add activity
                                </>
                            )}
                        </Button>
                        {editingActivityId && (
                            <>
                                <Button variant="ghost" onClick={cancelEditActivity}>Cancel</Button>
                                <p role="status" className="text-sm text-muted">Editing an activity. Change the details, then save.</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Activities added so far */}
                <aside aria-labelledby="added-heading" className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-xl border border-rule bg-paper/60 p-4">
                        <h3 id="added-heading" className="flex items-baseline justify-between text-base font-semibold text-ink">
                            Added activities
                            <span className="font-sans text-sm font-medium text-muted tabular-nums">{activities.length}</span>
                        </h3>

                        {activities.length === 0 ? (
                            <div className="py-8 text-center">
                                <ListPlus className="mx-auto h-8 w-8 text-faint" aria-hidden="true" />
                                <p className="mt-2 text-sm text-muted">Nothing yet. Fill in the form and choose Add activity.</p>
                            </div>
                        ) : (
                            <ul className="mt-3 space-y-2">
                                {activities.map((activity) => (
                                    <li
                                        key={activity.id}
                                        className={`flex items-start gap-3 rounded-lg border-l-[3px] p-3 ${colorStyle(activity.color).block} ${activity.id === editingActivityId ? 'ring-2 ring-accent' : ''}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h4 className="truncate font-sans font-semibold text-ink">{activity.name}</h4>
                                                {activity.recurring && (
                                                    <Repeat className="h-3.5 w-3.5 text-muted" aria-label="Repeats every day" />
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted">
                                                {[lengthLabel(activity.duration), activity.instructor, activity.room].filter(Boolean).join(', ')}
                                            </p>
                                            <span className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[activity.priority] || PRIORITY_STYLES.medium}`}>
                                                {capitalise(activity.priority)} priority
                                            </span>
                                        </div>
                                        <div className="flex shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    startEditActivity(activity);
                                                    // Move focus (and scroll) to the form being edited.
                                                    setTimeout(() => document.getElementById('activity-name')?.focus(), 0);
                                                }}
                                                aria-label={`Edit ${activity.name}`}
                                                className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeActivity(activity.id)}
                                                aria-label={`Remove ${activity.name}`}
                                                className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
                <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                </Button>
                <Button onClick={generateTimetable} disabled={activities.length === 0}>
                    Generate timetable
                </Button>
            </div>
        </div>
    );
};

export default ActivityForm;
