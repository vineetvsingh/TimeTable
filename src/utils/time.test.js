import { describe, it, expect } from 'vitest';
import {
  toMinutes, formatTime, fromTimeInput, buildSlots, formatDuration, formatSlotRange, slotPaletteFor, slotMinutesOf
} from './time';

describe('time helpers', () => {
  it('converts between labels and minutes, including noon and midnight', () => {
    expect(toMinutes('12:00 AM')).toBe(0);
    expect(toMinutes('9:45 AM')).toBe(585);
    expect(toMinutes('12:00 PM')).toBe(720);
    expect(toMinutes('1:30 PM')).toBe(810);
    expect(formatTime(585)).toBe('9:45 AM');
    expect(formatTime(720)).toBe('12:00 PM');
    expect(formatTime(0)).toBe('12:00 AM');
    expect(fromTimeInput('09:30')).toBe(570);
    expect(fromTimeInput('')).toBeNull();
  });

  it('builds only the slots that fit before the end of the day', () => {
    expect(buildSlots(540, 720, 45)).toEqual(['9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM']);
    expect(buildSlots(540, 560, 45)).toEqual([]);
    expect(buildSlots(600, 540, 60)).toEqual([]);
  });

  it('gives the old hourly slots by default, and treats old timetables as hourly', () => {
    const slots = slotPaletteFor({});
    expect(slots[0]).toBe('6:00 AM');
    expect(slots.at(-1)).toBe('9:00 PM');
    expect(slots).toHaveLength(16);
    expect(slotMinutesOf({})).toBe(60);
  });

  it('formats durations and slot ranges', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 hour');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(120)).toBe('2 hours');
    expect(formatSlotRange('9:00 AM', 45)).toBe('9:00 – 9:45 AM');
    expect(formatSlotRange('11:30 AM', 60)).toBe('11:30 AM – 12:30 PM');
  });
});
