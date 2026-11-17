import React, { createContext, useContext, useEffect, useState } from 'react';
import { greedyScheduler, detectConflicts, sortTimeSlots } from '../utils/scheduler';
import { storage, draftKey } from '../utils/storage';
import { useSavedTimetables } from '../hooks/useSavedTimetables';
import { useFeedback } from '../components/Common/Feedback';
import {
  COLORS,
  DAYS,
  WORKING_DAYS,
  EMPTY_ACTIVITY,
  EMPTY_TIMETABLE,
  DEFAULT_OPTIMIZATION_SETTINGS
} from '../constants';

// Everything about building, generating and saving a timetable for one user.
// Mount it with key={user.uid} so each user starts with their own state.

const TimetableContext = createContext(null);

// The in-progress timetable saved in localStorage, so a reload doesn't lose work.
const loadDraft = (uid) => {
  const empty = {
    currentStep: 1,
    timetableType: '',
    timetableData: EMPTY_TIMETABLE,
    currentActivity: EMPTY_ACTIVITY,
    generatedTimetable: null,
    currentTimetableId: null,
    optimizationSettings: DEFAULT_OPTIMIZATION_SETTINGS
  };
  try {
    const draft = JSON.parse(storage.get(draftKey(uid)) || 'null');
    if (!draft?.timetableData) return empty;
    const generated = draft.generatedTimetable || null;
    const step = Number(draft.currentStep) || 1;
    return {
      currentStep: step === 4 && !generated ? 3 : Math.min(Math.max(step, 1), 4),
      timetableType: draft.timetableType || '',
      timetableData: { ...EMPTY_TIMETABLE, ...draft.timetableData },
      currentActivity: { ...EMPTY_ACTIVITY, ...draft.currentActivity },
      generatedTimetable: generated,
      currentTimetableId: draft.currentTimetableId || null,
      optimizationSettings: draft.optimizationSettings || DEFAULT_OPTIMIZATION_SETTINGS
    };
  } catch (error) {
    console.error('Could not restore draft:', error);
    return empty;
  }
};

const conflictsFor = (schedule, data) =>
  schedule ? detectConflicts(schedule, data.activities, data.timeSlots) : [];

