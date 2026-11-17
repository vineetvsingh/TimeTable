// Scheduling helpers: pure functions so they can be reasoned about and tested
// independently of React state.

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
const PRIORITY_BONUS = { high: 8, medium: 4, low: 2 };

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
  [...slots].sort((a, b) => toHour24(a) - toHour24(b));

/** Days on which an activity is allowed to be placed. */
export const eligibleDaysFor = (activity, workingDays) => {
  const preferred = activity.preferredDays || [];
  return preferred.length > 0
    ? workingDays.filter((day) => preferred.includes(day))
    : workingDays;
};

const findBestSlot = (activity, schedule, timeSlots, candidateDays, settings) => {
  const duration = activity.duration || 1;
  const preferredTimes = activity.preferredTimes || [];
  const avoidTimes = activity.avoidTimes || [];
  let best = null;
  let bestScore = -Infinity;

  candidateDays.forEach((day) => {
    timeSlots.forEach((time, timeIndex) => {
      // Every hour the activity occupies must exist, be free and not be avoided.
      for (let i = 0; i < duration; i++) {
        const checkTime = timeSlots[timeIndex + i];
        if (!checkTime || schedule[day][checkTime] || avoidTimes.includes(checkTime)) return;
      }

      let score = 0;
      if (preferredTimes.includes(time)) {
        score += settings.prioritizePreferences ? 10 : 3;
      }
      score += PRIORITY_BONUS[activity.priority] || 0;

      if (settings.minimizeGaps) {
        const adjacent = [timeSlots[timeIndex - 1], timeSlots[timeIndex + duration]];
        adjacent.forEach((slot) => {
          if (slot && schedule[day][slot]) score += 3;
        });
      }

      if (settings.balanceWorkload) {
        const dayLoad = Object.keys(schedule[day]).length;
        score += Math.max(0, 5 - dayLoad);
      }

      if (activity.priority !== 'high') {
        const hour = toHour24(time);
        if (hour < 9 || hour > 17) score -= 2;
      }

      if (score > bestScore) {
        bestScore = score;
        best = { day, timeIndex };
      }
    });
  });

  return best;
};

/**
 * Greedy scheduler. Higher-priority activities (and those with time
 * preferences) are placed first. Recurring activities are placed once on
 * every eligible day; others are placed once in the week.
 */
export const greedyScheduler = (activities, timeSlots, workingDays, settings = {}) => {
  const schedule = {};
  workingDays.forEach((day) => {
    schedule[day] = {};
  });

  const sorted = [...activities].sort((a, b) => {
    const aScore = (PRIORITY_ORDER[a.priority] || 0) + ((a.preferredTimes || []).length > 0 ? 2 : 0);
    const bScore = (PRIORITY_ORDER[b.priority] || 0) + ((b.preferredTimes || []).length > 0 ? 2 : 0);
    return bScore - aScore;
  });

  const place = (activity, { day, timeIndex }) => {
    for (let i = 0; i < (activity.duration || 1); i++) {
      schedule[day][timeSlots[timeIndex + i]] = { ...activity };
    }
  };

  sorted.forEach((activity) => {
    const days = eligibleDaysFor(activity, workingDays);
    if (activity.recurring) {
      days.forEach((day) => {
        const slot = findBestSlot(activity, schedule, timeSlots, [day], settings);
        if (slot) place(activity, slot);
      });
    } else {
      const slot = findBestSlot(activity, schedule, timeSlots, days, settings);
      if (slot) place(activity, slot);
    }
  });

  return schedule;
};

/**
 * Find real problems in a generated schedule:
 *  - activities that could not be placed at all (or only partly, for recurring)
 *  - multi-hour blocks that were cut short by another activity
 * The schedule's own day keys are treated as the working days so this also
 * works for timetables loaded from the cloud.
 */
export const detectConflicts = (schedule, activities = [], timeSlots = []) => {
  const conflicts = [];
  if (!schedule) return conflicts;
  const workingDays = Object.keys(schedule);
  const orderedSlots = timeSlots.length > 0 ? timeSlots : sortTimeSlots(
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

    const expected = activity.recurring ? days.length : 1;
    if (placed === 0) {
      conflicts.push({
        type: 'unscheduled',
        severity: 'high',
        message: `${activity.name} could not be scheduled: not enough free time slots`
      });
    } else if (placed < expected) {
      conflicts.push({
        type: 'partially_scheduled',
        severity: 'medium',
        message: `${activity.name} was scheduled on ${placed} of ${expected} days: not enough free time slots`
      });
    }
  });

  return conflicts;
};
