import React from 'react';

// Shared button styles. Use `variant` for the look and `size` for height;
// pass `className` only for layout (margins, width) specific to one place.
//   primary   - the one main action on a screen (solid teal)
//   secondary - other actions (outlined)
//   ghost     - low-emphasis actions such as Back or Cancel
//   danger    - destructive confirmation

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap ' +
  'transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed';

const VARIANTS = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent',
  secondary: 'bg-surface text-ink border border-rule-strong hover:bg-sunken disabled:hover:bg-surface',
  ghost: 'text-muted hover:bg-sunken hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700'
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[0.95rem]'
};

const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
  ...props
}) => (
  <button
    type={type}
    className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
