import React from 'react';
import Logo from '../ui/Logo';

const LoadingScreen = () => (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status">
        <div className="flex flex-col items-center gap-4">
            <Logo className="h-10 w-10 animate-pulse" />
            <p className="text-sm text-muted">Loading…</p>
        </div>
    </div>
);

export default LoadingScreen;
