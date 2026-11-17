import React, { useState } from 'react';
import { Sparkles, LogIn, UserPlus, User, Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowLeft, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import { inputClass } from '../ui/styles';

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
        <div className="min-h-screen flex items-center justify-center px-4 py-20 transition-all duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Dark Mode Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    type="button"
                    onClick={() => toggleDarkMode()}
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="p-3 rounded-full transition-all duration-300 bg-white text-gray-800 hover:bg-gray-100 shadow-lg shadow-gray-400/20 dark:bg-gray-800 dark:text-yellow-400 dark:hover:bg-gray-700 dark:shadow-yellow-400/20"
                >
                    {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </button>
            </div>

            <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-lg dark:bg-gray-800/90 dark:border dark:border-gray-700">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        <h1 className="text-3xl font-bold ml-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            Smart Timetable
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        {isResettingPassword
                            ? 'Reset your password'
                            : (isLogin ? 'Welcome back!' : 'Create your account')}
                    </p>
                </div>

                {!isResettingPassword ? (
                    <>
                        {/* Toggle Buttons */}
                        <div className="flex rounded-lg p-1 mb-6 bg-gray-100 dark:bg-gray-700">
                            <button
                                type="button"
                                aria-pressed={isLogin}
                                onClick={() => {
                                    setIsLogin(true);
                                }}
                                className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-200 ${isLogin
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                <LogIn className="w-4 h-4 inline mr-2" />
                                Login
                            </button>
                            <button
                                type="button"
                                aria-pressed={!isLogin}
                                onClick={() => {
                                    setIsLogin(false);
                                }}
                                className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-200 ${!isLogin
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                <UserPlus className="w-4 h-4 inline mr-2" />
                                Register
                            </button>
                        </div>

                        {/* Form Fields */}
                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="auth-name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <input
                                            type="text"
                                            id="auth-name"
                                        name="name"
                                        autoComplete="name"
                                        aria-invalid={Boolean(authErrors.name)}
                                        aria-describedby={authErrors.name ? 'auth-name-error' : undefined}
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`${inputClass} pl-10 pr-4 py-3 ${authErrors.name ? 'border-red-500' : ''
                                                }`}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    {authErrors.name && <p id="auth-name-error" className="text-red-500 text-sm mt-1">{authErrors.name}</p>}
                                </div>
                            )}

                            <div>
                                <label htmlFor="auth-email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <input
                                        type="email"
                                        id="auth-email"
                                        name="email"
                                        autoComplete="email"
                                        aria-invalid={Boolean(authErrors.email)}
                                        aria-describedby={authErrors.email ? 'auth-email-error' : undefined}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`${inputClass} pl-10 pr-4 py-3 ${authErrors.email ? 'border-red-500' : ''
                                            }`}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                {authErrors.email && <p id="auth-email-error" className="text-red-500 text-sm mt-1">{authErrors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="auth-password" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="auth-password"
                                        name="password"
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        aria-invalid={Boolean(authErrors.password)}
                                        aria-describedby={authErrors.password ? 'auth-password-error' : undefined}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`${inputClass} pl-10 pr-12 py-3 ${authErrors.password ? 'border-red-500' : ''
                                            }`}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {authErrors.password && <p id="auth-password-error" className="text-red-500 text-sm mt-1">{authErrors.password}</p>}
                            </div>

                            {!isLogin && (
                                <div>
                                    <label htmlFor="auth-confirmPassword" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="auth-confirmPassword"
                                        name="confirmPassword"
                                        autoComplete="new-password"
                                        aria-invalid={Boolean(authErrors.confirmPassword)}
                                        aria-describedby={authErrors.confirmPassword ? 'auth-confirmPassword-error' : undefined}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`${inputClass} pl-10 pr-4 py-3 ${authErrors.confirmPassword ? 'border-red-500' : ''
                                                }`}
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                    {authErrors.confirmPassword && <p id="auth-confirmPassword-error" className="text-red-500 text-sm mt-1">{authErrors.confirmPassword}</p>}
                                </div>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                className="mt-6"
                                disabled={authLoading}
                            >
                                {authLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={authLoading}
                                className="w-full py-3 flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 border-2 bg-white text-gray-800 border-gray-200 hover:bg-gray-50 dark:border-white dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                Google
                            </button>
                            {authErrors.google && <p role="alert" className="text-red-500 text-sm text-center">{authErrors.google}</p>}
                        </form>

                        {isLogin && (
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsResettingPassword(true)}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-purple-400 dark:hover:text-purple-300"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <form onSubmit={onResetSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail aria-hidden="true" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                                <input
                                    id="reset-email"
                                    type="email"
                                    autoComplete="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className={`${inputClass} pl-10 pr-4 py-3`}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                                We'll send you a link to reset your password.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            className="mt-6"
                            disabled={authLoading}
                        >
                            {authLoading ? 'Sending...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Reset Link
                                </>
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setIsResettingPassword(false)}
                            className="w-full py-3 flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
