// Shared class strings for form fields and panels.

export const labelClass = 'block text-sm font-medium mb-1.5 text-ink';

// Text inputs and selects. Padding is left to the caller where it differs
// (e.g. room for a leading icon); `fieldClass` is the usual size.
export const inputClass =
  'w-full rounded-lg bg-surface text-ink border border-rule-strong placeholder:text-faint ' +
  'transition-colors duration-150 focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/20 ' +
  'aria-invalid:border-red-500';

export const fieldClass = `${inputClass} h-11 px-3`;

// Kept for the activity form; same look as fieldClass.
export const compactInputClass = fieldClass;

// A titled group inside a step, e.g. "School day" or "Time slots".
export const sectionTitleClass = 'text-base font-semibold text-ink';
export const hintClass = 'text-sm text-muted';
