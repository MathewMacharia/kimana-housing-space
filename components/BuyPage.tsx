
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing, UnitType, ListingCategory, BUY_UNIT_TYPES, User } from '../types';
import ListingCard from './ListingCard';

interface BuyPageProps {
  listings: Listing[];
  isLoading: boolean;
  currentUser: User | null;
  onSelectListing: (listing: Listing) => void;
  onToggleFavorite: (id: string) => void;
  savingFavorites: Record<string, boolean>;
}

const SUBCATEGORY_CONFIG = {
  property: {
    label: 'Property for Sale',
    subtitle: 'Homes, Apartments & Commercial Properties',
    icon: 'fa-building',
    types: [UnitType.PROPERTY_SALE],
    color: 'from-blue-700 to-indigo-800',
  },
  land: {
    label: 'Land for Sale',
    subtitle: 'Residential & Agricultural Plots',
    icon: 'fa-land-mine-on',
    types: [UnitType.LAND_SALE, UnitType.FARMLAND_SALE],
    color: 'from-amber-600 to-orange-700',
  },
  all: {
    label: 'Buy Property',
    subtitle: 'Homes, land and property for sale in Kajiado South',
    icon: 'fa-home',
    types: BUY_UNIT_TYPES,
    color: 'from-slate-700 to-slate-900',
  },
};

const BuyPage: React.FC<BuyPageProps> = ({
  listings, isLoading, currentUser, onSelectListing, onToggleFavorite, savingFavorites
}) => {
  const { subcategory } = useParams<{ subcategory?: string }>();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const sub = (subcategory as keyof typeof SUBCATEGORY_CONFIG) || 'all';
  const config = SUBCATEGORY_CONFIG[sub] || SUBCATEGORY_CONFIG.all;

  const buyListings = useMemo(() =>
    listings.filter(l => l.category === ListingCategory.BUY),
    [listings]
  );

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    return buyListings.filter(l => {
      const matchesSub = config.types.includes(l.unitType);
      const matchesSearch = !q || l.title.toLowerCase().includes(q) || l.locationName.toLowerCase().includes(q);
      return matchesSub && matchesSearch;
    });
  }, [buyListings, config.types, searchInput]);

  const subcats = [
    { key: 'all', label: 'All', icon: 'fa-home' },
    { key: 'property', label: 'Property', icon: 'fa-building' },
    { key: 'land', label: 'Land', icon: 'fa-land-mine-on' },
  ];

  const formatSalePrice = (price: number) =>
    price >= 1_000_000
      ? `KES ${(price / 1_000_000).toFixed(1)}M`
      : `KES ${price.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className={`relative bg-gradient-to-br ${config.color} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2000')] bg-cover bg-center mix-blend-overlay" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-4">
            <i className={`fas ${config.icon} text-sm`} />
            <span className="text-xs font-black uppercase tracking-widest">Buy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{config.label}</h1>
          <p className="text-white/80 text-sm mb-8">{config.subtitle}</p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm" />
              <input
                id="buy-search-input"
                type="text"
                placeholder="Search by location or title..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-transparent text-white placeholder-white/50 outline-none text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category info cards */}
      {sub === 'all' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              id="buy-subcat-property-card"
              onClick={() => navigate('/buy/property')}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-left text-white hover:shadow-2xl hover:shadow-blue-200 dark:hover:shadow-blue-900/30 active:scale-[0.98] transition-all duration-200"
            >
              <i className="fas fa-building text-5xl text-white/20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <i className="fas fa-building text-xl" />
                </div>
                <h3 className="text-xl font-black mb-1">Property for Sale</h3>
                <p className="text-sm text-white/70">Homes, maisonettes & apartments</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80">
                  Browse Properties <i className="fas fa-arrow-right" />
                </div>
              </div>
            </button>

            <button
              id="buy-subcat-land-card"
              onClick={() => navigate('/buy/land')}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-8 text-left text-white hover:shadow-2xl hover:shadow-amber-200 dark:hover:shadow-amber-900/30 active:scale-[0.98] transition-all duration-200"
            >
              <i className="fas fa-map text-5xl text-white/20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <i className="fas fa-land-mine-on text-xl" />
                </div>
                <h3 className="text-xl font-black mb-1">Land for Sale</h3>
                <p className="text-sm text-white/70">Residential plots & farmland</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80">
                  Browse Land <i className="fas fa-arrow-right" />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Subcategory pill nav */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar py-3">
          {subcats.map(s => (
            <button
              key={s.key}
              id={`buy-subcat-${s.key}`}
              onClick={() => navigate(s.key === 'all' ? '/buy' : `/buy/${s.key}`)}
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
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {isLoading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'listing' : 'listings'} available`}
          </p>
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
            <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">No Listings Available</h3>
            <p className="text-xs text-slate-400 mt-1">Check back soon — new listings are added daily</p>
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

export default BuyPage;
