
import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Listing, UnitType, ListingCategory, RENT_UNIT_TYPES, SHORT_STAY_UNIT_TYPES, User } from '../types';
import ListingCard from './ListingCard';

interface RentPageProps {
  listings: Listing[];
  isLoading: boolean;
  currentUser: User | null;
  onSelectListing: (listing: Listing) => void;
  onToggleFavorite: (id: string) => void;
  savingFavorites: Record<string, boolean>;
}

const SUBCATEGORY_CONFIG = {
  residential: {
    label: 'Residential Rentals',
    subtitle: 'Houses, Bedsitters & Compounds',
    icon: 'fa-house',
    types: [UnitType.BEDSITTER, UnitType.ONE_BEDROOM, UnitType.TWO_BEDROOM, UnitType.THREE_BEDROOM, UnitType.FOUR_BEDROOM, UnitType.OWN_COMPOUND],
    color: 'from-emerald-600 to-teal-700',
  },
  commercial: {
    label: 'Commercial Spaces',
    subtitle: 'Shops, Stalls & Business Premises',
    icon: 'fa-shop',
    types: [UnitType.BUSINESS_HOUSE],
    color: 'from-purple-600 to-indigo-700',
  },
  bnb: {
    label: 'B&Bs & Short Stays',
    subtitle: 'Airbnb, Guest Rooms & Campsites',
    icon: 'fa-bed',
    types: SHORT_STAY_UNIT_TYPES,
    color: 'from-pink-600 to-rose-700',
  },
  farmland: {
    label: 'Farmland for Rent',
    subtitle: 'Lease fertile land for farming',
    icon: 'fa-tractor',
    types: [UnitType.FARMLAND_RENT],
    color: 'from-lime-600 to-green-700',
  },
  all: {
    label: 'All Rentals',
    subtitle: 'Every rental property in Kajiado South',
    icon: 'fa-key',
    types: RENT_UNIT_TYPES,
    color: 'from-blue-600 to-blue-800',
  },
};

const RentPage: React.FC<RentPageProps> = ({
  listings, isLoading, currentUser, onSelectListing, onToggleFavorite, savingFavorites
}) => {
  const { subcategory } = useParams<{ subcategory?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [vacantOnly, setVacantOnly] = useState(false);

  const sub = (subcategory as keyof typeof SUBCATEGORY_CONFIG) || 'all';
  const config = SUBCATEGORY_CONFIG[sub] || SUBCATEGORY_CONFIG.all;

  // Rent-category listings only (or treat missing category as rent for backward compat)
  const rentListings = useMemo(() =>
    listings.filter(l => !l.category || l.category === ListingCategory.RENT),
    [listings]
  );

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    return rentListings.filter(l => {
      const matchesSub = config.types.includes(l.unitType);
      const matchesSearch = !q || l.title.toLowerCase().includes(q) || l.locationName.toLowerCase().includes(q);
      const matchesVacant = !vacantOnly || l.isVacant;
      return matchesSub && matchesSearch && matchesVacant;
    });
  }, [rentListings, config.types, searchInput, vacantOnly]);

  const subcats = [
    { key: 'all', label: 'All', icon: 'fa-th' },
    { key: 'residential', label: 'Residential', icon: 'fa-house' },
    { key: 'commercial', label: 'Commercial', icon: 'fa-shop' },
    { key: 'bnb', label: 'B&B', icon: 'fa-bed' },
    { key: 'farmland', label: 'Farmland', icon: 'fa-tractor' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className={`relative bg-gradient-to-br ${config.color} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000')] bg-cover bg-center mix-blend-overlay" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-4">
            <i className={`fas ${config.icon} text-sm`} />
            <span className="text-xs font-black uppercase tracking-widest">Rent</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{config.label}</h1>
          <p className="text-white/80 text-sm mb-8">{config.subtitle}</p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm" />
              <input
                id="rent-search-input"
                type="text"
                placeholder="Search by location or name..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-transparent text-white placeholder-white/50 outline-none text-sm font-medium"
              />
            </div>
            <button
              id="rent-vacant-toggle"
              onClick={() => setVacantOnly(v => !v)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                vacantOnly ? 'bg-white text-slate-900' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <i className="fas fa-check-circle mr-1.5" />Vacant Only
            </button>
          </div>
        </div>
      </div>

      {/* Subcategory pill nav */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar py-3">
          {subcats.map(s => (
            <button
              key={s.key}
              id={`rent-subcat-${s.key}`}
              onClick={() => navigate(s.key === 'all' ? '/rent' : `/rent/${s.key}`)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                sub === s.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <i className={`fas ${s.icon} text-[10px]`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isLoading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'listing' : 'listings'} found`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <i className="fas fa-circle-notch animate-spin text-3xl" />
            <p className="text-xs font-black uppercase tracking-widest">Loading listings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
              <i className="fas fa-house-circle-exclamation text-2xl" />
            </div>
            <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">No Listings Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => onSelectListing(listing)}
                isFavorite={currentUser?.favorites?.includes(listing.id) || false}
                onToggleFavorite={() => onToggleFavorite(listing.id)}
                isSavingFavorite={savingFavorites[listing.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RentPage;
