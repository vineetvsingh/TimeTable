// Time helpers. Slots are stored as labels like "9:45 AM"; minutes since
// midnight are used for arithmetic.

/** "1:30 PM" -> 810. Labels without AM/PM are read as 24-hour. */
export const toMinutes = (label) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(String(label).trim());
  if (!match) return 0;
  let hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (!period) hour = Number(match[1]);
  if (period === 'PM') hour += 12;
  return hour * 60 + minute;
};

/** 810 -> "1:30 PM" */
export const formatTime = (minutes) => {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
};

/** "09:30" (value of <input type="time">) -> 570 */
export const fromTimeInput = (value) => {
  const match = /^(\d{2}):(\d{2})/.exec(value || '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/** Start-time labels for every slot that fits between start and end. */
export const buildSlots = (startMinutes, endMinutes, slotMinutes, max = 48) => {
  const slots = [];
  if (startMinutes == null || endMinutes == null || !slotMinutes) return slots;
  for (let t = startMinutes; t + slotMinutes <= endMinutes && slots.length < max; t += slotMinutes) {
    slots.push(formatTime(t));
  }
  return slots;
};

/** 45 -> "45 min", 60 -> "1 hour", 90 -> "1 h 30 min", 120 -> "2 hours" */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} h ${rest} min`;
};

/** "9:00 AM" + 45 -> "9:00 – 9:45 AM" (drops the repeated AM/PM). */
export const formatSlotRange = (label, slotMinutes) => {
  const start = toMinutes(label);
  const startLabel = formatTime(start);
  const endLabel = formatTime(start + slotMinutes);
  const samePeriod = startLabel.slice(-2) === endLabel.slice(-2);
  return `${samePeriod ? startLabel.slice(0, -3) : startLabel} – ${endLabel}`;
};

// Older saved timetables have no slot length: they were hourly.
export const slotMinutesOf = (data) => data?.slotMinutes || 60;

// The slot start times offered by a timetable's day start/end and slot length.
export const slotPaletteFor = (data) =>
  buildSlots(fromTimeInput(data.dayStart || '06:00'), fromTimeInput(data.dayEnd || '22:00'), slotMinutesOf(data));
