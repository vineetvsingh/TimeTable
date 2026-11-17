// @vitest-environment jsdom
// End-to-end style tests of the whole app with Firebase mocked out. They
// drive the UI the way a user would, so they keep passing across refactors.
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';

// Newer Node versions ship their own (disabled) localStorage global, which can
// shadow jsdom's; use a simple in-memory one so tests behave the same everywhere.
const memoryStorage = () => {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => { items.set(key, String(value)); },
    removeItem: (key) => { items.delete(key); },
    clear: () => { items.clear(); },
    key: (i) => [...items.keys()][i] ?? null,
    get length() { return items.size; }
  };
};
vi.stubGlobal('localStorage', memoryStorage());

const fb = vi.hoisted(() => ({
  savedDocs: [],
  failLoad: false,
  addDoc: null,
  updateDoc: null,
  deleteDoc: null
}));

vi.mock('./firebase', () => ({ auth: {}, db: {} }));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback({ uid: 'user-1', email: 'test@example.com', displayName: 'Test User' });
    return () => {};
  },
  signOut: vi.fn(async () => {}),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn()
}));

vi.mock('firebase/firestore', () => {
  fb.addDoc = vi.fn(async () => ({ id: 'new-doc' }));
  fb.updateDoc = vi.fn(async () => {});
  fb.deleteDoc = vi.fn(async () => {});
  return {
    doc: (_db, ...path) => ({ path: path.join('/') }),
    collection: () => ({}),
    query: () => ({}),
    where: () => ({}),
    serverTimestamp: () => 'server-time',
    getDoc: async () => ({ exists: () => true, data: () => ({ name: 'Test User' }) }),
    getDocs: async () => {
      if (fb.failLoad) throw new Error('offline');
      return { docs: fb.savedDocs.map(d => ({ id: d.id, data: () => d })) };
    },
    setDoc: vi.fn(async () => {}),
    addDoc: (...args) => fb.addDoc(...args),
    updateDoc: (...args) => fb.updateDoc(...args),
    deleteDoc: (...args) => fb.deleteDoc(...args)
  };
});

import App from './App';

const renderApp = () => render(<App />);
const button = (name) => screen.getByRole('button', { name });

// Builds a school timetable with one 2-hour activity and generates it.
const buildTimetable = async () => {
  fireEvent.click(await screen.findByRole('button', { name: /School/ }));
  fireEvent.change(screen.getByLabelText('Timetable name'), { target: { value: 'My Week' } });
  fireEvent.click(button('9:00 AM'));
  fireEvent.click(button('10:00 AM'));
  fireEvent.click(button('Continue'));

  fireEvent.change(screen.getByLabelText('Activity name'), { target: { value: 'Maths' } });
  fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '2' } });
  fireEvent.click(button(/Add activity/));
  fireEvent.click(button(/Generate timetable/));
  await screen.findByRole('table');
};

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  fb.savedDocs = [];
  fb.failLoad = false;
  fb.addDoc.mockClear();
  fb.updateDoc.mockClear();
  fb.deleteDoc.mockClear();
});

afterEach(cleanup);

