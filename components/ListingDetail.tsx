import React, { useState, useRef } from 'react';
import { Listing, Review, UnitType, UserRole } from '../types';
import {
  UNLOCK_FEE_STANDARD, UNLOCK_FEE_AIRBNB, UNLOCK_FEE_BUSINESS,
  UNLOCK_FEE_SHORT_STAY, UNLOCK_FEE_BNB, UNLOCK_FEE_FARMLAND,
  UNLOCK_FEE_LAND_SALE, UNLOCK_FEE_PROPERTY_SALE
} from '../constants';
import { FirebaseService } from '../services/db';

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
  const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);
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
    if (listing.unitType === UnitType.PROPERTY_SALE) return UNLOCK_FEE_PROPERTY_SALE;
    if (listing.unitType === UnitType.LAND_SALE || listing.unitType === UnitType.FARMLAND_SALE) return UNLOCK_FEE_LAND_SALE;
    if (listing.unitType === UnitType.BNB) return UNLOCK_FEE_BNB;
    if (listing.unitType === UnitType.FARMLAND_RENT) return UNLOCK_FEE_FARMLAND;
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
      {/* Header Sticky Navbar */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-955/90 backdrop-blur-md -mx-4 px-4 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
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
        {/* Photo Grid / Gallery Hero */}
        <div className="relative">
          {/* Mobile View: Swipeable Carousel */}
          <div className="block md:hidden relative group/gallery">
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

          {/* Desktop View: Photo Grid Hero */}
          <div className="hidden md:grid grid-cols-4 gap-3 h-[400px] rounded-3xl overflow-hidden relative">
            {listing.photos.length === 1 ? (
              <div className="col-span-4 h-full relative bg-slate-100 dark:bg-slate-900">
                <img src={listing.photos[0]} className="w-full h-full object-cover" alt="" />
              </div>
            ) : listing.photos.length === 2 ? (
              <>
                <div className="col-span-2 h-full relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[0]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-2 h-full relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[1]} className="w-full h-full object-cover" alt="" />
                </div>
              </>
            ) : listing.photos.length === 3 ? (
              <>
                <div className="col-span-2 row-span-2 h-full relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[0]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-2 h-[194px] relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[1]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-2 h-[194px] relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[2]} className="w-full h-full object-cover" alt="" />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-2 row-span-2 h-full relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[0]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-1 h-[194px] relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[1]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-1 h-[194px] relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[2]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-1 h-[194px] relative bg-slate-100 dark:bg-slate-900">
                  <img src={listing.photos[3]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="col-span-1 h-[194px] relative bg-slate-100 dark:bg-slate-900">
                  {listing.photos[4] ? (
                    <img src={listing.photos[4]} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <i className="fas fa-images text-2xl text-slate-400"></i>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Show All Photos Button */}
            <button
              onClick={() => setIsFullscreenGalleryOpen(true)}
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-900 dark:text-slate-100 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg active:scale-95 transition-all z-25"
            >
              <i className="fas fa-images mr-2"></i> Show all photos
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Title, Overview, Description, Amenities, Reviews */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Header Details */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Listed {new Date(listing.dateListed).toLocaleDateString()}
                </span>
                {listing.hasParking && (
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-750 dark:text-slate-350 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <i className="fas fa-car text-[7px]"></i> Parking
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                {displayTitle}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <i className="fas fa-location-dot text-red-500 mr-1"></i> {listing.locationName}
                </p>
                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  <i className="fas fa-star text-[9px]"></i> {averageRating}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-2 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About this space</p>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amenities & Features</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Standard parking feature */}
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${listing.hasParking ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200' : 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 text-slate-350 dark:text-slate-600 line-through'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${listing.hasParking ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                    <i className="fas fa-car"></i>
                  </div>
                  <span className="text-xs font-bold">Secure Parking</span>
                </div>

                {/* Standard pet friendly feature */}
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${listing.isPetsFriendly ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200' : 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 text-slate-350 dark:text-slate-600 line-through'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${listing.isPetsFriendly ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                    <i className="fas fa-dog"></i>
                  </div>
                  <span className="text-xs font-bold">Pets Allowed</span>
                </div>

                {/* ListingAmenities checklist */}
                {Object.entries({
                  wifi: { label: 'Free WiFi', icon: 'fa-wifi', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
                  water: { label: 'Constant Water', icon: 'fa-droplet', color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
                  electricity: { label: 'Power Grid', icon: 'fa-bolt', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
                  security: { label: '24/7 Guard', icon: 'fa-user-shield', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                  cctv: { label: 'CCTV Cameras', icon: 'fa-video', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
                  solarPower: { label: 'Solar Backup', icon: 'fa-solar-panel', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
                  borehole: { label: 'Borehole Water', icon: 'fa-faucet-drip', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
                  generator: { label: 'Backup Gen', icon: 'fa-server', color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
                  swimmingPool: { label: 'Swimming Pool', icon: 'fa-water-ladder', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                  gym: { label: 'Fitness Gym', icon: 'fa-dumbbell', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' }
                }).map(([key, config]) => {
                  const hasAmenity = !!listing.amenities?.[key as keyof typeof listing.amenities];
                  return (
                    <div key={key} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${hasAmenity ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200' : 'bg-slate-100/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 text-slate-350 dark:text-slate-600 line-through'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${hasAmenity ? config.color : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                        <i className={`fas ${config.icon}`}></i>
                      </div>
                      <span className="text-xs font-bold">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tenant Reviews */}
            <div className="space-y-4 px-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenant Reviews ({listing.reviews.length})</h3>
                <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                  <i className="fas fa-star"></i> {averageRating}
                </div>
              </div>

              <div className="space-y-3">
                {listing.reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
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
                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic">"{review.comment}"</p>
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
                    <textarea required rows={3} placeholder="Share your experience with this property..." className="w-full p-4 bg-slate-55 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 text-xs text-black" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
                      {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : 'Post Review'}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column: Sticky Pricing & Action Sidebar */}
          <div className="md:sticky md:top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
              
              {/* Price Details */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Price</p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">Ksh {listing.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Period</p>
                  <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-350 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {listing.pricePeriod === 'once' ? 'One-time' : (listing.pricePeriod === 'nightly' ? 'Nightly' : 'Monthly')}
                  </span>
                </div>
              </div>

              {/* Property Details (Deposit, Size, Deed) */}
              <div className="grid grid-cols-1 gap-3">
                {listing.unitType !== UnitType.AIRBNB && listing.unitType !== UnitType.BNB && listing.pricePeriod !== 'once' && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-black uppercase text-[8px] tracking-wider">Refundable Deposit</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Ksh {listing.deposit.toLocaleString()}</span>
                  </div>
                )}
                {listing.landSize && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-black uppercase text-[8px] tracking-wider">Land Area</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{listing.landSize}</span>
                  </div>
                )}
                {listing.titleDeed !== undefined && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-black uppercase text-[8px] tracking-wider">Title Deed</span>
                    <span className="font-black">
                      {listing.titleDeed ? (
                        <span className="text-emerald-600 dark:text-emerald-450 uppercase tracking-widest text-[9px] flex items-center gap-1">
                          <i className="fas fa-check-circle text-[10px]"></i> Ready
                        </span>
                      ) : (
                        <span className="text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                          <i className="fas fa-circle-exclamation text-[10px]"></i> Pending
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Secure Unlock / Landlord Details */}
              <div className="pt-2">
                {!canSeeContact ? (
                  (!currentUser || currentUser.role === UserRole.TENANT) ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-[1.5px] border-blue-500 rounded-3xl p-6 text-center space-y-4 shadow-inner">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-lg mx-auto shadow-md shadow-blue-500/20">
                        <i className="fas fa-lock"></i>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs tracking-wide uppercase">Unlock Full Access</h4>
                        <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                          To reveal the <span className="font-bold text-blue-600 dark:text-blue-400">building name</span> and the <span className="font-bold text-blue-600 dark:text-blue-400">landlord's direct contact</span>, pay an unlock fee of <span className="font-black">Ksh {unlockFee}</span>.
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider italic">
                          (Ksh 50 rentals/stalls, Ksh 100 BnB/Airbnb, Ksh 150 land, Ksh 200 properties)
                        </p>
                      </div>
                      <button onClick={onUnlock} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className="fas fa-unlock text-xs"></i> Unlock Listing
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-6 text-center text-slate-400 font-black text-[9px] uppercase tracking-widest border border-dashed border-slate-300 dark:border-slate-800">
                      Only Tenants can unlock listings
                    </div>
                  )
                ) : (
                  <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-500 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-green-100 dark:border-green-900/30 pb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
                        <i className="fas fa-building"></i>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs truncate uppercase tracking-tight">{listing.title}</h4>
                        {listing.buildingName && <p className="text-[10px] font-bold text-slate-650 dark:text-slate-400 truncate">{listing.buildingName}</p>}
                        <p className="text-[8px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest mt-0.5">
                          <i className="fas fa-check-circle"></i> Unlocked Asset
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Contact Person</p>
                      {isLoadingLandlord ? (
                        <p className="text-xs font-bold text-blue-600 animate-pulse">Fetching details...</p>
                      ) : (
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">{landlordInfo?.name || listing.landlordName || "Contact Landlord"}</h4>
                      )}
                    </div>

                    <div className="space-y-2">
                      {landlordInfo?.phone ? (
                        <a href={`tel:${landlordInfo.phone}`} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i className="fas fa-phone-alt text-xs"></i></div>
                            <div>
                              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">Call Now</p>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-100">{landlordInfo.phone}</p>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl text-[9px] font-bold text-yellow-700 dark:text-yellow-400">
                          Phone contact unavailable.
                        </div>
                      )}
                      {landlordInfo?.email && (
                        <a href={`mailto:${landlordInfo.email}`} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm active:scale-98 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"><i className="fas fa-envelope text-xs"></i></div>
                            <div>
                              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">Email Landlord</p>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{landlordInfo.email}</p>
                            </div>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen modal photo viewer */}
      {isFullscreenGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">Photo Gallery</h3>
            <button
              onClick={() => setIsFullscreenGalleryOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory max-w-full pb-4">
              {listing.photos.map((photo, i) => (
                <div key={i} className="snap-center flex-shrink-0 w-[80vw] h-[60vh] rounded-3xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800 relative">
                  <img src={photo} className="max-w-full max-h-full object-contain" alt="" />
                  <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-white text-[9px] font-black">
                    PHOTO {i + 1} / {listing.photos.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-white/50 text-[9px] font-bold uppercase tracking-widest animate-pulse">
            Swipe left / right to browse
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
