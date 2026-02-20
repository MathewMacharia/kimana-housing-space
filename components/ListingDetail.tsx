
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

const ListingDetail: React.FC<listingdetailprops> = ({ 
  listing, onBack, onUnlock, isUnlocked, currentUser, onAddReview, onToggleFavorite, isFavorite 
}) => {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const galleryRef = useRef<htmldivelement>(null);

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
  const displayTitle = canSeeContact ? (listing.buildingName ? `${listing.title} - ${listing.buildingName}` : listing.title) : publicTitle;

  const averageRating = listing.reviews.length > 0 
    ? (listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length).toFixed(1)
    : "N/A";

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !onAddReview) return;
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const review: Review = {
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString()
    };

    try {
      await onAddReview(review);
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      alert("Failed to post review.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div classname="animate-in slide-in-from-right duration-500 bg-white dark:bg-slate-950 min-h-full -mx-4 -mt-4 px-4 pb-12">
      <div classname="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md -mx-4 px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onclick="{onBack}" classname="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 active:scale-90 transition-transform">
          <i classname="fas fa-chevron-left"></i>
        </button>
        <div classname="text-center">
          <h2 classname="font-bold text-slate-800 dark:text-slate-100 text-xs max-w-[150px] truncate">{displayTitle}</h2>
          <p classname="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <i classname="fas fa-shield-alt text-[7px]"></i> Verified Asset
          </p>
        </div>
        <div classname="flex gap-2">
          <button onclick="{handleShare}" classname="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 active:scale-90 transition-transform">
            <i classname="fas fa-share-alt"></i>
          </button>
          <button onclick="{onToggleFavorite}" classname="{`w-10" h-10="" flex="" items-center="" justify-center="" rounded-full="" transition-all="" active:scale-90="" ${isfavorite="" ?="" 'bg-red-50="" dark:bg-red-900="" 20="" text-red-500'="" :="" 'bg-slate-50="" dark:bg-slate-900="" text-slate-600="" dark:text-slate-400'}`}="">
            <i classname="{`${isFavorite" ?="" 'fas'="" :="" 'far'}="" fa-heart`}=""></i>
          </button>
        </div>
      </div>

      <div classname="space-y-6 pt-4">
        {/* Gallery */}
        <div classname="relative group/gallery">
          <div ref="{galleryRef}" classname="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
            {listing.photos.map((photo, i) => (
              <div key="{i}" classname="snap-start relative flex-shrink-0 w-[90vw] h-80 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                 <img src="{photo}" classname="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125" alt=""/>
                 <img src="{photo}" classname="relative w-full h-full object-contain z-10" alt="" loading="lazy"/>
                 <div classname="absolute top-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-white text-[10px] font-black z-20">
                   PHOTO {i + 1} / {listing.photos.length}
                 </div>
              </div>
            ))}
          </div>

          <div classname="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-30">
            <button onclick="{(e)" ==""> { e.stopPropagation(); scrollGallery('left'); }} className="w-10 h-10 bg-white/30 backdrop-blur rounded-full text-white flex items-center justify-center active:scale-90 transition-transform pointer-events-auto border border-white/20 shadow-lg"><i classname="fas fa-chevron-left"></i></button>
            <button onclick="{(e)" ==""> { e.stopPropagation(); scrollGallery('right'); }} className="w-10 h-10 bg-white/30 backdrop-blur rounded-full text-white flex items-center justify-center active:scale-90 transition-transform pointer-events-auto border border-white/20 shadow-lg"><i classname="fas fa-chevron-right"></i></button>
          </div>
        </div>

        {/* Info Card */}
        <div classname="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-5 shadow-sm">
          <div classname="flex justify-between items-start gap-3">
             <div classname="flex-1">
               <div classname="flex items-center gap-2 mb-2">
                 <span classname="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                   Listed {new Date(listing.dateListed).toLocaleDateString()}
                 </span>
                 {listing.hasParking && <span classname="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><i classname="fas fa-car text-[7px]"></i> Parking</span>}
               </div>
               <h1 classname="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                 {displayTitle}
               </h1>
               <div classname="flex items-center gap-2 mt-2">
                 <p classname="text-xs text-slate-500 dark:text-slate-400 font-bold"><i classname="fas fa-location-dot text-red-500 mr-1"></i> {listing.locationName}</p>
                 <div classname="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                 <div classname="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <i classname="fas fa-star"></i> {averageRating}
                 </div>
               </div>
             </div>
             <div classname="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-right shadow-sm flex-shrink-0">
               <p classname="text-xl font-black text-blue-600 dark:text-blue-400">Ksh {listing.price.toLocaleString()}</p>
               <p classname="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                 {listing.unitType === UnitType.BUSINESS_HOUSE ? 'Lease' : (listing.pricePeriod === 'monthly' ? 'Monthly' : 'Nightly')}
               </p>
             </div>
          </div>
          <div classname="space-y-4">
            <div classname="space-y-1">
              <p classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Overview</p>
              <div classname="flex flex-wrap gap-2">
                {/* Remove deposit section for Airbnb only */}
                {listing.unitType !== UnitType.AIRBNB && (
                   <div classname="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                     Deposit: Ksh {listing.deposit.toLocaleString()}
                   </div>
                )}
                <div classname="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                   Type: {listing.unitType}
                </div>
              </div>
            </div>
            <div classname="space-y-1">
              <p classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</p>
              <p classname="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{listing.description}</p>
            </div>
          </div>
        </div>

        {/* Action Logic */}
        <div classname="px-1">
          {!canSeeContact ? (
            currentUser?.role === UserRole.TENANT ? (
              <div classname="bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl shadow-blue-50 dark:shadow-none relative overflow-hidden">
                <div classname="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto shadow-xl">
                  <i classname="fas fa-lock"></i>
                </div>
                <div>
                  <h4 classname="font-black text-slate-900 dark:text-slate-100 text-lg tracking-tight uppercase">Unlock Full Access</h4>
                  <div classname="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mt-4">
                    <p classname="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed text-left">
                      Dear Tenant, to get the <span classname="font-black text-blue-600">Building Name / Title</span> and <span classname="font-black text-blue-600 dark:text-blue-400">contacts of the landlord/Agent</span>, please pay a charge of <span classname="font-black underline">Ksh {unlockFee}</span>.
                    </p>
                    <div classname="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p classname="text-[10px] text-slate-400 font-bold uppercase italic">
                        (Ksh 50 for rental, 100 for bnb, 50 for Stalls/nyumba ya biashara)
                      </p>
                    </div>
                  </div>
                </div>
                <button onclick="{onUnlock}" classname="w-full py-5 bg-[#3BB143] text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <i classname="fas fa-mobile-screen-button"></i> Pay via M-Pesa
                </button>
              </div>
            ) : (
              <div classname="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-8 text-center text-slate-400 font-black text-xs uppercase tracking-widest border border-dashed border-slate-300 dark:border-slate-800">
                Only Tenants can unlock listings
              </div>
            )
          ) : (
            <div classname="bg-green-50 dark:bg-green-900/10 border-2 border-green-500 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
               <div classname="flex items-center gap-4 border-b border-green-100 dark:border-green-900/30 pb-6">
                  <div classname="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-200 dark:shadow-none">
                    <i classname="fas fa-building"></i>
                  </div>
                  <div>
                    <h4 classname="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight uppercase tracking-tight">{listing.title}</h4>
                    {listing.buildingName && <p classname="text-sm font-bold text-slate-600 dark:text-slate-400">{listing.buildingName}</p>}
                    <p classname="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <i classname="fas fa-check-circle"></i> Unlocked Asset Information
                    </p>
                  </div>
               </div>
               
               <div classname="space-y-1">
                 <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Contact Person</p>
                 <h4 classname="font-black text-slate-800 dark:text-slate-100">{listing.landlordName}</h4>
               </div>

               <div classname="space-y-3">
                 <a href="{`tel:${listing.landlordPhone}`}" classname="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                   <div classname="flex items-center gap-4">
                     <div classname="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i classname="fas fa-phone-alt"></i></div>
                     <div><p classname="text-[8px] text-slate-400 font-black uppercase tracking-widest">Call Now</p><p classname="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{listing.landlordPhone}</p></div>
                   </div>
                 </a>
                 <a href="{`mailto:${listing.landlordEmail}`}" classname="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                   <div classname="flex items-center gap-4">
                     <div classname="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i classname="fas fa-envelope"></i></div>
                     <div><p classname="text-[8px] text-slate-400 font-black uppercase tracking-widest">Email Landlord</p><p classname="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{listing.landlordEmail}</p></div>
                   </div>
                 </a>
               </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div classname="space-y-4 px-1">
          <div classname="flex items-center justify-between">
            <h3 classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenant Reviews ({listing.reviews.length})</h3>
            <div classname="flex items-center gap-1 text-amber-500 font-black text-xs">
              <i classname="fas fa-star"></i> {averageRating}
            </div>
          </div>

          <div classname="space-y-3">
            {listing.reviews.map((review) => (
              <div key="{review.id}" classname="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div classname="flex justify-between items-start mb-2">
                  <div>
                    <p classname="text-xs font-black text-slate-800 dark:text-slate-100">{review.userName}</p>
                    <p classname="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                  <div classname="flex text-amber-500 text-[8px]">
                    {[...Array(5)].map((_, i) => (
                      <i key="{i}" classname="{`${i" <="" review.rating="" ?="" 'fas'="" :="" 'far'}="" fa-star`}=""></i>
                    ))}
                  </div>
                </div>
                <p classname="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))}
            {listing.reviews.length === 0 && (
              <div classname="py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">No reviews yet</p>
              </div>
            )}
          </div>

          {currentUser?.role === UserRole.TENANT && (
            <div classname="mt-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 classname="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Add your review</h4>
              <form onsubmit="{handleAddReviewSubmit}" classname="space-y-4">
                <div classname="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key="{star}" type="button" onclick="{()" ==""> setNewRating(star)}
                      className={`text-xl transition-all ${star <= newRating ? 'text-amber-500 scale-110' : 'text-slate-200'}`}
                    >
                      <i classname="fas fa-star"></i>
                    </button>
                  ))}
                </div>
                <textarea required="" rows="{3}" placeholder="Share your experience with this property..." classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 text-xs text-black" value="{newComment}" onchange="{(e)" ==""> setNewComment(e.target.value)}
                ></textarea>
                <button type="submit" disabled="{isSubmitting}" classname="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
                  {isSubmitting ? <i classname="fas fa-circle-notch animate-spin"></i> : 'Post Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