describe('App', () => {
  it('builds and generates a timetable', async () => {
    renderApp();
    expect(await screen.findByText('Test User')).toBeTruthy();
    await buildTimetable();

    const cell = within(screen.getByRole('table')).getByText('Maths');
    expect(cell.closest('td').getAttribute('rowspan')).toBe('2');
    expect(screen.getByText(/No conflicts detected/)).toBeTruthy();
  });

  it('places an activity the chosen number of times a week, on different days', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: /School/ }));
    fireEvent.change(screen.getByLabelText('Timetable name'), { target: { value: 'My Week' } });
    fireEvent.click(button('9:00 AM'));
    fireEvent.click(button('Continue'));

    fireEvent.change(screen.getByLabelText('Activity name'), { target: { value: 'Physics' } });
    fireEvent.change(screen.getByLabelText('How often'), { target: { value: '3' } });
    fireEvent.click(button(/Add activity/));
    expect(screen.getByText(/1 hour, 3 times a week/)).toBeTruthy();
    fireEvent.click(button(/Generate timetable/));

    const table = await screen.findByRole('table');
    const cells = within(table).getAllByText('Physics').map(el => el.closest('td'));
    expect(cells).toHaveLength(3);
    expect(screen.getByText(/No conflicts detected/)).toBeTruthy();
  });

  it('exports the timetable as a spreadsheet and a calendar file', async () => {
    const files = [];
    const createObjectURL = vi.fn((blob) => { files.push(blob); return 'blob:test'; });
    const clicked = [];
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked.push(this.download);
    });
    try {
      renderApp();
      await buildTimetable();

      const exportButton = button(/Export/);
      fireEvent.click(exportButton);
      expect(exportButton.getAttribute('aria-expanded')).toBe('true');
      fireEvent.click(button(/Spreadsheet/));
      expect(exportButton.getAttribute('aria-expanded')).toBe('false');
      await screen.findByText(/Downloaded My Week\.csv/);

      fireEvent.click(exportButton);
      fireEvent.click(button(/Calendar/));
      await screen.findByText(/Downloaded My Week\.ics/);

      expect(clicked).toEqual(['My Week.csv', 'My Week.ics']);
      const [csv, ics] = await Promise.all(files.map((file) => file.text()));
      expect(csv).toContain('Time,Monday,Tuesday,Wednesday,Thursday,Friday');
      expect(csv).toContain('Maths');
      expect(ics.match(/BEGIN:VEVENT/g).length).toBeGreaterThan(0);
      expect(ics).toContain('SUMMARY:Maths');
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('saves once, then updates the same saved timetable', async () => {
    renderApp();
    await buildTimetable();

    fireEvent.click(button(/Save to my timetables/));
    await screen.findByText('Timetable saved to the cloud.');
    expect(fb.addDoc).toHaveBeenCalledTimes(1);
    expect(fb.addDoc.mock.calls[0][1]).toMatchObject({ name: 'My Week', userId: 'user-1' });

    fireEvent.click(await screen.findByRole('button', { name: /Update saved copy/ }));
    await screen.findByText('Saved timetable updated.');
    expect(fb.addDoc).toHaveBeenCalledTimes(1);
    expect(fb.updateDoc).toHaveBeenCalledTimes(1);
    expect(fb.updateDoc.mock.calls[0][0]).toEqual({ path: 'timetables/new-doc' });
  });

  it('edits an existing activity', async () => {
    renderApp();
    await buildTimetable();

    fireEvent.click(button(/Edit$/));
    fireEvent.click(button('Edit Maths'));
    expect(screen.getByLabelText('Activity name').value).toBe('Maths');
    fireEvent.change(screen.getByLabelText('Activity name'), { target: { value: 'Algebra' } });
    fireEvent.click(button(/Save changes/));

    expect(screen.getByText('Algebra')).toBeTruthy();
    expect(screen.queryByText('Maths')).toBeNull();
    expect(button(/Add activity/)).toBeTruthy();
  });

  it('builds a timetable with 45-minute slots', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: /School/ }));
    fireEvent.change(screen.getByLabelText('Timetable name'), { target: { value: 'Short periods' } });
    fireEvent.change(screen.getByLabelText('Day starts'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Day ends'), { target: { value: '11:00' } });
    fireEvent.change(screen.getByLabelText('Slot length'), { target: { value: '45' } });
    expect(button('9:45 AM')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '10:30 AM' })).toBeNull(); // would end at 11:15

    fireEvent.click(button('Select all'));
    fireEvent.click(button('Continue'));
    fireEvent.change(screen.getByLabelText('Activity name'), { target: { value: 'Maths' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '2' } });
    expect(screen.getByRole('option', { name: '2 slots (1 h 30 min)' })).toBeTruthy();
    fireEvent.click(button(/Add activity/));
    fireEvent.click(button(/Generate timetable/));

    await screen.findByRole('table');
    expect(screen.getByRole('rowheader', { name: '9:00 AM to 9:45 AM' })).toBeTruthy();
    expect(screen.getByText(/1 h 30 min/, { selector: 'table *' })).toBeTruthy();
  });

  it('lists, opens and deletes saved timetables with a confirmation dialog', async () => {
    fb.savedDocs = [{
      id: 'saved-1',
      name: 'Saved Week',
      type: 'school',
      userId: 'user-1',
      timeSlots: ['9:00 AM'],
      activities: [{ id: 7, name: 'Physics', duration: 1, priority: 'high', preferredDays: [], preferredTimes: [], avoidTimes: [] }],
      schedule: { Monday: { '9:00 AM': { id: 7, name: 'Physics', duration: 1 } } }
    }];
    renderApp();
    await screen.findByText('Test User');

    fireEvent.click(button(/My timetables/));
    expect(await screen.findByText('Saved Week')).toBeTruthy();

    fireEvent.click(button('Delete timetable'));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/"Saved Week" will be permanently deleted/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(fb.deleteDoc).not.toHaveBeenCalled();

    fireEvent.click(button('Open timetable'));
    expect(await screen.findByText('Physics', { selector: 'table *' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Update saved copy/ })).toBeTruthy();

    fireEvent.click(button(/My timetables/));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete timetable' }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    await screen.findByText('Timetable deleted.');
    expect(fb.deleteDoc).toHaveBeenCalledWith({ path: 'timetables/saved-1' });
  });

  it('shows an error with a retry button when saved timetables fail to load', async () => {
    fb.failLoad = true;
    renderApp();
    await screen.findByText('Test User');

    fireEvent.click(button(/My timetables/));
    expect(await screen.findByText("Couldn't load your timetables")).toBeTruthy();

    fb.failLoad = false;
    fireEvent.click(button(/Try again/));
    expect(await screen.findByText('No saved timetables yet')).toBeTruthy();
  });

  it('toggles and remembers dark mode', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('tt-dark-mode')).toBe('true');

    cleanup();
    document.documentElement.classList.remove('dark');
    renderApp();
    expect(await screen.findByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('restores the in-progress timetable after a reload', async () => {
    renderApp();
    await buildTimetable();
    cleanup();

    renderApp();
    expect(await screen.findByRole('table')).toBeTruthy();
    expect(within(screen.getByRole('table')).getByText('Maths')).toBeTruthy();
  });

  it('moves between steps with the browser Back and Forward buttons', async () => {
    renderApp();
    await buildTimetable();
    expect(window.location.hash).toBe('#step-4');

    window.history.back();
    expect(await screen.findByText('Add activities', { selector: 'h2' })).toBeTruthy();
    expect(window.location.hash).toBe('#step-3');

    window.history.back();
    expect(await screen.findByText('Set up your day')).toBeTruthy();

    window.history.forward();
    expect(await screen.findByText('Add activities', { selector: 'h2' })).toBeTruthy();

    fireEvent.click(button(/My timetables/));
    await waitFor(() => expect(window.location.hash).toBe('#saved'));
    window.history.back();
    expect(await screen.findByText('Add activities', { selector: 'h2' })).toBeTruthy();
  });

  it('does not go forward to a result that was cleared by Start Over', async () => {
    renderApp();
    await buildTimetable();
    fireEvent.click(button(/Start over/));
    expect(await screen.findByText('What are you planning?')).toBeTruthy();

    window.history.back(); // the old #step-4 entry
    await waitFor(() => expect(window.location.hash).not.toBe('#step-4'));
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('logs out and clears the draft', async () => {
    renderApp();
    await buildTimetable();
    expect(localStorage.getItem('tt-draft-user-1')).not.toBeNull();

    fireEvent.click(button('Log out'));
    await waitFor(() => expect(localStorage.getItem('tt-draft-user-1')).toBeNull());
  });
});
