
import React from 'react';
import { Listing, UnitType } from '../types';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  variant?: 'grid' | 'horizontal';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isSavingFavorite?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  variant = 'grid',
  isFavorite,
  onToggleFavorite,
  isSavingFavorite
}) => {
  const containerClass = variant === 'horizontal'
    ? 'w-72 flex-shrink-0 snap-start'
    : 'w-full';

  const daysAgo = Math.floor((new Date().getTime() - new Date(listing.dateListed).getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = daysAgo === 0 ? 'Added Today' : `${daysAgo}d ago`;

  if (variant === 'horizontal') {
    return (
      <div
        onClick={onClick}
        className="w-64 h-80 flex-shrink-0 snap-start bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800/80 active:scale-[0.98] transition-all cursor-pointer group relative"
      >
        {/* Full-bleed Background Image */}
        <img
          src={listing.photos[0]}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Dark Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 z-10" />

        {/* Top Badges (Unit Type & Date) */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-20">
          <span className="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1 rounded-lg text-[8px] font-black uppercase text-blue-600 dark:text-blue-400 shadow-sm border border-blue-50/50 dark:border-blue-900/50">
            {listing.unitType === UnitType.BUSINESS_HOUSE ? 'BIZ SPACE' : listing.unitType.toUpperCase()}
          </span>
          <span className="bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] font-black text-white shadow-sm">
            {dateLabel}
          </span>
        </div>

        {/* Top Right Heart Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            disabled={isSavingFavorite}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg z-20 ${isFavorite ? 'bg-blue-600 text-white' : 'bg-black/35 text-white backdrop-blur-sm'} ${isSavingFavorite ? 'opacity-70' : 'active:scale-90'}`}
          >
            {isSavingFavorite ? (
              <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
            ) : (
              <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-[10px]`}></i>
            )}
          </button>
        )}

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white space-y-2 text-left">
          {/* Price */}
          <div>
            <p className="text-xl font-black tracking-tight leading-none text-white">Ksh {listing.price.toLocaleString()}</p>
            <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-0.5">
              {listing.pricePeriod === 'once' ? 'One-time' : (listing.pricePeriod === 'nightly' ? 'per night' : 'per month')}
            </p>
          </div>

          {/* Title & Location */}
          <div className="space-y-1">
            <h3 className="font-black text-sm tracking-tight line-clamp-1 text-white leading-tight">{listing.title}</h3>
            <div className="flex items-center gap-1.5 text-white/80 text-[8px] font-black uppercase tracking-wider">
              <i className="fas fa-location-dot text-red-500"></i>
              <span className="truncate text-white/80">{listing.locationName}</span>
            </div>
          </div>

          {/* Vacant badge and Rating */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${listing.isVacant ? 'bg-green-500/25 border border-green-500/20 text-green-300' : 'bg-red-500/25 border border-red-500/20 text-red-300'}`}>
              {listing.isVacant ? 'Vacant' : 'Occupied'}
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-[9px] font-black">
              <i className="fas fa-star text-[8px]"></i> {listing.reviews.length > 0 ? (listing.reviews.reduce((a, b) => a + b.rating, 0) / listing.reviews.length).toFixed(1) : 'New'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} className={`${containerClass} bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all cursor-pointer group relative`}>
      <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-blue-600 dark:text-blue-400 shadow-sm border border-blue-50 dark:border-blue-900/50">
            {listing.unitType === UnitType.BUSINESS_HOUSE ? 'BIZ SPACE' : listing.unitType.toUpperCase()}
          </div>
          <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-sm">
            {dateLabel}
          </div>
        </div>

        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            disabled={isSavingFavorite}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg ${isFavorite ? 'bg-blue-600 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-400'} ${isSavingFavorite ? 'opacity-70' : 'active:scale-90'}`}
          >
            {isSavingFavorite ? (
              <i className="fas fa-circle-notch animate-spin text-[10px]"></i>
            ) : (
              <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-[10px]`}></i>
            )}
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-3 text-white">
          <p className="text-lg font-black leading-none">Ksh {listing.price.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">{listing.pricePeriod === 'monthly' ? 'per month' : 'per night'}</p>
        </div>
      </div>
      <div className="p-4 space-y-2 text-left">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 text-sm">{listing.title}</h3>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-tight">
          <i className="fas fa-map-marker-alt text-red-400"></i>
          <span className="truncate">{listing.locationName}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
          <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${listing.isVacant ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
            {listing.isVacant ? 'Vacant' : 'Occupied'}
          </span>
          <div className="flex items-center gap-1 text-amber-500 text-[9px] font-black">
            <i className="fas fa-star"></i> {listing.reviews.length > 0 ? (listing.reviews.reduce((a, b) => a + b.rating, 0) / listing.reviews.length).toFixed(1) : 'New'}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ListingCard;
