// Scheduling: pure functions, no React, so they can be tested on their own.
//
// How a timetable is built
// ------------------------
// Every activity becomes one or more "sessions": once a week, N times a week,
// or one per day for "every day". Each session needs `duration` back-to-back
// slots on one of its allowed days, avoiding its "never at" times.
//
// 1. Search with backtracking. Repeatedly take the session with the fewest
//    places left to go (the hardest one), try its places best-first, and undo
//    earlier choices when something gets stuck. This finds a timetable where
//    everything fits whenever one exists (within a time budget).
// 2. If everything cannot fit, place the most important sessions first,
//    move an already placed session aside when that makes room, and leave out
//    what is left. Several randomised passes; the one that leaves out the
//    least important work wins.
//
// "Best" places are scored by the soft rules: preferred start times, keeping
// each day compact, spreading work across the week, never putting a subject
// twice in one day when another day is free, and pulling important
// activities towards the morning. A little randomness breaks ties, so
// Regenerate gives a different (equally valid) arrangement.
import { formatDuration, toMinutes } from './time';

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const MORNING_PULL = { high: 2.5, medium: 1.5, low: 0.5 };

const SEARCH_BUDGET = 2500;   // places tried per search attempt
const SEARCH_ATTEMPTS = 3;
const FALLBACK_PASSES = 12;
const TIE_BREAK = 1.5;        // size of the random nudge added to each score

/**
 * Convert a label like "1:00 PM" to a 24-hour number (13).
 * Handles 12 AM (midnight -> 0) and 12 PM (noon -> 12).
 */
export const toHour24 = (label) => {
  const hour = parseInt(label, 10);
  if (Number.isNaN(hour)) return 0;
  const isPM = /PM/i.test(label);
  const isAM = /AM/i.test(label);
  if (isPM && hour !== 12) return hour + 12;
  if (isAM && hour === 12) return 0;
  return hour;
};

export const sortTimeSlots = (slots) =>
  [...slots].sort((a, b) => toMinutes(a) - toMinutes(b));

/** Days on which an activity is allowed to be placed. */
export const eligibleDaysFor = (activity, workingDays) => {
  const preferred = activity.preferredDays || [];
  return preferred.length > 0
    ? workingDays.filter((day) => preferred.includes(day))
    : workingDays;
};

/** How many times an activity should appear in the week. */
export const sessionsPerWeek = (activity, eligibleDayCount) => {
  if (activity.recurring) return eligibleDayCount;
  const times = parseInt(activity.timesPerWeek, 10);
  return Number.isFinite(times) ? Math.min(7, Math.max(1, times)) : 1;
};

/** Start positions where the activity's back-to-back slots fit, ignoring other activities. */
const fittingStarts = (activity, slots, slotMinutes) => {
  const duration = Math.max(1, activity.duration || 1);
  const avoid = new Set(activity.avoidTimes || []);
  const starts = [];
  for (let t = 0; t + duration <= slots.length; t++) {
    let fits = true;
    for (let k = 0; k < duration && fits; k++) {
      if (avoid.has(slots[t + k])) fits = false;
      // No skipped break (e.g. lunch) inside one activity.
      else if (k > 0 && toMinutes(slots[t + k]) - toMinutes(slots[t + k - 1]) !== slotMinutes) fits = false;
    }
    if (fits) starts.push(t);
  }
  return starts;
};

// Small seeded random number generator (mulberry32), so tests can repeat a run.
const randomGenerator = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Build a weekly schedule: { [day]: { [slot]: activity } }.
 * `settings`: prioritizePreferences, minimizeGaps, balanceWorkload.
 * `options.seed` makes the result repeatable; without it every call may
 * return a different valid arrangement.
 */
