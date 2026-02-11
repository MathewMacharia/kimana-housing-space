
import React from 'react';
import { Listing, UnitType } from '../types';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  variant?: 'grid' | 'horizontal';
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, variant = 'grid' }) => {
  const containerClass = variant === 'horizontal' 
    ? 'w-72 flex-shrink-0 snap-start' 
    : 'w-full';

  const daysAgo = Math.floor((new Date().getTime() - new Date(listing.dateListed).getTime()) / (1000 * 60 * 60 * 24));
  const dateLabel = daysAgo === 0 ? 'Added Today' : `${daysAgo}d ago`;

  return (
    <div 
      onClick={onClick}
      className={`${containerClass} bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer group`}
    >
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img 
          src={listing.photos[0]} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-blue-600 shadow-sm border border-blue-50">
            {listing.unitType === UnitType.BUSINESS_HOUSE ? 'BIZ SPACE' : listing.unitType.toUpperCase()}
          </div>
          <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-sm">
            {dateLabel}
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-3 text-white">
           <p className="text-lg font-black leading-none">Ksh {listing.price.toLocaleString()}</p>
           <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">{listing.pricePeriod === 'monthly' ? 'per month' : 'per night'}</p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-slate-800 line-clamp-1 text-sm">{listing.title}</h3>
        <div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-tight">
          <i className="fas fa-map-marker-alt text-red-400"></i>
          <span className="truncate">{listing.locationName}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
           <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${listing.isVacant ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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
