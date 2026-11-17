import { describe, expect, it } from 'vitest';
import { fileNameFor, nextDateFor, scheduleBlocks, timetableToCSV, timetableToICS } from './exporters';

const maths = { id: 'm1', name: 'Maths', instructor: 'Ms. Rao', room: 'B12' };
const art = { id: 'a1', name: 'Art, "Clay"', room: '' };

// Days arrive out of order on purpose (Firestore sorts map keys).
const schedule = {
  Wednesday: { '8:00 AM': art },
  Monday: { '8:00 AM': maths, '8:45 AM': maths }
};
const timetableData = { name: 'Class 10B', timeSlots: ['8:00 AM', '8:45 AM'], slotMinutes: 45 };

describe('scheduleBlocks', () => {
  it('merges back-to-back slots of one activity into one block', () => {
    const blocks = scheduleBlocks(schedule, timetableData.timeSlots, 45);
    expect(blocks.map(b => [b.day, b.entry.name, b.start, b.end])).toEqual([
      ['Monday', 'Maths', 480, 570],
      ['Wednesday', 'Art, "Clay"', 480, 525]
    ]);
  });
});

describe('timetableToCSV', () => {
  it('writes a grid in week order with quoted cells', () => {
    const csv = timetableToCSV(schedule, timetableData);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).trim().split('\r\n')).toEqual([
      'Time,Monday,Wednesday',
      '8:00 AM – 8:45 AM,"Maths (Ms. Rao, B12)","Art, ""Clay"""',
      '8:45 AM – 9:30 AM,"Maths (Ms. Rao, B12)",'
    ]);
  });
});

describe('timetableToICS', () => {
  // Tuesday 17 November 2026
  const from = new Date(2026, 10, 17);
  const ics = timetableToICS(schedule, timetableData, from);

  it('creates one weekly event per block, from this week', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART:20261123T080000'); // next Monday
    expect(ics).toContain('DTEND:20261123T093000');
    expect(ics).toContain('DTSTART:20261118T080000'); // Wednesday this week
    expect(ics.match(/RRULE:FREQ=WEEKLY/g)).toHaveLength(2);
  });

  it('escapes text and includes place and teacher', () => {
    expect(ics).toContain('SUMMARY:Art\\, "Clay"');
    expect(ics).toContain('LOCATION:B12');
    expect(ics).toContain('DESCRIPTION:With: Ms. Rao');
    expect(ics).toContain('X-WR-CALNAME:Class 10B');
    expect(ics.split('\r\n').every(line => line.length <= 75)).toBe(true);
  });
});

describe('nextDateFor', () => {
  it('counts today as the first occurrence', () => {
    expect(nextDateFor('Tuesday', new Date(2026, 10, 17)).getDate()).toBe(17);
    expect(nextDateFor('Sunday', new Date(2026, 10, 17)).getDate()).toBe(22);
  });
});

describe('fileNameFor', () => {
  it('makes a safe file name', () => {
    expect(fileNameFor('Class 10B – Term 2', 'csv')).toBe('Class 10B Term 2.csv');
    expect(fileNameFor('', 'ics')).toBe('timetable.ics');
  });
});