export const buildSchedule = (
  activities,
  timeSlots,
  workingDays,
  settings = {},
  slotMinutes = 60,
  options = {}
) => {
  const random = randomGenerator(options.seed ?? Math.floor(Math.random() * 4294967296));
  const slots = sortTimeSlots(timeSlots);
  const S = slots.length;
  const D = workingDays.length;

  // --- Sessions -----------------------------------------------------------
  const sessions = [];
  activities.forEach((activity, a) => {
    const days = eligibleDaysFor(activity, workingDays).map((day) => workingDays.indexOf(day));
    if (days.length === 0) return;
    const starts = fittingStarts(activity, slots, slotMinutes);
    const count = sessionsPerWeek(activity, days.length);
    const duration = Math.max(1, activity.duration || 1);
    const priority = PRIORITY_WEIGHT[activity.priority] || PRIORITY_WEIGHT.medium;
    for (let n = 0; n < count; n++) {
      const sessionDays = activity.recurring ? [days[n]] : days;
      sessions.push({
        a,
        activity,
        duration,
        priority,
        weight: priority * duration,
        recurring: Boolean(activity.recurring),
        preferred: new Set(activity.preferredTimes || []),
        // More sessions than days: allow the fewest doubles needed.
        maxPerDay: Math.ceil(count / days.length),
        candidates: sessionDays.flatMap((d) => starts.map((t) => [d, t]))
      });
    }
  });

  // --- State --------------------------------------------------------------
  const grid = workingDays.map(() => new Array(S).fill(-1)); // session index per slot
  const load = new Array(D).fill(0);                          // used slots per day
  const perDay = activities.map(() => new Array(D).fill(0));  // sessions of an activity per day
  let placedAt = new Array(sessions.length).fill(null);

  // How many sessions still waiting to be placed asked to start at each
  // day/slot. Others steer clear of those slots, so placing a constrained
  // activity early does not take a time someone else asked for.
  const wanted = workingDays.map(() => new Array(S).fill(0));
  const wishes = sessions.map((s) => s.candidates.filter(([, t]) => s.preferred.has(slots[t])));
  const wishKeys = wishes.map((list) => new Set(list.map(([d, t]) => d * S + t)));
  const markWishes = (i, delta) => wishes[i].forEach(([d, t]) => { wanted[d][t] += delta; });

  const reset = () => {
    grid.forEach((row) => row.fill(-1));
    load.fill(0);
    perDay.forEach((row) => row.fill(0));
    wanted.forEach((row) => row.fill(0));
    sessions.forEach((_, i) => markWishes(i, 1));
    placedAt = new Array(sessions.length).fill(null);
  };
  reset();

  const place = (i, d, t) => {
    const s = sessions[i];
    for (let k = 0; k < s.duration; k++) grid[d][t + k] = i;
    load[d] += s.duration;
    perDay[s.a][d] += 1;
    markWishes(i, -1);
    placedAt[i] = [d, t];
  };

  const unplace = (i) => {
    const s = sessions[i];
    const [d, t] = placedAt[i];
    for (let k = 0; k < s.duration; k++) grid[d][t + k] = -1;
    load[d] -= s.duration;
    perDay[s.a][d] -= 1;
    markWishes(i, 1);
    placedAt[i] = null;
  };

  const holdsActivity = (d, t, a) => t >= 0 && t < S && grid[d][t] !== -1 && sessions[grid[d][t]].a === a;

  const canPlace = (i, d, t) => {
    const s = sessions[i];
    if (perDay[s.a][d] >= s.maxPerDay) return false;
    for (let k = 0; k < s.duration; k++) if (grid[d][t + k] !== -1) return false;
    // Two sessions of one activity side by side would read as one long block.
    return !holdsActivity(d, t - 1, s.a) && !holdsActivity(d, t + s.duration, s.a);
  };

  const countOptions = (i, stopAt) => {
    let n = 0;
    for (const [d, t] of sessions[i].candidates) {
      if (canPlace(i, d, t) && ++n >= stopAt) break;
    }
    return n;
  };

  // Free slots between the first and last used slot of a day (optionally
  // with one more block placed).
  const gapsIn = (d, start = 0, length = 0) => {
    let first = length ? start : S;
    let last = length ? start + length - 1 : -1;
    let used = length;
    for (let t = 0; t < S; t++) {
      if (grid[d][t] === -1) continue;
      used += 1;
      if (t < first) first = t;
      if (t > last) last = t;
    }
    return last < first ? 0 : last - first + 1 - used;
  };

  const scoreOf = (i, d, t) => {
    const s = sessions[i];
    let score = 0;
    if (s.preferred.has(slots[t])) score += settings.prioritizePreferences ? 12 : 5;
    // Stay off times that other activities still waiting asked for.
    let othersWant = 0;
    for (let k = 0; k < s.duration; k++) {
      othersWant += wanted[d][t + k] - (wishKeys[i].has(d * S + t + k) ? 1 : 0);
    }
    score -= othersWant * (settings.prioritizePreferences ? 6 : 2.5);
    // Important activities lean towards the morning.
    if (S > 1) score -= (MORNING_PULL[s.activity.priority] ?? MORNING_PULL.medium) * 2 * (t / (S - 1));
    if (settings.minimizeGaps) score -= 2.5 * (gapsIn(d, t, s.duration) - gapsIn(d));
    // Each extra hour on an already busy day costs more than the last.
    if (settings.balanceWorkload) score -= 0.8 * ((load[d] + s.duration) ** 2 - load[d] ** 2);
    if (!s.recurring) {
      // Spread one subject's sessions over the week.
      if (perDay[s.a][d] > 0) score -= 12;
      if (d > 0 && perDay[s.a][d - 1] > 0) score -= 2;
      if (d < D - 1 && perDay[s.a][d + 1] > 0) score -= 2;
    }
    return score + random() * TIE_BREAK;
  };

  const rankedOptions = (i) =>
    sessions[i].candidates
      .filter(([d, t]) => canPlace(i, d, t))
      .map(([d, t]) => ({ d, t, score: scoreOf(i, d, t) }))
      .sort((x, y) => y.score - x.score);

  // --- 1. Backtracking search for a timetable where everything fits ---------
  const search = () => {
    let budget = SEARCH_BUDGET;
    const solve = (remaining) => {
      if (remaining === 0) return true;
      // The session with the fewest places left goes next.
      let pick = -1;
      let fewest = Infinity;
      for (let i = 0; i < sessions.length; i++) {
        if (placedAt[i]) continue;
        const n = countOptions(i, fewest + 1);
        if (n === 0) return false;
        if (n < fewest || (n === fewest && sessions[i].weight > sessions[pick].weight)) {
          fewest = n;
          pick = i;
        }
      }
      for (const { d, t } of rankedOptions(pick)) {
        if (--budget < 0) return false;
        place(pick, d, t);
        if (solve(remaining - 1)) return true;
        unplace(pick);
      }
      return false;
    };
    return solve(sessions.length);
  };

  const neededSlots = sessions.reduce((n, s) => n + s.duration, 0);
  let solved = false;
  if (neededSlots <= D * S) {
    for (let attempt = 0; attempt < SEARCH_ATTEMPTS && !solved; attempt++) {
      reset();
      solved = search();
    }
  }

  // --- 2. Not everything fits: keep the most important work ----------------
  if (!solved) {
    // Make room for session i by moving one placed session somewhere else.
    const repair = (i) => {
      const s = sessions[i];
      for (const [d, t] of s.candidates) {
        if (perDay[s.a][d] >= s.maxPerDay) continue;
        const blockers = new Set();
        for (let k = 0; k < s.duration; k++) if (grid[d][t + k] !== -1) blockers.add(grid[d][t + k]);
        if (blockers.size !== 1) continue;
        const [j] = blockers;
        const [fromDay, fromStart] = placedAt[j];
        unplace(j);
        if (canPlace(i, d, t)) {
          place(i, d, t);
          const [elsewhere] = rankedOptions(j);
          if (elsewhere) {
            place(j, elsewhere.d, elsewhere.t);
            return true;
          }
          unplace(i);
        }
        place(j, fromDay, fromStart);
      }
      return false;
    };

    let best = null;
    for (let pass = 0; pass < FALLBACK_PASSES; pass++) {
      reset();
      let left = 0;
      let total = 0;
      const open = new Set(sessions.keys());
      while (open.size > 0) {
        // Most important first; among equals, the hardest to fit.
        let pick = -1;
        let pickOptions = Infinity;
        for (const i of open) {
          const n = countOptions(i, Infinity);
          if (pick === -1 || sessions[i].priority > sessions[pick].priority ||
            (sessions[i].priority === sessions[pick].priority && n < pickOptions)) {
            pick = i;
            pickOptions = n;
          }
        }
        open.delete(pick);
        const [choice] = rankedOptions(pick);
        if (choice) {
          place(pick, choice.d, choice.t);
          total += choice.score;
        } else if (!repair(pick)) {
          left += sessions[pick].weight;
        }
      }
      if (!best || left < best.left || (left === best.left && total > best.total)) {
        best = { left, total, placed: placedAt.slice() };
      }
      if (left === 0) break;
    }
    reset();
    best.placed.forEach((at, i) => at && place(i, at[0], at[1]));
  }

  // --- Result, in day and time order ---------------------------------------
  const schedule = {};
  workingDays.forEach((day, d) => {
    schedule[day] = {};
    slots.forEach((slot, t) => {
      if (grid[d][t] !== -1) schedule[day][slot] = { ...sessions[grid[d][t]].activity };
    });
  });
  return schedule;
};

