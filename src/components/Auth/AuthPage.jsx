import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowLeft, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import { inputClass, labelClass } from '../ui/styles';
import { Wordmark } from '../ui/Logo';

// A small, static week used as the picture beside the sign-in form:
// [name, colour, day column, first row, rows spanned]
const PREVIEW = [
    ['Maths', 'blue', 0, 0, 2], ['English', 'purple', 1, 0, 1], ['Physics', 'indigo', 2, 0, 2], ['Maths', 'blue', 3, 0, 2], ['History', 'orange', 4, 0, 1],
    ['Chemistry', 'green', 1, 1, 2], ['PE', 'red', 4, 1, 1], ['English', 'purple', 0, 2, 1], ['Art', 'yellow', 2, 2, 2], ['Computing', 'pink', 3, 2, 1],
    ['History', 'orange', 0, 3, 1], ['English', 'purple', 4, 2, 1], ['Maths', 'blue', 1, 3, 1], ['PE', 'red', 3, 3, 1], ['Computing', 'pink', 4, 3, 1]
];
const PREVIEW_COLORS = {
    blue: 'bg-blue-100 border-blue-500 dark:bg-blue-400/15 dark:border-blue-400',
    purple: 'bg-purple-100 border-purple-500 dark:bg-purple-400/15 dark:border-purple-400',
    indigo: 'bg-indigo-100 border-indigo-500 dark:bg-indigo-400/15 dark:border-indigo-400',
    orange: 'bg-orange-100 border-orange-500 dark:bg-orange-400/15 dark:border-orange-400',
    green: 'bg-green-100 border-green-600 dark:bg-green-400/15 dark:border-green-400',
    red: 'bg-red-100 border-red-500 dark:bg-red-400/15 dark:border-red-400',
    yellow: 'bg-yellow-100 border-yellow-500 dark:bg-yellow-400/15 dark:border-yellow-400',
    pink: 'bg-pink-100 border-pink-500 dark:bg-pink-400/15 dark:border-pink-400'
};

const WeekPreview = () => (
    <div aria-hidden="true" className="rounded-2xl border border-rule bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-[2.75rem_repeat(5,minmax(0,1fr))] gap-1.5 text-xs">
            <span />
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                <span key={d} className="pb-1 font-display font-semibold text-ink">{d}</span>
            ))}
            {['9:00', '10:00', '11:00', '1:00'].map((t, row) => (
                <span key={t} className="pt-1 tabular-nums text-muted" style={{ gridRow: row + 2, gridColumn: 1 }}>{t}</span>
            ))}
            {PREVIEW.map(([name, color, day, row, span], i) => (
                <span
                    key={i}
                    className={`flex h-full min-h-11 items-start rounded-md border-l-[3px] px-1.5 py-1 font-medium text-ink ${PREVIEW_COLORS[color]}`}
                    style={{ gridColumn: day + 2, gridRow: `${row + 2} / span ${span}` }}
                >
                    {name}
                </span>
            ))}
        </div>
    </div>
);

