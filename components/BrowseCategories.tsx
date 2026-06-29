
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UnitType } from '../types';

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  to: string;
}

const categories: Category[] = [
  {
    id: 'new',
    label: 'New Listings',
    icon: 'fa-sparkles',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/40',
    to: '/rent?filter=new',
  },
  {
    id: 'residential',
    label: 'Residential',
    icon: 'fa-house',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40',
    to: '/rent/residential',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: 'fa-shop',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/40',
    to: '/rent/commercial',
  },
  {
    id: 'bnb',
    label: 'B&B / Airbnb',
    icon: 'fa-bed',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-900/40',
    to: '/rent/bnb',
  },
  {
    id: 'farmland',
    label: 'Farmland',
    icon: 'fa-tractor',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50 dark:bg-lime-900/20 border-lime-100 dark:border-lime-900/40',
    to: '/rent/farmland',
  },
  {
    id: 'land',
    label: 'Land for Sale',
    icon: 'fa-land-mine-on',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40',
    to: '/buy/land',
  },
];

const BrowseCategories: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Browse Categories</h2>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-0.5">Find exactly what you need</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            id={`category-${cat.id}`}
            onClick={() => navigate(cat.to)}
            className={`group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border ${cat.bgColor} hover:shadow-md active:scale-95 transition-all duration-200 text-center`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
              <i className={`fas ${cat.icon} text-xl ${cat.color}`} />
            </div>
            <span className={`text-xs font-black uppercase tracking-tight ${cat.color}`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default BrowseCategories;
