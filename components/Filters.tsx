
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
          className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all shadow-sm ${
            activeType === type 
              ? 'bg-blue-600 text-white shadow-blue-200' 
              : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default Filters;
