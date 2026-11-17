// Shared class strings for form fields. Padding is left to the caller where
// it differs (e.g. room for a leading icon).

export const labelClass = 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300';

// Large fields: sign-in forms and the timetable name.
export const inputClass =
  'w-full rounded-lg transition-all duration-200 bg-white text-gray-800 border-2 border-gray-200 ' +
  'focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border dark:border-gray-600 ' +
  'dark:focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20';

// Compact fields inside the activity form.
export const compactInputClass =
  'w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 dark:bg-gray-600 ' +
  'dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-purple-500';
