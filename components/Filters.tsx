
import React, { useRef } from 'react';
import { UnitType } from '../types';

interface FiltersProps {
  activeType: UnitType | 'All';
  onSelect: (type: UnitType | 'All') => void;
  vacantOnly: boolean;
  onToggleVacant: () => void;
}

const Filters: React.FC<filtersprops> = ({ activeType, onSelect, vacantOnly, onToggleVacant }) => {
  const types = ['All', ...Object.values(UnitType)];
  const scrollRef = useRef<htmldivelement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div classname="space-y-3">
      <div classname="relative flex items-center group">
        {/* Scroll Left Button - Only visible on desktops/larger screens */}
        <button onclick="{()" ==""> scroll('left')}
          className="hidden md:flex absolute -left-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-90"
        >
          <i classname="fas fa-chevron-left text-[10px]"></i>
        </button>

        <div ref="{scrollRef}" classname="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 scroll-smooth w-full">
          {types.map((type) => (
            <button key="{type}" onclick="{()" ==""> onSelect(type as any)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all shadow-sm shrink-0 ${
                activeType === type 
                  ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Scroll Right Button - Only visible on desktops/larger screens */}
        <button onclick="{()" ==""> scroll('right')}
          className="hidden md:flex absolute -right-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-90"
        >
          <i classname="fas fa-chevron-right text-[10px]"></i>
        </button>
      </div>

      <div classname="flex items-center gap-2 px-1">
        <button onclick="{onToggleVacant}" classname="{`flex" items-center="" gap-2="" px-3="" py-1.5="" rounded-xl="" text-[10px]="" font-black="" uppercase="" tracking-widest="" transition-all="" border="" ${="" vacantonly="" ?="" 'bg-green-600="" border-green-600="" text-white="" shadow-lg="" shadow-green-100="" dark:shadow-none'="" :="" 'bg-white="" dark:bg-slate-900="" border-slate-200="" dark:border-slate-800="" text-slate-400'="" }`}="">
          <i classname="{`fas" ${vacantonly="" ?="" 'fa-check-circle'="" :="" 'fa-circle'}`}=""></i>
          Vacant Only
        </button>
      </div>
    </div>
  );
};

export default Filters;
