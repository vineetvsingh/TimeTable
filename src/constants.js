import { Users, Calendar, User, Clock } from 'lucide-react';

export const TIMETABLE_TYPES = [
  {
    id: 'school',
    name: 'School',
    icon: Users,
    description: 'Classes and periods across the school week',
    tone: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300'
  },
  {
    id: 'college',
    name: 'College',
    icon: Calendar,
    description: 'Lectures, labs and study sessions',
    tone: 'bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300'
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: User,
    description: 'Routines, workouts and personal time, every day',
    tone: 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300'
  },
  {
    id: 'work',
    name: 'Work',
    icon: Clock,
    description: 'Shifts and meetings, Monday to Saturday',
    tone: 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300'
  }
];

// Choices for the length of one slot (minutes). The default day (6 AM to
// 10 PM in 60-minute slots) gives hourly slots starting 6:00 AM ... 9:00 PM.
export const SLOT_LENGTHS = [30, 45, 50, 60, 90];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Which days each timetable type schedules on.
export const WORKING_DAYS = {
  school: DAYS.slice(0, 5),
  college: DAYS.slice(0, 5),
  work: DAYS.slice(0, 6),
  personal: DAYS
};

export const PRIORITY_LEVELS = ['high', 'medium', 'low'];

// Activity colours. `light`/`dark`/`border` are stored with saved activities
// (older timetables rely on them); the UI uses `block` and `swatch`.
export const COLORS = [
  { name: 'blue', light: 'bg-blue-200', dark: 'bg-blue-700', border: 'border-blue-400', swatch: 'bg-blue-500', block: 'bg-blue-100/80 border-blue-500 dark:bg-blue-400/15 dark:border-blue-400' },
  { name: 'green', light: 'bg-green-200', dark: 'bg-green-700', border: 'border-green-400', swatch: 'bg-green-600', block: 'bg-green-100/80 border-green-600 dark:bg-green-400/15 dark:border-green-400' },
  { name: 'purple', light: 'bg-purple-200', dark: 'bg-purple-700', border: 'border-purple-400', swatch: 'bg-purple-500', block: 'bg-purple-100/80 border-purple-500 dark:bg-purple-400/15 dark:border-purple-400' },
  { name: 'yellow', light: 'bg-yellow-200', dark: 'bg-yellow-700', border: 'border-yellow-400', swatch: 'bg-yellow-400', block: 'bg-yellow-100/90 border-yellow-500 dark:bg-yellow-400/15 dark:border-yellow-400' },
  { name: 'pink', light: 'bg-pink-200', dark: 'bg-pink-700', border: 'border-pink-400', swatch: 'bg-pink-500', block: 'bg-pink-100/80 border-pink-500 dark:bg-pink-400/15 dark:border-pink-400' },
  { name: 'indigo', light: 'bg-indigo-200', dark: 'bg-indigo-700', border: 'border-indigo-400', swatch: 'bg-indigo-500', block: 'bg-indigo-100/80 border-indigo-500 dark:bg-indigo-400/15 dark:border-indigo-400' },
  { name: 'red', light: 'bg-red-200', dark: 'bg-red-700', border: 'border-red-400', swatch: 'bg-red-500', block: 'bg-red-100/80 border-red-500 dark:bg-red-400/15 dark:border-red-400' },
  { name: 'orange', light: 'bg-orange-200', dark: 'bg-orange-700', border: 'border-orange-400', swatch: 'bg-orange-500', block: 'bg-orange-100/80 border-orange-500 dark:bg-orange-400/15 dark:border-orange-400' }
];

/** Display styles for an activity's colour (falls back to blue). */
export const colorStyle = (name) => COLORS.find(c => c.name === name) || COLORS[0];

// Small coloured priority labels (text meets 4.5:1 in both themes).
export const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-200'
};

export const EMPTY_ACTIVITY = {
  name: '',
  duration: 1,
  priority: 'medium',
  preferredDays: [],
  preferredTimes: [],
  avoidTimes: [],
  instructor: '',
  room: '',
  color: 'blue',
  description: '',
  recurring: false
};

export const EMPTY_TIMETABLE = {
  name: '',
  timeSlots: [],
  activities: [],
  constraints: [],
  dayStart: '06:00',
  dayEnd: '22:00',
  slotMinutes: 60
};

export const DEFAULT_OPTIMIZATION_SETTINGS = {
  prioritizePreferences: true,
  minimizeGaps: true,
  balanceWorkload: true
};
