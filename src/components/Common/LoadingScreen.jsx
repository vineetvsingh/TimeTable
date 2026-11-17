import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="text-center">
                <RefreshCw className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
