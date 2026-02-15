
import React from 'react';
import { UnitType } from '../types';

interface FiltersProps {
  activeType: UnitType | 'All';
  onSelect: (type: UnitType | 'All') => void;
}

const Filters: React.FC<FiltersProps> = ({ activeType, onSelect }) => {
  const types = ['All', ...Object.values(UnitType)];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type as any)}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all shadow-sm ${activeType === type
              ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default Filters;