const AuthPage = ({
    isLogin,
    setIsLogin,
    formData,
    handleInputChange,
    handleAuthSubmit,
    handleGoogleLogin,
    authErrors,
    authLoading,
    showPassword,
    setShowPassword,
    handlePasswordReset
}) => {
    const { darkMode, toggleDarkMode } = useTheme();
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const onResetSubmit = async (e) => {
        e.preventDefault();
        const success = await handlePasswordReset(resetEmail);
        if (success) {
            setIsResettingPassword(false);
            setResetEmail('');
        }
    };

    return (
        <div className="min-h-screen bg-paper text-ink">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <Wordmark />
                <button
                    type="button"
                    onClick={() => toggleDarkMode()}
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink"
                >
                    {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </button>
            </div>

            <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:pt-12">
            <div className="hidden lg:block">
                <h1 className="max-w-lg text-[2.75rem] font-bold leading-[1.1] text-ink">
                    Plan a week of classes in a few minutes.
                </h1>
                <p className="mt-4 max-w-md text-lg text-muted">
                    Add your subjects, pick your hours, and get a timetable with no clashes. It is saved to your account and ready to print.
                </p>
                <div className="mt-10 max-w-xl">
                    <WeekPreview />
                </div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-2xl border border-rule bg-surface p-6 shadow-sm sm:p-8">

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-ink">
                        {isResettingPassword
                            ? 'Reset your password'
                            : (isLogin ? 'Log in' : 'Create your account')}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        {isResettingPassword
                            ? 'We will email you a link to choose a new password.'
                            : (isLogin ? 'Welcome back. Your saved timetables are waiting.' : 'Free. Your timetables are kept in your account.')}
                    </p>
                </div>

                {!isResettingPassword ? (
                    <>
                        {/* Toggle Buttons */}
                        <div className="mb-6 flex rounded-lg bg-sunken p-1">
                            <button
                                type="button"
                                aria-pressed={isLogin}
                                onClick={() => {
                                    setIsLogin(true);
                                }}
                                className={`h-9 flex-1 rounded-md text-sm font-semibold transition-colors duration-150 ${isLogin
                                    ? 'bg-surface text-ink shadow-sm'
                                    : 'text-muted hover:text-ink'
                                    }`}
                            >
                                Log in
                            </button>
                            <button
                                type="button"
                                aria-pressed={!isLogin}
                                onClick={() => {
                                    setIsLogin(false);
                                }}
                                className={`h-9 flex-1 rounded-md text-sm font-semibold transition-colors duration-150 ${!isLogin
                                    ? 'bg-surface text-ink shadow-sm'
                                    : 'text-muted hover:text-ink'
                                    }`}
                            >
                                Sign up
                            </button>
                        </div>

                        {/* Form Fields */}
                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="auth-name" className={labelClass}>
                                        Full name
                                    </label>
                                    <div className="relative">
                                        <User aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                                        <input
                                            type="text"
                                            id="auth-name"
                                        name="name"
                                        autoComplete="name"
                                        aria-invalid={Boolean(authErrors.name)}
                                        aria-describedby={authErrors.name ? 'auth-name-error' : undefined}
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`${inputClass} h-11 pl-10 pr-3`}
                                        />
                                    </div>
                                    {authErrors.name && <p id="auth-name-error" className="mt-1 text-sm text-red-700 dark:text-red-300">{authErrors.name}</p>}
                                </div>
                            )}

                            <div>
                                <label htmlFor="auth-email" className={labelClass}>
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                                    <input
                                        type="email"
                                        id="auth-email"
                                        name="email"
                                        autoComplete="email"
                                        aria-invalid={Boolean(authErrors.email)}
                                        aria-describedby={authErrors.email ? 'auth-email-error' : undefined}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`${inputClass} h-11 pl-10 pr-3`}
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {authErrors.email && <p id="auth-email-error" className="mt-1 text-sm text-red-700 dark:text-red-300">{authErrors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="auth-password" className={labelClass}>
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="auth-password"
                                        name="password"
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        aria-invalid={Boolean(authErrors.password)}
                                        aria-describedby={authErrors.password ? 'auth-password-error' : undefined}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`${inputClass} h-11 pl-10 pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
                                    >
                                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                                    </button>
                                </div>
                                {authErrors.password && <p id="auth-password-error" className="mt-1 text-sm text-red-700 dark:text-red-300">{authErrors.password}</p>}
                            </div>

                            {!isLogin && (
                                <div>
                                    <label htmlFor="auth-confirmPassword" className={labelClass}>
                                        Confirm password
                                    </label>
                                    <div className="relative">
                                        <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="auth-confirmPassword"
                                        name="confirmPassword"
                                        autoComplete="new-password"
                                        aria-invalid={Boolean(authErrors.confirmPassword)}
                                        aria-describedby={authErrors.confirmPassword ? 'auth-confirmPassword-error' : undefined}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`${inputClass} h-11 pl-10 pr-3`}
                                        />
                                    </div>
                                    {authErrors.confirmPassword && <p id="auth-confirmPassword-error" className="mt-1 text-sm text-red-700 dark:text-red-300">{authErrors.confirmPassword}</p>}
                                </div>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                className="mt-2"
                                disabled={authLoading}
                            >
                                {authLoading ? 'Please wait…' : (isLogin ? 'Log in' : 'Create account')}
                            </Button>

                            <div className="flex items-center gap-3 py-1 text-sm text-muted">
                                <span className="h-px flex-1 bg-rule" aria-hidden="true" />
                                or
                                <span className="h-px flex-1 bg-rule" aria-hidden="true" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={authLoading}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rule-strong bg-surface font-semibold text-ink transition-colors duration-150 hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </button>
                            {authErrors.google && <p role="alert" className="text-center text-sm text-red-700 dark:text-red-300">{authErrors.google}</p>}
                        </form>

                        {isLogin && (
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsResettingPassword(true)}
                                    className="text-sm font-medium text-accent-ink hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <form onSubmit={onResetSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="reset-email" className={labelClass}>
                                Email
                            </label>
                            <div className="relative">
                                <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                                <input
                                    id="reset-email"
                                    type="email"
                                    autoComplete="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className={`${inputClass} h-11 pl-10 pr-3`}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            disabled={authLoading}
                        >
                            {authLoading ? 'Sending…' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send reset link
                                </>
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setIsResettingPassword(false)}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg font-semibold text-muted transition-colors hover:bg-sunken hover:text-ink"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to log in
                        </button>
                    </form>
                )}
            </div>
            </div>
        </div>
    );
};

export default AuthPage;
