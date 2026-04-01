
import React, { useState, useRef } from 'react';
import { Listing, Review, UnitType, UserRole } from '../types';
import { UNLOCK_FEE_STANDARD, UNLOCK_FEE_AIRBNB, UNLOCK_FEE_BUSINESS, UNLOCK_FEE_SHORT_STAY } from '../constants';
import { FirebaseService } from '../services/db';
import { User } from '../types';

interface ListingDetailProps {
  listing: Listing;
  onBack: () => void;
  onUnlock: () => void;
  isUnlocked: boolean;
  currentUser?: { id: string, name: string, role: string };
  onAddReview?: (review: Review) => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onRequireAuth?: () => void;
  isSavingFavorite?: boolean;
}

const ListingDetail: React.FC<ListingDetailProps> = ({
  listing, onBack, onUnlock, isUnlocked, currentUser, onAddReview, onToggleFavorite, isFavorite, onRequireAuth, isSavingFavorite
}) => {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landlordInfo, setLandlordInfo] = useState<{ name: string, phone: string, email: string } | null>(
    (listing.landlordName && listing.landlordPhone) ? {
      name: listing.landlordName,
      phone: listing.landlordPhone,
      email: listing.landlordEmail || ''
    } : null
  );
  const [isLoadingLandlord, setIsLoadingLandlord] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const isLandlordOfThis = currentUser?.role === UserRole.LANDLORD && listing.landlordId === currentUser.id;
  const canSeeContact = isUnlocked || isLandlordOfThis;

  React.useEffect(() => {
    if (canSeeContact && !landlordInfo && !isLoadingLandlord) {
      const fetchLandlord = async () => {
        setIsLoadingLandlord(true);
        try {
          // PHASE 3: Use secure Cloud Function for contact reveal
          const contact = await FirebaseService.revealLandlordContact(listing.id);
          if (contact) {
            setLandlordInfo(contact);
          }
        } catch (error) {
          console.error("Failed to reveal landlord contact:", error);
        } finally {
          setIsLoadingLandlord(false);
        }
      };
      fetchLandlord();
    }
  }, [canSeeContact, landlordInfo, listing.id, isLoadingLandlord]);

  const getUnlockFee = () => {
    if (listing.unitType === UnitType.AIRBNB ||
      listing.unitType === UnitType.GUEST_ROOM ||
      listing.unitType === UnitType.CAMPSITE) return UNLOCK_FEE_SHORT_STAY;
    if (listing.unitType === UnitType.BUSINESS_HOUSE) return UNLOCK_FEE_BUSINESS;
    return UNLOCK_FEE_STANDARD;
  };

  const unlockFee = getUnlockFee();

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
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 active:scale-90 transition-transform">
            <i className="fas fa-share-alt"></i>
          </button>
          <button onClick={onToggleFavorite} disabled={isSavingFavorite} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isFavorite ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'} ${isSavingFavorite ? 'opacity-70' : 'active:scale-90'}`}>
            {isSavingFavorite ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>}
          </button>
        </div>
      </div>

      <div className="space-y-6 pt-4">
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

        <div className="px-1">
          {!canSeeContact ? (
            (!currentUser || currentUser.role === UserRole.TENANT) ? (
              <div className="bg-white dark:bg-slate-900 border-[1.5px] border-blue-500 rounded-[2.5rem] p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
                <div className="w-14 h-14 bg-[#0d6efd] rounded-2xl flex items-center justify-center text-white text-xl mx-auto shadow-lg shadow-blue-500/30">
                  <i className="fas fa-lock"></i>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-100 text-[15px] tracking-wide uppercase">Unlock Full Access</h4>
                  <div className="bg-[#f8f9fa] dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mt-5">
                    <p className="text-[13px] text-[#495057] dark:text-slate-300 leading-relaxed text-left">
                      Dear Tenant, to get the <span className="font-bold text-[#0d6efd]">Building Name / Title</span> and <span className="font-bold text-[#0d6efd] dark:text-blue-400">contacts of the landlord/Agent</span>, please pay a charge of <span className="font-bold">Ksh {unlockFee}</span>.
                    </p>
                    <div className="mt-4 pt-4 border-t border-[#dee2e6] dark:border-slate-700 text-center">
                      <p className="text-[9px] text-[#868e96] font-bold uppercase italic tracking-wider">
                        (Ksh 50 for rental, 100 for BnB/Guest Room/Campsite, 50 for Stalls)
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={onUnlock} className="w-full py-4 bg-[#00b050] hover:bg-[#00a048] text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(0,176,80,0.39)] active:scale-[0.98] transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                  <i className="fas fa-unlock"></i> Unlock Listing
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
                  {listing.buildingName && <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{listing.buildingName}</p>}
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                    <i className="fas fa-check-circle"></i> Unlocked Asset Information
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Contact Person</p>
                {isLoadingLandlord ? (
                  <p className="text-xs font-bold text-blue-600 animate-pulse">Fetching contact details...</p>
                ) : (
                  <h4 className="font-black text-slate-800 dark:text-slate-100">{landlordInfo?.name || listing.landlordName || "Contact Landlord"}</h4>
                )}
              </div>

              <div className="space-y-3">
                {landlordInfo?.phone ? (
                  <a href={`tel:${landlordInfo.phone}`} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i className="fas fa-phone-alt"></i></div>
                      <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Call Now</p><p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{landlordInfo.phone}</p></div>
                    </div>
                  </a>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                    Phone contact unavailable. Please message through app.
                  </div>
                )}
                {landlordInfo?.email && (
                  <a href={`mailto:${landlordInfo.email}`} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i className="fas fa-envelope"></i></div>
                      <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Email Landlord</p><p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{landlordInfo.email}</p></div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenant Reviews ({listing.reviews.length})</h3>
            <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
              <i className="fas fa-star"></i> {averageRating}
            </div>
          </div>

          <div className="space-y-3">
            {listing.reviews.map((review) => (
              <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">{review.userName}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex text-amber-500 text-[8px]">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star`}></i>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))}
            {listing.reviews.length === 0 && (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No reviews yet</p>
              </div>
            )}
          </div>

          {!currentUser ? (
            <div className="mt-6 p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Want to share your experience?</p>
              <button onClick={onRequireAuth} className="px-6 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
                Log In to Review
              </button>
            </div>
          ) : currentUser.role === UserRole.TENANT ? (
            <div className="mt-6 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Add your review</h4>
              <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setNewRating(star)}
                      className={`text-xl transition-all ${star <= newRating ? 'text-amber-500 scale-110' : 'text-slate-200'}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
                <textarea required rows={3} placeholder="Share your experience with this property..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 text-xs text-black" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
                  {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : 'Post Review'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
