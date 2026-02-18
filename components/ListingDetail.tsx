
import React, { useState, useRef } from 'react';
import { Listing, Review, UnitType, UserRole } from '../types';
import { UNLOCK_FEE_STANDARD, UNLOCK_FEE_AIRBNB, UNLOCK_FEE_BUSINESS } from '../constants';

interface ListingDetailProps {
  listing: Listing;
  onBack: () => void;
  onUnlock: () => void;
  isUnlocked: boolean;
  currentUser?: { id: string, name: string, role: string };
  onAddReview?: (review: Review) => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ 
  listing, onBack, onUnlock, isUnlocked, currentUser, onAddReview, onToggleFavorite, isFavorite 
}) => {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const getUnlockFee = () => {
    if (listing.unitType === UnitType.AIRBNB) return UNLOCK_FEE_AIRBNB;
    if (listing.unitType === UnitType.BUSINESS_HOUSE) return UNLOCK_FEE_BUSINESS;
    return UNLOCK_FEE_STANDARD;
  };

  const unlockFee = getUnlockFee();
  const isLandlordOfThis = currentUser?.role === UserRole.LANDLORD && listing.landlordId === currentUser.id;
  const canSeeContact = isUnlocked || isLandlordOfThis;

  // The Asset Title/Building Name is restricted until payment is successful
  const publicTitle = `${listing.unitType} in ${listing.locationName}`;
  const displayTitle = canSeeContact ? listing.title : publicTitle;

  const averageRating = listing.reviews.length > 0 
    ? (listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length).toFixed(1)
    : "N/A";

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => alert("Listing link copied to clipboard!"))
      .catch(() => alert("Failed to copy link."));
  };

  const handleShare = async () => {
    const shareData = {
      title: `Masqani Poa: ${displayTitle}`,
      text: `Check out this ${listing.unitType} in ${listing.locationName}. Price: Ksh ${listing.price.toLocaleString()}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const containerWidth = galleryRef.current.clientWidth;
      const scrollAmount = containerWidth * 0.9 + 12; 
      galleryRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="animate-in slide-in-from-right duration-500 bg-white dark:bg-slate-950 min-h-full -mx-4 -mt-4 px-4 pb-12">
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md -mx-4 px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="text-center">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xs max-w-[150px] truncate">{displayTitle}</h2>
          <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <i className="fas fa-shield-alt text-[7px]"></i> Verified Asset
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
          >
            <i className="fas fa-share-alt"></i>
          </button>
          <button 
            onClick={onToggleFavorite}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${isFavorite ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
          >
            <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
          </button>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        {/* Gallery */}
        <div className="relative group/gallery">
          <div ref={galleryRef} className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
            {listing.photos.map((photo, i) => (
              <div key={i} className="snap-start relative flex-shrink-0 w-[90vw] h-80 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                 <img src={photo} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125" alt="" />
                 <img src={photo} className="relative w-full h-full object-contain z-10" alt="" loading="lazy" />
                 <div className="absolute top-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-white text-[10px] font-black z-20">
                   PHOTO {i + 1} / {listing.photos.length}
                 </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-30">
            <button onClick={(e) => { e.stopPropagation(); scrollGallery('left'); }} className="w-10 h-10 bg-white/30 backdrop-blur rounded-full text-white flex items-center justify-center active:scale-90 transition-transform pointer-events-auto border border-white/20 shadow-lg"><i className="fas fa-chevron-left"></i></button>
            <button onClick={(e) => { e.stopPropagation(); scrollGallery('right'); }} className="w-10 h-10 bg-white/30 backdrop-blur rounded-full text-white flex items-center justify-center active:scale-90 transition-transform pointer-events-auto border border-white/20 shadow-lg"><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="flex justify-between items-start gap-3">
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                   Listed {new Date(listing.dateListed).toLocaleDateString()}
                 </span>
                 {listing.hasParking && <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><i className="fas fa-car text-[7px]"></i> Parking</span>}
               </div>
               <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                 {displayTitle}
               </h1>
               <div className="flex items-center gap-2 mt-2">
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-bold"><i className="fas fa-location-dot text-red-500 mr-1"></i> {listing.locationName}</p>
                 <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                 <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <i className="fas fa-star"></i> {averageRating}
                 </div>
               </div>
             </div>
             <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-right shadow-sm flex-shrink-0">
               <p className="text-xl font-black text-blue-600 dark:text-blue-400">Ksh {listing.price.toLocaleString()}</p>
               <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                 {listing.unitType === UnitType.BUSINESS_HOUSE ? 'Lease' : (listing.pricePeriod === 'monthly' ? 'Monthly' : 'Nightly')}
               </p>
             </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Overview</p>
              <div className="flex flex-wrap gap-2">
                {/* Remove deposit section for Airbnb only */}
                {listing.unitType !== UnitType.AIRBNB && (
                   <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                     Deposit: Ksh {listing.deposit.toLocaleString()}
                   </div>
                )}
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Type: {listing.unitType}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{listing.description}</p>
            </div>
          </div>
        </div>

        {/* Action Logic */}
        <div className="px-1">
          {!canSeeContact ? (
            currentUser?.role === UserRole.TENANT ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl shadow-blue-50 dark:shadow-none relative overflow-hidden">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto shadow-xl">
                  <i className="fas fa-lock"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg tracking-tight uppercase">Unlock Full Access</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4">
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed text-left">
                      Dear Tenant, to get the <span className="font-black text-blue-600">Building Name / Title</span> and <span className="font-black text-blue-600 dark:text-blue-400">contacts of the landlord/Agent</span>, please pay a charge of <span className="font-black underline">Ksh {unlockFee}</span>.
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase italic">
                        (Ksh 50 for rental, 100 for bnb, 50 for Stalls/nyumba ya biashara)
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={onUnlock} className="w-full py-5 bg-[#3BB143] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <i className="fas fa-mobile-screen-button"></i> Pay via M-Pesa
                </button>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-8 text-center text-slate-400 font-black text-xs uppercase tracking-widest border border-dashed border-slate-300 dark:border-slate-800">
                Only Tenants can unlock listings
              </div>
            )
          ) : (
            <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-500 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
               <div className="flex items-center gap-4 border-b border-green-100 dark:border-green-900/30 pb-6">
                  <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-200 dark:shadow-none">
                    <i className="fas fa-building"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight uppercase tracking-tight">{listing.title}</h4>
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <i className="fas fa-check-circle"></i> Unlocked Asset Information
                    </p>
                  </div>
               </div>
               
               <div className="space-y-1">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Contact Person</p>
                 <h4 className="font-black text-slate-800 dark:text-slate-100">{listing.landlordName}</h4>
               </div>

               <div className="space-y-3">
                 <a href={`tel:${listing.landlordPhone}`} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i className="fas fa-phone-alt"></i></div>
                     <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Call Now</p><p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{listing.landlordPhone}</p></div>
                   </div>
                 </a>
                 <a href={`mailto:${listing.landlordEmail}`} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i className="fas fa-envelope"></i></div>
                     <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Email Landlord</p><p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{listing.landlordEmail}</p></div>
                   </div>
                 </a>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
