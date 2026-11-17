// Turn a generated timetable into files people can open elsewhere:
//   - CSV:  a grid like the on-screen timetable (Excel, Google Sheets, Numbers)
//   - ICS:  weekly repeating calendar events (Google Calendar, Outlook, phones)
import { DAYS } from '../constants';
import { formatTime, slotMinutesOf, toMinutes } from './time';

// Firestore returns map keys alphabetically, so put days back in week order.
export const orderedDays = (schedule) =>
  Object.keys(schedule || {}).sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));

/**
 * One entry per placed activity block (a multi-slot activity is one block):
 * { day, entry, start, end } with start/end in minutes since midnight.
 */
export const scheduleBlocks = (schedule, timeSlots, slotMinutes) => {
  const blocks = [];
  orderedDays(schedule).forEach((day) => {
    const daySchedule = schedule[day] || {};
    timeSlots.forEach((slot, index) => {
      const entry = daySchedule[slot];
      if (!entry) return;
      const prev = daySchedule[timeSlots[index - 1]];
      if (prev && prev.id === entry.id) return; // continuation of a block

      let last = index;
      while (daySchedule[timeSlots[last + 1]]?.id === entry.id) last++;
      blocks.push({
        day,
        entry,
        start: toMinutes(slot),
        end: toMinutes(timeSlots[last]) + slotMinutes
      });
    });
  });
  return blocks;
};

// ---------------------------------------------------------------- CSV

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const describe = (entry) => {
  const extra = [entry.instructor, entry.room].filter(Boolean).join(', ');
  return extra ? `${entry.name} (${extra})` : entry.name;
};

/** The timetable as CSV: a Time column, then one column per day. */
export const timetableToCSV = (schedule, timetableData) => {
  const days = orderedDays(schedule);
  const slotMinutes = slotMinutesOf(timetableData);
  const rows = [['Time', ...days]];
  timetableData.timeSlots.forEach((slot) => {
    rows.push([
      `${slot} – ${formatTime(toMinutes(slot) + slotMinutes)}`,
      ...days.map((day) => {
        const entry = schedule[day]?.[slot];
        return entry ? describe(entry) : '';
      })
    ]);
  });
  // The byte-order mark makes Excel read the file as UTF-8 (en dashes, accents).
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
};

// ---------------------------------------------------------------- ICS

const pad = (n) => String(n).padStart(2, '0');

// Local "floating" date-time: shown at that clock time in the user's calendar.
const icsLocal = (date, minutes) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;

const icsUtc = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
  `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

const icsText = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Lines longer than 75 characters are folded onto continuation lines.
const fold = (line) => {
  const parts = [];
  for (let i = 0; i < line.length; i += 73) parts.push((i ? ' ' : '') + line.slice(i, i + 73));
  return parts.join('\r\n');
};

/** The next date (today included) that falls on the given weekday name. */
export const nextDateFor = (dayName, from) => {
  const target = (DAYS.indexOf(dayName) + 1) % 7; // JS: Sunday = 0
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7));
  return date;
};

/**
 * The timetable as an iCalendar file: one weekly repeating event per block,
 * starting from this week (`from`, default today).
 */
export const timetableToICS = (schedule, timetableData, from = new Date()) => {
  const slotMinutes = slotMinutesOf(timetableData);
  const blocks = scheduleBlocks(schedule, timetableData.timeSlots, slotMinutes);
  const stamp = icsUtc(new Date());
  const calendarName = timetableData.name || 'Timetable';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(calendarName)}`
  ];

  blocks.forEach(({ day, entry, start, end }, index) => {
    const date = nextDateFor(day, from);
    const details = [
      entry.instructor && `With: ${entry.instructor}`,
      entry.description
    ].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${icsLocal(date, start)}-${index}-${String(entry.id).replace(/[^a-z0-9]/gi, '')}@smart-timetable`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocal(date, start)}`,
      `DTEND:${icsLocal(date, Math.min(end, 24 * 60 - 1))}`,
      'RRULE:FREQ=WEEKLY',
      `SUMMARY:${icsText(entry.name)}`
    );
    if (entry.room) lines.push(`LOCATION:${icsText(entry.room)}`);
    if (details) lines.push(`DESCRIPTION:${icsText(details)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
};

// ---------------------------------------------------------------- download

/** A file name made from the timetable name, safe on every OS. */
export const fileNameFor = (name, extension) => {
  const safe = (name || '').replace(/[^a-z0-9 _-]/gi, ' ').replace(/\s+/g, ' ').trim() || 'timetable';
  return `${safe}.${extension}`;
};

/** Start a download of `content` as `fileName`. */
export const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in Firefox and Safari.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};
