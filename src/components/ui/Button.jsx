import React from 'react';

// Shared button styles. Use `variant` for the look and `size` for padding;
// pass `className` only for layout (margins, width) specific to one place.

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl disabled:shadow-none',
  success: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl disabled:shadow-none',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
  danger: 'bg-red-600 text-white hover:bg-red-700'
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3'
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
