import React from 'react';
import { Listing, User, UnitType } from '../types';

interface FeaturedListingsProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  currentUser: User | null;
  onToggleFavorite: (listingId: string) => void;
  savingFavorites: Record<string, boolean>;
}

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
  listings,
  onSelectListing,
  currentUser,
  onToggleFavorite,
  savingFavorites,
}) => {
  // Use first 3 or 4 listings for "Featured" section
  const featuredListings = listings.slice(0, 4);

  if (featuredListings.length === 0) return null;

  const getSpecs = (listing: Listing) => {
    let beds = '1';
    let baths = '1';
    let size = '250 sqft';

    const type = listing.unitType;
    if (type === UnitType.ONE_BEDROOM) { beds = '1'; baths = '1'; size = '450 sqft'; }
    else if (type === UnitType.TWO_BEDROOM) { beds = '2'; baths = '1.5'; size = '700 sqft'; }
    else if (type === UnitType.THREE_BEDROOM) { beds = '3'; baths = '2'; size = '1,100 sqft'; }
    else if (type === UnitType.FOUR_BEDROOM) { beds = '4'; baths = '3'; size = '1,600 sqft'; }
    else if (type === UnitType.BEDSITTER) { beds = '1'; baths = '1'; size = '280 sqft'; }
    else if (type === UnitType.OWN_COMPOUND) { beds = '3'; baths = '2.5'; size = '1,800 sqft'; }
    else if (type === UnitType.GUEST_ROOM) { beds = '1'; baths = '1'; size = '180 sqft'; }
    else if (type === UnitType.CAMPSITE) { beds = '1'; baths = 'Shared'; size = '1,200 sqft'; }
    else if (type === UnitType.BUSINESS_HOUSE) { beds = '0'; baths = 'Shared'; size = '200 sqft'; }
    else if (type === UnitType.AIRBNB || type === UnitType.BNB) {
      beds = '2'; baths = '2'; size = '550 sqft';
    }

    if (listing.landSize) {
      size = listing.landSize;
    }

    return { beds, baths, size };
  };

  const getBadgeStyles = (unitType: UnitType) => {
    if (unitType === UnitType.BNB || unitType === UnitType.AIRBNB) {
      return 'bg-amber-500 text-white';
    }
    if (unitType === UnitType.BUSINESS_HOUSE) {
      return 'bg-blue-600 text-white';
    }
    if (unitType === UnitType.LAND_SALE || unitType === UnitType.FARMLAND_SALE) {
      return 'bg-emerald-600 text-white';
    }
    return 'bg-slate-700 text-white';
  };

  const getFriendlyUnitTypeLabel = (unitType: UnitType) => {
    if (unitType === UnitType.BNB) return 'B&B';
    if (unitType === UnitType.AIRBNB) return 'BNB';
    if (unitType === UnitType.BUSINESS_HOUSE) return 'BUSINESS';
    if (unitType === UnitType.LAND_SALE) return 'LAND';
    if (unitType === UnitType.FARMLAND_RENT || unitType === UnitType.FARMLAND_SALE) return 'FARM';
    return 'RENT';
  };

  return (
    <section className="py-8 max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Featured Listings</h2>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-0.5">Handpicked properties just for you.</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
        {featuredListings.map((listing) => {
          const isFavorite = currentUser?.favorites?.includes(listing.id) || false;
          const isSavingFavorite = savingFavorites[listing.id] || false;
          const { beds, baths, size } = getSpecs(listing);
          const ratingVal = listing.reviews.length > 0
            ? (listing.reviews.reduce((a, b) => a + b.rating, 0) / listing.reviews.length).toFixed(1)
            : 'New';

          return (
            <div
              key={listing.id}
              onClick={() => onSelectListing(listing)}
              className="w-[280px] sm:w-[350px] flex-shrink-0 snap-start bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800/80 active:scale-[0.98] transition-all cursor-pointer group flex flex-col"
            >
              {/* Photo Area */}
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={listing.photos[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Category Badge (Top-left) */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shadow-sm ${getBadgeStyles(listing.unitType)}`}>
                    {getFriendlyUnitTypeLabel(listing.unitType)}
                  </span>
                </div>

                {/* Favorite Heart (Top-right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(listing.id);
                  }}
                  disabled={isSavingFavorite}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md z-20 ${
                    isFavorite ? 'bg-blue-600 text-white' : 'bg-white/95 dark:bg-slate-900/95 text-slate-400'
                  } ${isSavingFavorite ? 'opacity-70' : 'active:scale-90'}`}
                >
                  {isSavingFavorite ? (
                    <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
                  ) : (
                    <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-[10px]`}></i>
                  )}
                </button>

                {/* Price Pill Overlay (Bottom-right) */}
                <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-900 dark:text-white shadow-md border border-slate-100 dark:border-slate-800">
                  KES {listing.price.toLocaleString()}/{listing.pricePeriod === 'once' ? 'once' : (listing.pricePeriod === 'nightly' ? 'night' : 'month')}
                </div>
              </div>

              {/* Details Area */}
              <div className="p-4 flex flex-col justify-between flex-grow gap-2.5">
                {/* Row 1: Title and Star Rating */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base line-clamp-1 truncate text-left">
                    {listing.title}
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <i className="fas fa-star text-[8px]"></i> {ratingVal}
                  </div>
                </div>

                {/* Row 2: Location */}
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider text-left">
                  <i className="fas fa-location-dot text-emerald-500"></i>
                  <span className="truncate">{listing.locationName.toUpperCase()}</span>
                </div>

                {/* Row 3: Specs Grid (Beds, Baths, Size) */}
                <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-center text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                  {/* Bed Column */}
                  <div className="flex items-center justify-center gap-1.5 border-r border-slate-100 dark:border-slate-800/80">
                    <i className="fas fa-bed text-slate-400 text-[11px]" />
                    <span>{beds}</span>
                  </div>

                  {/* Bath Column */}
                  <div className="flex items-center justify-center gap-1.5 border-r border-slate-100 dark:border-slate-800/80">
                    <i className="fas fa-bath text-slate-400 text-[11px]" />
                    <span>{baths}</span>
                  </div>

                  {/* Size Column */}
                  <div className="flex items-center justify-center gap-1.5">
                    <i className="fas fa-ruler-combined text-slate-400 text-[11px]" />
                    <span className="truncate max-w-[50px]">{size}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedListings;