export const TimetableProvider = ({ user, children }) => {
  const { notify, confirm } = useFeedback();
  const saved = useSavedTimetables(user);

  const [draft] = useState(() => loadDraft(user.uid));
  const [currentStep, setCurrentStep] = useState(draft.currentStep);
  const [timetableType, setTimetableType] = useState(draft.timetableType);
  const [timetableData, setTimetableData] = useState(draft.timetableData);
  const [currentActivity, setCurrentActivity] = useState(draft.currentActivity);
  // Id of the activity being edited in the form, or null when adding a new one.
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [generatedTimetable, setGeneratedTimetable] = useState(draft.generatedTimetable);
  const [conflicts, setConflicts] = useState(() => conflictsFor(draft.generatedTimetable, draft.timetableData));
  const [optimizationSettings, setOptimizationSettings] = useState(draft.optimizationSettings);
  // Firestore id once saved or opened, so later saves update instead of copying.
  const [currentTimetableId, setCurrentTimetableId] = useState(draft.currentTimetableId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    storage.set(draftKey(user.uid), JSON.stringify({
      currentStep,
      timetableType,
      timetableData,
      currentActivity,
      generatedTimetable,
      currentTimetableId,
      optimizationSettings
    }));
  }, [user.uid, currentStep, timetableType, timetableData, currentActivity,
    generatedTimetable, currentTimetableId, optimizationSettings]);

  // --- Steps 1-2: type and configuration ---

  const selectType = (type) => {
    setTimetableType(type);
    setCurrentStep(2);
  };

  const addTimeSlot = (slot) => {
    setTimetableData(prev => (
      prev.timeSlots.includes(slot)
        ? prev
        : { ...prev, timeSlots: sortTimeSlots([...prev.timeSlots, slot]) }
    ));
  };

  const removeTimeSlot = (slot) => {
    setTimetableData(prev => ({ ...prev, timeSlots: prev.timeSlots.filter(s => s !== slot) }));
  };

  // --- Step 3: activities ---

  const cancelEditActivity = () => {
    setCurrentActivity(EMPTY_ACTIVITY);
    setEditingActivityId(null);
  };

  // Adds the activity in the form, or saves changes to the one being edited.
  const addActivity = () => {
    if (!currentActivity.name.trim() || !currentActivity.duration) return;

    const color = COLORS.find(c => c.name === currentActivity.color) || COLORS[0];
    const activity = {
      ...currentActivity,
      name: currentActivity.name.trim(),
      id: editingActivityId ?? Date.now() + Math.random(),
      colorLight: color.light,
      colorDark: color.dark,
      borderColor: color.border
    };
    setTimetableData(prev => ({
      ...prev,
      activities: editingActivityId
        ? prev.activities.map(a => (a.id === editingActivityId ? activity : a))
        : [...prev.activities, activity]
    }));
    if (editingActivityId) notify(`Updated "${activity.name}". Generate again to apply the change.`, 'success');
    cancelEditActivity();
  };

  const startEditActivity = (activity) => {
    setCurrentActivity(Object.fromEntries(
      Object.keys(EMPTY_ACTIVITY).map(key => [key, activity[key] ?? EMPTY_ACTIVITY[key]])
    ));
    setEditingActivityId(activity.id);
  };

  const removeActivity = (id) => {
    setTimetableData(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== id) }));
    if (id === editingActivityId) cancelEditActivity();
  };

  const togglePreference = (field, value) => {
    setCurrentActivity(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // --- Step 4: generate, export, start over ---

  const generateTimetable = () => {
    const workingDays = WORKING_DAYS[timetableType] || DAYS.slice(0, 5);
    const generated = greedyScheduler(
      timetableData.activities,
      timetableData.timeSlots,
      workingDays,
      optimizationSettings
    );
    setGeneratedTimetable(generated);
    setConflicts(conflictsFor(generated, timetableData));
    setCurrentStep(4);
  };

  const resetGenerator = () => {
    setCurrentStep(1);
    setTimetableType('');
    setTimetableData(EMPTY_TIMETABLE);
    cancelEditActivity();
    setGeneratedTimetable(null);
    setConflicts([]);
    setCurrentTimetableId(null);
  };

  const exportTimetable = () => {
    try {
      const exportData = {
        name: timetableData.name,
        type: timetableType,
        schedule: generatedTimetable,
        activities: timetableData.activities,
        timeSlots: timetableData.timeSlots,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeName = (timetableData.name || 'timetable').replace(/[^a-z0-9-_ ]/gi, '_').trim() || 'timetable';

      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting timetable:', error);
      notify('Error exporting timetable. Please try again.', 'error');
    }
  };

  // --- Saved timetables ---

  const saveTimetable = async () => {
    if (!generatedTimetable || isSaving) return;
    const wasSaved = Boolean(currentTimetableId);

    setIsSaving(true);
    try {
      const id = await saved.save({
        name: timetableData.name,
        type: timetableType,
        schedule: generatedTimetable,
        activities: timetableData.activities,
        timeSlots: timetableData.timeSlots
      }, currentTimetableId);
      setCurrentTimetableId(id);
      notify(wasSaved ? 'Saved timetable updated.' : 'Timetable saved to the cloud.', 'success');
      saved.refresh();
    } catch (error) {
      console.error('Error saving to cloud:', error);
      notify('Failed to save to the cloud. Please check your internet connection.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const loadTimetable = (timetable) => {
    const data = {
      name: timetable.name || '',
      timeSlots: timetable.timeSlots || [],
      activities: timetable.activities || [],
      constraints: []
    };
    const schedule = timetable.schedule || {};
    setCurrentTimetableId(timetable.id);
    setTimetableType(timetable.type || '');
    setTimetableData(data);
    cancelEditActivity();
    setGeneratedTimetable(schedule);
    setConflicts(conflictsFor(schedule, data));
    setCurrentStep(4);
    notify(`Opened "${data.name || 'Untitled Timetable'}"`, 'info');
  };

  const deleteTimetable = async (id) => {
    const name = saved.timetables.find(t => t.id === id)?.name || 'this timetable';
    const ok = await confirm({
      title: 'Delete timetable?',
      message: `"${name}" will be permanently deleted. This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true
    });
    if (!ok) return;

    try {
      await saved.remove(id);
      // If the open timetable was deleted, the next save should create it anew.
      setCurrentTimetableId(prev => (prev === id ? null : prev));
      notify('Timetable deleted.', 'success');
    } catch (error) {
      console.error('Error deleting timetable:', error);
      notify('Failed to delete timetable. Please try again.', 'error');
    }
  };

  const value = {
    // state
    currentStep,
    timetableType,
    timetableData,
    currentActivity,
    editingActivityId,
    generatedTimetable,
    conflicts,
    optimizationSettings,
    isSaving,
    isSavedTimetable: Boolean(currentTimetableId),
    savedTimetables: saved.timetables,
    savedStatus: saved.status,
    // setters used directly by forms
    setCurrentStep,
    setTimetableData,
    setCurrentActivity,
    setOptimizationSettings,
    // actions
    selectType,
    addTimeSlot,
    removeTimeSlot,
    addActivity,
    startEditActivity,
    cancelEditActivity,
    removeActivity,
    togglePreference,
    generateTimetable,
    resetGenerator,
    exportTimetable,
    saveTimetable,
    loadTimetable,
    deleteTimetable,
    refreshSavedTimetables: saved.refresh
  };

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTimetable = () => {
  const ctx = useContext(TimetableContext);
  if (!ctx) throw new Error('useTimetable must be used inside <TimetableProvider>');
  return ctx;
};
