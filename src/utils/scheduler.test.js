import { describe, it, expect } from 'vitest';
import { toHour24, sortTimeSlots, eligibleDaysFor, buildSchedule, detectConflicts, sessionsPerWeek } from './scheduler';

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

describe('buildSchedule', () => {
  it('places a multi-hour activity in consecutive slots on one day', () => {
    const schedule = buildSchedule([activity(1, { duration: 2 })], SLOTS, DAYS, SETTINGS);
    const placed = placementsOf(schedule, 1);
    expect(placed).toHaveLength(2);
    const [day] = placed[0].split(' ');
    expect(placed.every(p => p.startsWith(day))).toBe(true);
  });

  it('never puts two activities in the same slot', () => {
    const acts = [1, 2, 3, 4, 5, 6].map(id => activity(id));
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS);
    const total = Object.values(schedule).reduce((n, day) => n + Object.keys(day).length, 0);
    expect(total).toBe(6);
    acts.forEach(a => expect(placementsOf(schedule, a.id)).toHaveLength(1));
  });

  it('places a recurring activity once on every eligible day', () => {
    const schedule = buildSchedule([activity(1, { recurring: true })], SLOTS, DAYS, SETTINGS);
    expect(placementsOf(schedule, 1).map(p => p.split(' ')[0]).sort()).toEqual(['Monday', 'Tuesday']);
  });

  it('respects avoid times across the whole duration', () => {
    const schedule = buildSchedule(
      [activity(1, { duration: 2, avoidTimes: ['10:00 AM'] })], SLOTS, ['Monday'], SETTINGS
    );
    expect(placementsOf(schedule, 1)).toHaveLength(0);
  });

  it('prefers the requested time when it is free', () => {
    const schedule = buildSchedule(
      [activity(1, { preferredTimes: ['11:00 AM'] })], SLOTS, ['Monday'], SETTINGS
    );
    expect(placementsOf(schedule, 1)).toEqual(['Monday 11:00 AM']);
  });

  it('only uses preferred days', () => {
    const schedule = buildSchedule(
      [activity(1, { preferredDays: ['Tuesday'] })], SLOTS, DAYS, SETTINGS
    );
    expect(placementsOf(schedule, 1)[0]).toMatch(/^Tuesday/);
  });
});

describe('buildSchedule with custom slot lengths', () => {
  it('fills back-to-back 45-minute slots', () => {
    const slots = ['9:00 AM', '9:45 AM', '10:30 AM'];
    const schedule = buildSchedule([{ id: 1, name: 'Lab', duration: 2, priority: 'high' }], slots, ['Monday'], {}, 45);
    const used = Object.keys(schedule.Monday);
    expect(used).toHaveLength(2);
    expect(slots.indexOf(used[1]) - slots.indexOf(used[0])).toBe(1);
  });

  it('never splits an activity across a skipped break', () => {
    // 12:00 PM is not selected (lunch), so 11 AM + 1 PM are not back to back.
    const slots = ['11:00 AM', '1:00 PM'];
    const schedule = buildSchedule([{ id: 1, name: 'Lab', duration: 2, priority: 'high' }], slots, ['Monday'], {});
    expect(schedule.Monday).toEqual({});
  });
});

describe('detectConflicts', () => {
  it('reports nothing for a valid schedule, including multi-hour and shared-instructor activities', () => {
    const acts = [
      activity(1, { duration: 2, instructor: 'Bob', room: 'R1' }),
      activity(2, { instructor: 'Bob', room: 'R1' })
    ];
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS);
    expect(detectConflicts(schedule, acts, SLOTS)).toEqual([]);
  });

  it('reports activities that did not fit', () => {
    const acts = [1, 2, 3, 4, 5, 6, 7].map(id => activity(id));
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS);
    const conflicts = detectConflicts(schedule, acts, SLOTS);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('unscheduled');
  });

  it('reports a recurring activity that only fit on some days', () => {
    const blocker = [1, 2, 3].map(id => activity(id, { preferredDays: ['Tuesday'], priority: 'high' }));
    const acts = [...blocker, activity(9, { recurring: true, priority: 'low' })];
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS);
    const conflicts = detectConflicts(schedule, acts, SLOTS);
    expect(conflicts.map(c => c.type)).toEqual(['partially_scheduled']);
  });

  it('reports activities whose preferred days are not in the timetable', () => {
    const acts = [activity(1, { preferredDays: ['Saturday'] })];
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS);
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

describe('buildSchedule: finding a timetable that fits', () => {
  it('moves a flexible activity aside so a longer one fits', () => {
    // Assembly would like 9 AM, but then the 2-hour Lab has nowhere to go.
    const acts = [
      activity('assembly', { priority: 'high', preferredTimes: ['9:00 AM'] }),
      activity('lab', { duration: 2 })
    ];
    for (let seed = 1; seed <= 20; seed++) {
      const schedule = buildSchedule(acts, SLOTS, ['Monday'], SETTINGS, 60, { seed });
      expect(placementsOf(schedule, 'assembly')).toHaveLength(1);
      expect(placementsOf(schedule, 'lab')).toHaveLength(2);
      expect(detectConflicts(schedule, acts, SLOTS)).toEqual([]);
    }
  });

  it('solves a tight week where every slot is needed', () => {
    // 5 days x 4 slots = 20, and 3x2 + 2x3 + 3 + 5 = 20: every slot is needed.
    const slots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];
    const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const acts = [
      activity('maths', { duration: 2, timesPerWeek: 3 }),
      activity('lab', { duration: 3, preferredDays: ['Tuesday', 'Thursday'], timesPerWeek: 2 }),
      activity('pe', { avoidTimes: ['8:00 AM'], timesPerWeek: 3 }),
      activity('reading', { recurring: true })
    ];
    const schedule = buildSchedule(acts, slots, week, SETTINGS, 60, { seed: 7 });
    expect(detectConflicts(schedule, acts, slots)).toEqual([]);
    const total = Object.values(schedule).reduce((n, day) => n + Object.keys(day).length, 0);
    expect(total).toBe(20);
  });

  it('spreads one-off activities across the week instead of piling them on Monday', () => {
    const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const day = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
    const acts = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => activity(id));
    const schedule = buildSchedule(acts, day, week, SETTINGS, 60, { seed: 3 });
    const perDay = week.map(d => Object.keys(schedule[d]).length);
    expect(perDay.every(n => n >= 1 && n <= 2)).toBe(true);
  });

  it('keeps each day compact, starting in the morning', () => {
    const day = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM'];
    const acts = ['a', 'b', 'c'].map(id => activity(id));
    const schedule = buildSchedule(acts, day, ['Monday'], SETTINGS, 60, { seed: 5 });
    expect(Object.keys(schedule.Monday)).toEqual(['8:00 AM', '9:00 AM', '10:00 AM']);
  });
});

