// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import TimetableGrid from './TimetableGrid';

afterEach(cleanup);

const maths = { id: 1, name: 'Maths', duration: 2, colorLight: 'bg-blue-200', colorDark: 'bg-blue-700', borderColor: 'border-blue-400' };
const art = { id: 2, name: 'Art', duration: 1, colorLight: 'bg-pink-200', colorDark: 'bg-pink-700', borderColor: 'border-pink-400' };
const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM'];

const renderGrid = (schedule) =>
  render(
    <TimetableGrid
      generatedTimetable={schedule}
      timetableData={{ timeSlots }}
      darkMode={false}
      getConflictIcon={() => null}
    />
  );

describe('TimetableGrid', () => {
  it('draws a multi-hour activity once, spanning its hours', () => {
    renderGrid({ Monday: { '9:00 AM': maths, '10:00 AM': maths, '11:00 AM': art } });

    const cells = screen.getAllByText('Maths');
    expect(cells).toHaveLength(1);
    expect(cells[0].closest('td').getAttribute('rowspan')).toBe('2');
    expect(screen.getByText(/2 hours/)).toBeTruthy();
    expect(screen.getAllByText('Art')).toHaveLength(1);
  });

  it('shows days in week order even when stored alphabetically', () => {
    // Firestore returns map keys sorted alphabetically.
    renderGrid({ Friday: {}, Monday: {}, Wednesday: {} });
    const headers = within(screen.getAllByRole('row')[0]).getAllByRole('columnheader').map(th => th.textContent);
    expect(headers).toEqual(['Time', 'Monday', 'Wednesday', 'Friday']);
  });

  it('keeps every row the same width when an activity spans rows', () => {
    renderGrid({ Monday: { '9:00 AM': maths, '10:00 AM': maths }, Tuesday: {} });
    const rows = screen.getAllByRole('row').slice(1);
    // Row 1: time + Maths(rowspan 2) + Tuesday; row 2: time + Tuesday (Maths covers Monday).
    const cellCounts = rows.map(r => r.querySelectorAll('td, th').length);
    expect(cellCounts).toEqual([3, 2, 3]);
  });
});
