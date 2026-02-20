
import React from 'react';

export type VacancyFilter = 'All' | 'Vacant' | 'Occupied';

interface VacancyToggleProps {
    activeFilter: VacancyFilter;
    onSelect: (filter: VacancyFilter) => void;
}

const VacancyToggle: React.FC<VacancyToggleProps> = ({ activeFilter, onSelect }) => {
    return (
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-fit">
            <button
                onClick={() => onSelect('All')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'All'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
            >
                All
            </button>
            <button
                onClick={() => onSelect('Vacant')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'Vacant'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
            >
                Vacant
            </button>
            <button
                onClick={() => onSelect('Occupied')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'Occupied'
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 dark:shadow-none'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
            >
                Occupied
            </button>
        </div>
    );
};

export default VacancyToggle;