describe('buildSchedule: times per week', () => {
  it('places each session on a different day', () => {
    const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const acts = [activity('physics', { timesPerWeek: 3 })];
    const schedule = buildSchedule(acts, SLOTS, week, SETTINGS, 60, { seed: 2 });
    const days = placementsOf(schedule, 'physics').map(p => p.split(' ')[0]);
    expect(days).toHaveLength(3);
    expect(new Set(days).size).toBe(3);
    expect(detectConflicts(schedule, acts, SLOTS)).toEqual([]);
  });

  it('doubles up on a day only when there are more sessions than days, never back to back', () => {
    const acts = [activity('maths', { timesPerWeek: 3 })];
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS, 60, { seed: 4 });
    const placed = placementsOf(schedule, 'maths');
    expect(placed).toHaveLength(3);
    const doubled = DAYS.find(d => placed.filter(p => p.startsWith(d)).length === 2);
    expect(Object.keys(schedule[doubled])).toEqual(['9:00 AM', '11:00 AM']);
    expect(detectConflicts(schedule, acts, SLOTS)).toEqual([]);
  });

  it('counts sessions for old activities without the field as once a week', () => {
    expect(sessionsPerWeek({}, 5)).toBe(1);
    expect(sessionsPerWeek({ timesPerWeek: 3 }, 5)).toBe(3);
    expect(sessionsPerWeek({ recurring: true, timesPerWeek: 2 }, 5)).toBe(5);
  });

  it('reports a session that did not fit', () => {
    // 2 days x 3 slots; at most 2 non-adjacent sessions a day (9 and 11 AM),
    // and Tuesday 10 AM is taken, so 4 sessions cannot all fit.
    const maths = activity('maths', { timesPerWeek: 5 });
    const acts = [maths];
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS, 60, { seed: 1 });
    const conflicts = detectConflicts(schedule, acts, SLOTS);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].message).toMatch(/scheduled 4 of 5 times this week/);
  });
});

describe('buildSchedule: when not everything fits', () => {
  it('keeps high-priority activities and leaves out low-priority ones', () => {
    const acts = [
      activity('low', { priority: 'low' }),
      activity('h1', { priority: 'high' }),
      activity('h2', { priority: 'high' }),
      activity('m1')
    ];
    const schedule = buildSchedule(acts, SLOTS, ['Monday'], SETTINGS, 60, { seed: 9 });
    expect(placementsOf(schedule, 'low')).toHaveLength(0);
    ['h1', 'h2', 'm1'].forEach(id => expect(placementsOf(schedule, id)).toHaveLength(1));
  });

  it('explains when an activity can never fit its allowed times', () => {
    const acts = [activity('lab', { duration: 2, avoidTimes: ['10:00 AM'] })];
    const schedule = buildSchedule(acts, SLOTS, DAYS, SETTINGS);
    expect(detectConflicts(schedule, acts, SLOTS)[0].message).toMatch(/no 2 hours run of back-to-back slots/);
  });

  it('finishes quickly on a large week that cannot all fit', () => {
    const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const day = Array.from({ length: 16 }, (_, i) => {
      const hour = i + 6;
      return `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
    });
    const acts = Array.from({ length: 30 }, (_, i) =>
      activity(`a${i}`, { duration: (i % 3) + 1, timesPerWeek: (i % 4) + 1, avoidTimes: i % 5 ? [] : ['10:00 AM'] }));
    const started = Date.now();
    const schedule = buildSchedule(acts, day, week, SETTINGS, 60, { seed: 11 });
    expect(Date.now() - started).toBeLessThan(3000);
    expect(detectConflicts(schedule, acts, day).every(c => c.type !== 'time_overlap')).toBe(true);
  });
});

describe('buildSchedule: Regenerate', () => {
  const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const acts = ['a', 'b', 'c', 'd'].map(id => activity(id));

  it('gives the same result for the same seed', () => {
    expect(buildSchedule(acts, SLOTS, week, SETTINGS, 60, { seed: 42 }))
      .toEqual(buildSchedule(acts, SLOTS, week, SETTINGS, 60, { seed: 42 }));
  });

  it('gives different valid arrangements for different seeds', () => {
    const results = new Set(
      [1, 2, 3, 4, 5, 6].map(seed => JSON.stringify(buildSchedule(acts, SLOTS, week, SETTINGS, 60, { seed })))
    );
    expect(results.size).toBeGreaterThan(1);
  });
});
