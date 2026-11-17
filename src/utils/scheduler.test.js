import { describe, it, expect } from 'vitest';
import { toHour24, sortTimeSlots, eligibleDaysFor, greedyScheduler, detectConflicts } from './scheduler';

const SETTINGS = { prioritizePreferences: true, minimizeGaps: true, balanceWorkload: true };
const SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM'];
const DAYS = ['Monday', 'Tuesday'];

const activity = (id, overrides = {}) => ({
  id,
  name: `Activity ${id}`,
  duration: 1,
  priority: 'medium',
  preferredDays: [],
  preferredTimes: [],
  avoidTimes: [],
  instructor: '',
  room: '',
  recurring: false,
  ...overrides
});

const placementsOf = (schedule, id) =>
  Object.entries(schedule).flatMap(([day, slots]) =>
    Object.entries(slots).filter(([, a]) => a.id === id).map(([time]) => `${day} ${time}`)
  );

describe('toHour24', () => {
  it('converts 12-hour labels to 24-hour numbers', () => {
    expect(toHour24('9:00 AM')).toBe(9);
    expect(toHour24('12:00 PM')).toBe(12);
    expect(toHour24('1:00 PM')).toBe(13);
    expect(toHour24('12:00 AM')).toBe(0);
  });
});

describe('sortTimeSlots', () => {
  it('sorts by time of day, not alphabetically', () => {
    expect(sortTimeSlots(['1:00 PM', '9:00 AM', '12:00 PM', '10:00 AM']))
      .toEqual(['9:00 AM', '10:00 AM', '12:00 PM', '1:00 PM']);
  });
});

describe('eligibleDaysFor', () => {
  it('uses all working days when no preference is set', () => {
    expect(eligibleDaysFor(activity(1), DAYS)).toEqual(DAYS);
  });

  it('keeps only preferred days that are working days', () => {
    expect(eligibleDaysFor(activity(1, { preferredDays: ['Tuesday', 'Saturday'] }), DAYS)).toEqual(['Tuesday']);
  });
});

describe('greedyScheduler', () => {
  it('places a multi-hour activity in consecutive slots on one day', () => {
    const schedule = greedyScheduler([activity(1, { duration: 2 })], SLOTS, DAYS, SETTINGS);
    const placed = placementsOf(schedule, 1);
    expect(placed).toHaveLength(2);
    const [day] = placed[0].split(' ');
    expect(placed.every(p => p.startsWith(day))).toBe(true);
  });

  it('never puts two activities in the same slot', () => {
    const acts = [1, 2, 3, 4, 5, 6].map(id => activity(id));
    const schedule = greedyScheduler(acts, SLOTS, DAYS, SETTINGS);
    const total = Object.values(schedule).reduce((n, day) => n + Object.keys(day).length, 0);
    expect(total).toBe(6);
    acts.forEach(a => expect(placementsOf(schedule, a.id)).toHaveLength(1));
  });

  it('places a recurring activity once on every eligible day', () => {
    const schedule = greedyScheduler([activity(1, { recurring: true })], SLOTS, DAYS, SETTINGS);
    expect(placementsOf(schedule, 1).map(p => p.split(' ')[0]).sort()).toEqual(['Monday', 'Tuesday']);
  });

  it('respects avoid times across the whole duration', () => {
    const schedule = greedyScheduler(
      [activity(1, { duration: 2, avoidTimes: ['10:00 AM'] })], SLOTS, ['Monday'], SETTINGS
    );
    expect(placementsOf(schedule, 1)).toHaveLength(0);
  });

  it('prefers the requested time when it is free', () => {
    const schedule = greedyScheduler(
      [activity(1, { preferredTimes: ['11:00 AM'] })], SLOTS, ['Monday'], SETTINGS
    );
    expect(placementsOf(schedule, 1)).toEqual(['Monday 11:00 AM']);
  });

  it('only uses preferred days', () => {
    const schedule = greedyScheduler(
      [activity(1, { preferredDays: ['Tuesday'] })], SLOTS, DAYS, SETTINGS
    );
    expect(placementsOf(schedule, 1)[0]).toMatch(/^Tuesday/);
  });
});

describe('detectConflicts', () => {
  it('reports nothing for a valid schedule, including multi-hour and shared-instructor activities', () => {
    const acts = [
      activity(1, { duration: 2, instructor: 'Bob', room: 'R1' }),
      activity(2, { instructor: 'Bob', room: 'R1' })
    ];
    const schedule = greedyScheduler(acts, SLOTS, DAYS, SETTINGS);
    expect(detectConflicts(schedule, acts, SLOTS)).toEqual([]);
  });

  it('reports activities that did not fit', () => {
    const acts = [1, 2, 3, 4, 5, 6, 7].map(id => activity(id));
    const schedule = greedyScheduler(acts, SLOTS, DAYS, SETTINGS);
    const conflicts = detectConflicts(schedule, acts, SLOTS);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('unscheduled');
  });

  it('reports a recurring activity that only fit on some days', () => {
    const blocker = [1, 2, 3].map(id => activity(id, { preferredDays: ['Tuesday'], priority: 'high' }));
    const acts = [...blocker, activity(9, { recurring: true, priority: 'low' })];
    const schedule = greedyScheduler(acts, SLOTS, DAYS, SETTINGS);
    const conflicts = detectConflicts(schedule, acts, SLOTS);
    expect(conflicts.map(c => c.type)).toEqual(['partially_scheduled']);
  });

  it('reports activities whose preferred days are not in the timetable', () => {
    const acts = [activity(1, { preferredDays: ['Saturday'] })];
    const schedule = greedyScheduler(acts, SLOTS, DAYS, SETTINGS);
    expect(detectConflicts(schedule, acts, SLOTS)[0].type).toBe('no_eligible_day');
  });

  it('reports a multi-hour block cut short by another activity', () => {
    const a = activity(1, { duration: 2 });
    const b = activity(2);
    const schedule = { Monday: { '9:00 AM': a, '10:00 AM': b } };
    const conflicts = detectConflicts(schedule, [a, b], SLOTS);
    expect(conflicts.some(c => c.type === 'time_overlap' && c.day === 'Monday' && c.time === '9:00 AM')).toBe(true);
  });
});