/**
 * Find real problems in a generated schedule:
 *  - activities that could not be placed at all, or fewer times than asked
 *  - multi-slot blocks that were cut short by another activity
 * The schedule's own day keys are treated as the working days so this also
 * works for timetables loaded from the cloud.
 */
export const detectConflicts = (schedule, activities = [], timeSlots = [], slotMinutes = 60) => {
  const conflicts = [];
  if (!schedule) return conflicts;
  const workingDays = Object.keys(schedule);
  const orderedSlots = timeSlots.length > 0 ? sortTimeSlots(timeSlots) : sortTimeSlots(
    [...new Set(workingDays.flatMap((day) => Object.keys(schedule[day] || {})))]
  );

  // Count how many separate blocks of each activity were placed.
  const placements = {};
  workingDays.forEach((day) => {
    const daySchedule = schedule[day] || {};
    orderedSlots.forEach((slot, index) => {
      const entry = daySchedule[slot];
      if (!entry) return;
      const prev = daySchedule[orderedSlots[index - 1]];
      const isStart = !prev || prev.id !== entry.id;
      if (!isStart) return;

      placements[entry.id] = (placements[entry.id] || 0) + 1;

      // Check that the whole duration is occupied by this same activity.
      for (let i = 1; i < (entry.duration || 1); i++) {
        const next = daySchedule[orderedSlots[index + i]];
        if (next && next.id !== entry.id) {
          conflicts.push({
            type: 'time_overlap',
            severity: 'high',
            message: `${entry.name} overlaps with ${next.name} on ${day}`,
            day,
            time: slot
          });
          break;
        }
      }
    });
  });

  activities.forEach((activity) => {
    const placed = placements[activity.id] || 0;
    const days = eligibleDaysFor(activity, workingDays);

    if (days.length === 0) {
      conflicts.push({
        type: 'no_eligible_day',
        severity: 'high',
        message: `${activity.name} could not be scheduled: none of its preferred days are in this timetable`
      });
      return;
    }

    const expected = sessionsPerWeek(activity, days.length);
    if (placed === 0) {
      const fitsAnywhere = fittingStarts(activity, orderedSlots, slotMinutes).length > 0;
      const length = formatDuration(Math.max(1, activity.duration || 1) * slotMinutes);
      conflicts.push({
        type: 'unscheduled',
        severity: 'high',
        message: fitsAnywhere
          ? `${activity.name} could not be scheduled: not enough free time slots`
          : `${activity.name} could not be scheduled: no ${length} run of back-to-back slots outside its "never at" times`
      });
    } else if (placed < expected) {
      conflicts.push({
        type: 'partially_scheduled',
        severity: 'medium',
        message: activity.recurring
          ? `${activity.name} was scheduled on ${placed} of ${expected} days: not enough free time slots`
          : `${activity.name} was scheduled ${placed} of ${expected} times this week: not enough free time slots`
      });
    }
  });

  return conflicts;
};
