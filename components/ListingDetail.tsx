
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
}

const ListingDetail: React.FC<ListingDetailProps> = ({ listing, onBack, onUnlock, isUnlocked, currentUser, onAddReview }) => {
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

  const averageRating = listing.reviews.length > 0 
    ? (listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length).toFixed(1)
    : "N/A";

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== UserRole.TENANT) return;
    setIsSubmitting(true);
    
    const review: Review = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString().split('T')[0]
    };

    setTimeout(() => {
      onAddReview?.(review);
      setNewComment('');
      setNewRating(5);
      setIsSubmitting(false);
      alert('Review successfully posted to Kimana Space!');
    }, 1000);
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
    <div className="animate-in slide-in-from-right duration-500 bg-white min-h-full -mx-4 -mt-4 px-4 pb-12">
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md -mx-4 px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="text-center">
          <h2 className="font-bold text-slate-800 text-sm max-w-[150px] truncate">{listing.title}</h2>
          <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <i className="fas fa-shield-alt text-[7px]"></i> Verified Asset
          </p>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 active:scale-90 transition-transform">
          <i className="far fa-heart"></i>
        </button>
      </div>

      <div className="space-y-6 pt-4">
        {/* Gallery */}
        <div className="relative group/gallery">
          <div ref={galleryRef} className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
            {listing.photos.map((photo, i) => (
              <div key={i} className="snap-start relative flex-shrink-0 w-[90vw] h-80 rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
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

          <button onClick={() => scrollGallery('right')} className="absolute bottom-4 right-4 bg-blue-600/90 backdrop-blur px-4 py-2 rounded-full text-white text-[10px] font-black z-40 flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-blue-200">
            NEXT PHOTO <i className="fas fa-arrow-right text-[8px] animate-pulse"></i>
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-5 shadow-sm">
          <div className="flex justify-between items-start gap-3">
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                   Listed {new Date(listing.dateListed).toLocaleDateString()}
                 </span>
                 {listing.hasParking && <span className="bg-slate-200 text-slate-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><i className="fas fa-car text-[7px]"></i> Parking</span>}
                 {listing.isPetsFriendly && <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><i className="fas fa-dog text-[7px]"></i> Pets OK</span>}
               </div>
               <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{listing.title}</h1>
               <div className="flex items-center gap-2 mt-2">
                 <p className="text-xs text-slate-500 font-bold"><i className="fas fa-location-dot text-red-500 mr-1"></i> {listing.locationName}</p>
                 <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                 <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <i className="fas fa-star"></i> {averageRating}
                 </div>
               </div>
             </div>
             <div className="bg-white px-5 py-4 rounded-2xl border border-slate-100 text-right shadow-sm flex-shrink-0">
               <p className="text-xl font-black text-blue-600">Ksh {listing.price.toLocaleString()}</p>
               <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                 {listing.unitType === UnitType.BUSINESS_HOUSE ? 'Lease' : (listing.pricePeriod === 'monthly' ? 'Monthly' : 'Nightly')}
               </p>
             </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="px-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
               <div className="w-1 h-4 bg-amber-500 rounded-full"></div> Resident Feedback
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
            {listing.reviews.length > 0 ? listing.reviews.map(review => (
              <div key={review.id} className="snap-start flex-shrink-0 w-80 bg-white p-5 rounded-3xl border border-slate-100 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">{review.userName.substring(0,2).toUpperCase()}</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{review.userName}</p>
                      <p className="text-[8px] text-slate-400 font-bold">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-[8px] text-amber-500">{Array.from({ length: 5 }).map((_, i) => (<i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star`}></i>))}</div>
                </div>
                <p className="text-xs text-slate-600 italic line-clamp-3">"{review.comment}"</p>
              </div>
            )) : <div className="w-full text-center py-6 text-slate-400 text-[10px] uppercase font-black tracking-widest bg-slate-50 rounded-3xl">No reviews yet</div>}
          </div>
        </div>

        {/* Action Logic */}
        <div className="px-1">
          {!canSeeContact ? (
            currentUser?.role === UserRole.TENANT ? (
              <div className="bg-white border-2 border-blue-600 rounded-[2.5rem] p-8 text-center space-y-5 shadow-2xl shadow-blue-50 relative overflow-hidden">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto shadow-xl">
                  <i className="fas fa-lock"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight uppercase">Reveal Landlord</h4>
                  <p className="text-xs text-slate-500 mt-2">Unlock contact details for <span className="text-blue-600 font-black">Ksh {unlockFee}</span></p>
                </div>
                <button onClick={onUnlock} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-widest">
                  Unlock via M-Pesa <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-[2.5rem] p-8 text-center text-slate-400 font-black text-xs uppercase tracking-widest border border-dashed border-slate-300">
                Only Tenants can unlock listings
              </div>
            )
          ) : (
            <div className="bg-green-50 border-2 border-green-500 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
               <div className="flex items-center gap-4 border-b border-green-100 pb-6">
                  <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-200">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight">{listing.landlordName}</h4>
                    <p className="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <i className="fas fa-check-circle"></i> {isLandlordOfThis ? 'Your Listing' : 'Verified Owner'}
                    </p>
                  </div>
               </div>
               <div className="space-y-3">
                 <a href={`tel:${listing.landlordPhone}`} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-green-100 shadow-sm active:scale-98 transition-all">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><i className="fas fa-phone-alt"></i></div>
                     <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Call Now</p><p className="text-sm font-black text-slate-800 tracking-tight">{listing.landlordPhone}</p></div>
                   </div>
                 </a>
                 <a href={`mailto:${listing.landlordEmail}`} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-green-100 shadow-sm active:scale-98 transition-all">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><i className="fas fa-envelope"></i></div>
                     <div><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Email Landlord</p><p className="text-sm font-black text-slate-800 tracking-tight">{listing.landlordEmail}</p></div>
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
