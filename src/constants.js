import { Users, Calendar, User, Clock } from 'lucide-react';

export const TIMETABLE_TYPES = [
  {
    id: 'school',
    name: 'School Schedule',
    icon: Users,
    description: 'Class schedules, subjects, and periods',
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    id: 'college',
    name: 'College Schedule',
    icon: Calendar,
    description: 'Lectures, labs, and study sessions',
    gradient: 'from-purple-400 to-purple-600'
  },
  {
    id: 'personal',
    name: 'Personal Schedule',
    icon: User,
    description: 'Daily routines and personal activities',
    gradient: 'from-green-400 to-green-600'
  },
  {
    id: 'work',
    name: 'Work Schedule',
    icon: Clock,
    description: 'Shift schedules and work planning',
    gradient: 'from-orange-400 to-orange-600'
  }
];

export const TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Which days each timetable type schedules on.
export const WORKING_DAYS = {
  school: DAYS.slice(0, 5),
  college: DAYS.slice(0, 5),
  work: DAYS.slice(0, 6),
  personal: DAYS
};

export const PRIORITY_LEVELS = ['high', 'medium', 'low'];

export const COLORS = [
  { name: 'blue', light: 'bg-blue-200', dark: 'bg-blue-700', border: 'border-blue-400' },
  { name: 'green', light: 'bg-green-200', dark: 'bg-green-700', border: 'border-green-400' },
  { name: 'purple', light: 'bg-purple-200', dark: 'bg-purple-700', border: 'border-purple-400' },
  { name: 'yellow', light: 'bg-yellow-200', dark: 'bg-yellow-700', border: 'border-yellow-400' },
  { name: 'pink', light: 'bg-pink-200', dark: 'bg-pink-700', border: 'border-pink-400' },
  { name: 'indigo', light: 'bg-indigo-200', dark: 'bg-indigo-700', border: 'border-indigo-400' },
  { name: 'red', light: 'bg-red-200', dark: 'bg-red-700', border: 'border-red-400' },
  { name: 'orange', light: 'bg-orange-200', dark: 'bg-orange-700', border: 'border-orange-400' }
];

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
  constraints: []
};

export const DEFAULT_OPTIMIZATION_SETTINGS = {
  prioritizePreferences: true,
  minimizeGaps: true,
  balanceWorkload: true
};
