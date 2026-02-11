
import React, { useState, useRef } from 'react';
import { Listing, UnitType } from '../types';
import { LISTING_FEE_STANDARD, LISTING_FEE_AIRBNB_MONTHLY, LISTING_FEE_BUSINESS, KIMANA_LOCATIONS } from '../constants';
import PaymentModal from './PaymentModal';

interface LandlordDashboardProps {
  listings: Listing[];
  setListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onUpdateListing: (listing: Listing) => void;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  onViewPublicDetails: (listing: Listing) => void;
}

const LandlordDashboard: React.FC<LandlordDashboardProps> = ({ 
  listings, setListings, onUpdateListing, landlordId, landlordName, landlordPhone, landlordEmail, onViewPublicDetails 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingListing, setPendingListing] = useState<Listing | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentFormListing, setCurrentFormListing] = useState<Partial<Listing>>({
    unitType: UnitType.BEDSITTER,
    pricePeriod: 'monthly',
    isVacant: true,
    deposit: 0,
    photos: [],
    reviews: [],
    hasParking: false,
    isPetsFriendly: false,
    locationName: ''
  });

  const landlordListings = listings.filter(l => l.landlordId === landlordId);

  const handleOpenAddForm = () => {
    setIsEditing(false);
    setCurrentFormListing({
      unitType: UnitType.BEDSITTER,
      pricePeriod: 'monthly',
      isVacant: true,
      deposit: 0,
      photos: [],
      reviews: [],
      hasParking: false,
      isPetsFriendly: false,
      locationName: ''
    });
    setShowForm(true);
  };

  const handleOpenEditForm = (listing: Listing) => {
    setIsEditing(true);
    setCurrentFormListing({ ...listing });
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newPhotos: string[] = [...(currentFormListing.photos || [])];

    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(filePromises);
    const combined = [...newPhotos, ...results];
    
    setCurrentFormListing({
      ...currentFormListing,
      photos: combined
    });
    setIsUploading(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    const updated = [...(currentFormListing.photos || [])];
    updated.splice(index, 1);
    setCurrentFormListing({
      ...currentFormListing,
      photos: updated
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const photosCount = currentFormListing.photos?.length || 0;
    if (photosCount < 8) {
      alert(`Security Policy: You must upload at least 8 images from different angles. Current: ${photosCount}/8`);
      return;
    }

    const finalListing = {
      ...currentFormListing as Listing,
      landlordName, landlordPhone, landlordEmail,
    };

    if (isEditing && currentFormListing.id) {
      onUpdateListing(finalListing);
      setShowForm(false);
    } else {
      const expiryDate = currentFormListing.unitType === UnitType.AIRBNB 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const newListing: Listing = {
        ...finalListing,
        id: Math.random().toString(36).substr(2, 9),
        landlordId,
        isVerified: false,
        distanceFromTown: 1.0,
        coordinates: { lat: -2.71, lng: 37.52 },
        reviews: [],
        dateListed: new Date().toISOString(),
        subscriptionExpiry: expiryDate
      };
      
      setPendingListing(newListing);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    if (pendingListing) {
      setListings(prev => [...prev, pendingListing]);
      setShowPayment(false);
      setShowForm(false);
      setPendingListing(null);
    }
  };

  const getListingFee = () => {
    if (currentFormListing.unitType === UnitType.AIRBNB) return LISTING_FEE_AIRBNB_MONTHLY;
    if (currentFormListing.unitType === UnitType.BUSINESS_HOUSE) return LISTING_FEE_BUSINESS;
    return LISTING_FEE_STANDARD;
  };

  const listingFee = getListingFee();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Management Suite</h2>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Active Properties & Tenant Feedback</p>
        </div>
        <button onClick={handleOpenAddForm} className="bg-blue-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 flex items-center gap-2">
          <i className="fas fa-plus"></i> Add New Unit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {landlordListings.length > 0 ? landlordListings.map(l => (
          <div key={l.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex gap-4 items-center shadow-sm hover:border-blue-200 transition-colors">
            <div className="relative cursor-pointer flex-shrink-0" onClick={() => onViewPublicDetails(l)}>
              <img src={l.photos[0]} className="w-20 h-20 object-cover rounded-2xl" alt="" />
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-bold border-2 border-white">
                {l.photos.length}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-800 truncate text-sm">{l.title}</h3>
                <button onClick={() => handleOpenEditForm(l)} className="text-slate-300 hover:text-blue-500"><i className="fas fa-edit text-xs"></i></button>
              </div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">Listed {new Date(l.dateListed).toLocaleDateString()}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateListing({ ...l, isVacant: !l.isVacant })} className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${l.isVacant ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {l.isVacant ? 'VACANT' : 'OCCUPIED'}
                </button>
                <button onClick={() => onViewPublicDetails(l)} className="text-[8px] font-black px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 uppercase tracking-widest">
                  View Reviews ({l.reviews.length})
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
             <i className="fas fa-house-chimney-user text-3xl text-slate-200 mb-2"></i>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No assets listed yet</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black text-slate-800">{isEditing ? 'Update Property' : 'Submit New Asset'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Name</label>
                <input required type="text" placeholder="e.g. Riverside Apartments" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-blue-500" value={currentFormListing.title || ''} onChange={(e) => setCurrentFormListing({...currentFormListing, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Type</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold text-sm" value={currentFormListing.unitType} onChange={(e) => setCurrentFormListing({...currentFormListing, unitType: e.target.value as UnitType, pricePeriod: e.target.value === UnitType.AIRBNB ? 'nightly' : 'monthly'})}>
                    {Object.values(UnitType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location/Area</label>
                  <select 
                    required 
                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 font-bold text-sm" 
                    value={currentFormListing.locationName || ''} 
                    onChange={(e) => setCurrentFormListing({...currentFormListing, locationName: e.target.value})}
                  >
                    <option value="" disabled>Select Area</option>
                    {KIMANA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price ({currentFormListing.pricePeriod})</label>
                  <input required type="number" placeholder="Ksh" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={currentFormListing.price || ''} onChange={(e) => setCurrentFormListing({...currentFormListing, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Req.</label>
                  <input required type="number" placeholder="Ksh" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={currentFormListing.deposit || ''} onChange={(e) => setCurrentFormListing({...currentFormListing, deposit: Number(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amenities</label>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setCurrentFormListing({...currentFormListing, hasParking: !currentFormListing.hasParking})}
                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${currentFormListing.hasParking ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    <i className="fas fa-car"></i> Parking
                  </button>
                  {currentFormListing.unitType === UnitType.AIRBNB && (
                    <button 
                      type="button" 
                      onClick={() => setCurrentFormListing({...currentFormListing, isPetsFriendly: !currentFormListing.isPetsFriendly})}
                      className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${currentFormListing.isPetsFriendly ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                      <i className="fas fa-dog"></i> Pets OK
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Description</label>
                <textarea required rows={3} placeholder="Tell tenants about the features, security, water supply, etc." className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={currentFormListing.description || ''} onChange={(e) => setCurrentFormListing({...currentFormListing, description: e.target.value})}></textarea>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photos ({currentFormListing.photos?.length || 0}/8 Required)</label>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1"
                  >
                    <i className="fas fa-upload"></i> Upload from Gallery
                  </button>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="grid grid-cols-4 gap-2">
                  {currentFormListing.photos?.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                      <img src={photo} className="w-full h-full object-cover" alt="" />
                      <button 
                        type="button" 
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  {(currentFormListing.photos?.length || 0) < 8 && (
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-all"
                    >
                      {isUploading ? <i className="fas fa-circle-notch animate-spin text-sm"></i> : <i className="fas fa-plus text-sm"></i>}
                      <span className="text-[7px] font-black uppercase">Add Photo</span>
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold italic">High quality images increase tenant reach by 3x.</p>
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all">
                {isEditing ? 'Update Listing' : `Lipa & Launch Asset (Ksh ${listingFee})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} title="Asset Activation" amount={listingFee} subtitle={`Listing Fee: ${pendingListing?.title}`} />
      )}
    </div>
  );
};

export default LandlordDashboard;
