import React from 'react';

const AlgorithmInfo = () => {
    return (
        <div className="mt-6 p-6 rounded-xl bg-blue-50 dark:bg-gray-700/50">
            <h3 className="font-bold mb-3 text-gray-800 dark:text-white">
                🧠 AI-Powered Features
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div>✅ Greedy optimization algorithm</div>
                <div>✅ Priority-based scheduling</div>
                <div>✅ Time preference consideration</div>
                <div>✅ Conflict detection & prevention</div>
                <div>✅ Gap minimization</div>
                <div>✅ Workload balancing</div>
            </div>
        </div>
    );
};

export default AlgorithmInfo;
