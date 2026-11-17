import React from 'react';
import { TIMETABLE_TYPES } from '../../constants';
import { useTimetable } from '../../context/TimetableContext';

const TypeSelection = () => {
    const { selectType } = useTimetable();
    return (
        <div className="animate-fadeIn">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-800 dark:text-white">
                Choose Your Timetable Type
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
                {TIMETABLE_TYPES.map((type) => (
                    <button
                        type="button"
                        key={type.id}
                        onClick={() => selectType(type.id)}
                        className="relative overflow-hidden rounded-xl p-6 text-left w-full cursor-pointer transition-all duration-300 hover:shadow-2xl bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border dark:border-gray-600"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${type.gradient} opacity-10 rounded-full -mr-16 -mt-16`}></div>
                        <div className="relative z-10">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br ${type.gradient} text-white mb-4`}>
                                <type.icon className="w-6 h-6" aria-hidden="true" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
                                {type.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {type.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TypeSelection;
