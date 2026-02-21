
import React from 'react';
import { Listing, UnitType } from '../types';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  variant?: 'grid' | 'horizontal';
}

const ListingCard: React.FC<listingcardprops> = ({ listing, onClick, variant = 'grid' }) => {
  const containerClass = variant === 'horizontal' 
    ? 'w-72 flex-shrink-0 snap-start' 
    : 'w-full';

  const daysAgo = Math.floor((new Date().getTime() - new Date(listing.dateListed).getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = daysAgo === 0 ? 'Added Today' : `${daysAgo}d ago`;

  return (
    <div onclick="{onClick}" classname="{`${containerClass}" bg-white="" dark:bg-slate-900="" rounded-3xl="" overflow-hidden="" shadow-sm="" border="" border-slate-100="" dark:border-slate-800="" active:scale-[0.98]="" transition-all="" cursor-pointer="" group`}="">
      <div classname="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img src="{listing.photos[0]}" alt="{listing.title}" classname="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
        <div classname="absolute top-3 left-3 flex gap-2">
          <div classname="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-blue-600 dark:text-blue-400 shadow-sm border border-blue-50 dark:border-blue-900/50">
            {listing.unitType === UnitType.BUSINESS_HOUSE ? 'BIZ SPACE' : listing.unitType.toUpperCase()}
          </div>
          <div classname="bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-sm">
            {dateLabel}
          </div>
        </div>
        
        <div classname="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div classname="absolute bottom-3 left-3 text-white">
           <p classname="text-lg font-black leading-none">Ksh {listing.price.toLocaleString()}</p>
           <p classname="text-[9px] font-bold text-white/80 uppercase tracking-widest">{listing.pricePeriod === 'monthly' ? 'per month' : 'per night'}</p>
        </div>
      </div>
      <div classname="p-4 space-y-2">
        <h3 classname="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 text-sm">{listing.title}</h3>
        <div classname="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-tight">
          <i classname="fas fa-map-marker-alt text-red-400"></i>
          <span classname="truncate">{listing.locationName}</span>
        </div>
        <div classname="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
           <span classname="{`text-[8px]" font-black="" px-2="" py-1="" rounded-lg="" uppercase="" tracking-widest="" ${listing.isvacant="" ?="" 'bg-green-50="" dark:bg-green-900="" 20="" text-green-700="" dark:text-green-400'="" :="" 'bg-red-50="" dark:bg-red-900="" 20="" text-red-700="" dark:text-red-400'}`}="">
             {listing.isVacant ? 'Vacant' : 'Occupied'}
           </span>
           <div classname="flex items-center gap-1 text-amber-500 text-[9px] font-black">
              <i classname="fas fa-star"></i> {listing.reviews.length > 0 ? (listing.reviews.reduce((a, b) => a + b.rating, 0) / listing.reviews.length).toFixed(1) : 'New'}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
