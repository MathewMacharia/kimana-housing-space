
import React, { useState, useRef } from 'react';
import { Listing, UnitType } from '../types';
import { LISTING_FEE_STANDARD, LISTING_FEE_AIRBNB_MONTHLY, LISTING_FEE_BUSINESS, LOCATIONS_HIERARCHY } from '../constants';
import PaymentModal from './PaymentModal';
import { FirebaseService } from '../services/db';
import { refineDescription } from '../services/geminiService';

interface LandlordDashboardProps {
  listings: Listing[];
  onUpdateListing: (listing: Listing) => void;
  onCreateListing: (listing: Omit<listing, 'id'="">) => Promise<string |="" undefined="">;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  onViewPublicDetails: (listing: Listing) => void;
  onGoHome?: () => void;
}

const LandlordDashboard: React.FC<landlorddashboardprops> = ({ 
  listings, onUpdateListing, onCreateListing, landlordId, landlordName, landlordPhone, landlordEmail, onViewPublicDetails, onGoHome 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingListing, setPendingListing] = useState<omit<listing, 'id'=""> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const fileInputRef = useRef<htmlinputelement>(null);
  
  const [currentFormListing, setCurrentFormListing] = useState<partial<listing>>({
    unitType: UnitType.BEDSITTER,
    pricePeriod: 'monthly',
    isVacant: true,
    deposit: 0,
    photos: [],
    reviews: [],
    hasParking: false,
    isPetsFriendly: false,
    locationName: '',
    buildingName: ''
  });

  const landlordListings = listings.filter(l => l.landlordId === landlordId);

  const handleOpenAddForm = () => {
    setIsEditing(false);
    setCurrentFormListing({
      unitType: UnitType.BEDSITTER,
      pricePeriod: 'monthly',
      isVacant: true,
      price: 0,
      deposit: 0,
      photos: [],
      reviews: [],
      hasParking: false,
      isPetsFriendly: false,
      locationName: '',
      title: '',
      description: ''
    });
    setShowForm(true);
  };

  const handleOpenEditForm = (listing: Listing) => {
    setIsEditing(true);
    setCurrentFormListing({ ...listing });
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<htmlinputelement>) => {
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

    try {
      const results = await Promise.all(filePromises);
      setCurrentFormListing(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...results]
      }));
    } catch (err) {
      console.error("Image processing failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const updated = [...(currentFormListing.photos || [])];
    updated.splice(index, 1);
    setCurrentFormListing({
      ...currentFormListing,
      photos: updated
    });
  };

  const handleRefineWithAI = async () => {
    const currentDesc = currentFormListing.description;
    if (!currentDesc || currentDesc.length < 10) {
      alert("Please write a short draft first so AI can refine it.");
      return;
    }
    
    setIsRefining(true);
    try {
      const refined = await refineDescription(currentDesc);
      setCurrentFormListing(prev => ({ ...prev, description: refined }));
    } catch (err) {
      console.error("Refinement failed", err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const photosCount = currentFormListing.photos?.length || 0;
    
    if (photosCount < 8 && !isEditing) {
      alert(`Security Policy: Please upload at least 8 images from different angles to ensure tenant trust. (Current: ${photosCount}/8)`);
      return;
    }

    if (isEditing && currentFormListing.id) {
      setIsSubmitting(true);
      try {
        await onUpdateListing(currentFormListing as Listing);
        setShowForm(false);
      } catch (err) {
        alert("Failed to update property. Check connection.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const newListingData: Omit<listing, 'id'=""> = {
        title: currentFormListing.title || '',
        buildingName: currentFormListing.buildingName || '',
        description: currentFormListing.description || '',
        unitType: currentFormListing.unitType || UnitType.BEDSITTER,
        price: currentFormListing.price || 0,
        // No deposit charges for Airbnb listings
        deposit: currentFormListing.unitType === UnitType.AIRBNB ? 0 : (currentFormListing.deposit || 0),
        pricePeriod: (currentFormListing.unitType === UnitType.AIRBNB ? 'nightly' : 'monthly') as any,
        locationName: currentFormListing.locationName || '',
        coordinates: { lat: -2.71, lng: 37.52 },
        distanceFromTown: 1.2,
        photos: currentFormListing.photos || [],
        isVacant: true,
        landlordId,
        landlordName,
        landlordPhone,
        landlordEmail,
        isVerified: true,
        reviews: [],
        dateListed: new Date().toISOString(),
        hasParking: !!currentFormListing.hasParking,
        isPetsFriendly: !!currentFormListing.isPetsFriendly,
        subscriptionExpiry: currentFormListing.unitType === UnitType.AIRBNB 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };
      
      setPendingListing(newListingData);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async () => {
    if (pendingListing) {
      setIsSubmitting(true);
      try {
        await onCreateListing(pendingListing);
        setShowPayment(false);
        setShowForm(false);
        setPendingListing(null);
        alert("Property successfully activated and live in the marketplace!");
        // Introduce automatic home screen immediately after successful payment
        if (onGoHome) {
          onGoHome();
        }
      } catch (err) {
        console.error("Creation failed", err);
        alert("Payment verified, but property creation failed. Please contact support.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getListingFee = () => {
    if (currentFormListing.unitType === UnitType.AIRBNB) return LISTING_FEE_AIRBNB_MONTHLY;
    if (currentFormListing.unitType === UnitType.BUSINESS_HOUSE) return LISTING_FEE_BUSINESS;
    return LISTING_FEE_STANDARD;
  };

  const listingFee = getListingFee();

  return (
    <div classname="space-y-6 pb-10">
      <div classname="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 classname="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Management</h2>
          <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">Agency Portal</p>
        </div>
        <button onclick="{handleOpenAddForm}" classname="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2 transition-all">
          <i classname="fas fa-plus"></i> New Asset
        </button>
      </div>

      <div classname="grid grid-cols-1 gap-4">
        {landlordListings.length > 0 ? landlordListings.map(l => (
          <div key="{l.id}" classname="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex gap-5 items-center shadow-sm hover:border-blue-200 transition-all group">
            <div classname="relative cursor-pointer flex-shrink-0" onclick="{()" ==""> onViewPublicDetails(l)}>
              <img src="{l.photos[0]}" classname="w-24 h-24 object-cover rounded-3xl group-hover:scale-105 transition-transform" alt=""/>
              <div classname="absolute -top-2 -right-2 bg-blue-600 text-white w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black border-4 border-white dark:border-slate-900 shadow-lg">
                {l.photos.length}
              </div>
            </div>
            <div classname="flex-1 min-w-0">
              <div classname="flex items-center justify-between mb-2">
                <h3 classname="font-black text-slate-800 dark:text-slate-100 truncate text-sm tracking-tight">{l.title}</h3>
                <button onclick="{()" ==""> handleOpenEditForm(l)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <i classname="fas fa-edit text-xs"></i>
                </button>
              </div>
              <p classname="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <i classname="fas fa-calendar-day"></i> {new Date(l.dateListed).toLocaleDateString()}
              </p>
              <div classname="flex items-center gap-3">
                <button onclick="{()" ==""> onUpdateListing({ ...l, isVacant: !l.isVacant })} 
                  className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border transition-all ${l.isVacant ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800 shadow-sm shadow-green-50' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  <i classname="{`fas" ${l.isvacant="" ?="" 'fa-check-circle'="" :="" 'fa-times-circle'}="" mr-1.5`}=""></i>
                  {l.isVacant ? 'Vacant' : 'Occupied'}
                </button>
                <button onclick="{()" ==""> onViewPublicDetails(l)} 
                  className="text-[9px] font-black px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-blue-100 dark:border-blue-800 active:scale-95 transition-all"
                >
                  Reviews ({l.reviews.length})
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div classname="py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <div classname="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 text-2xl">
               <i classname="fas fa-house-chimney-user"></i>
             </div>
             <p classname="text-slate-400 text-[10px] font-black uppercase tracking-widest">No assets listed yet</p>
             <button onclick="{handleOpenAddForm}" classname="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest">Start Management</button>
          </div>
        )}
      </div>

      {showForm && (
        <div classname="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div classname="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-5 overflow-y-auto max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div classname="flex justify-between items-center mb-4">
              <div classname="space-y-1">
                <h3 classname="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{isEditing ? 'Update Property' : 'Launch New Asset'}</h3>
                <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">Property Secure Registration</p>
              </div>
              <button onclick="{()" ==""> setShowForm(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center active:scale-90 transition-transform"><i classname="fas fa-times"></i></button>
            </div>
            
            <form onsubmit="{handleSubmit}" classname="space-y-5">
              <div classname="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div classname="space-y-2">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">Listing Title</label>
                  <input required="" type="text" placeholder="e.g. Modern 2-Bedroom" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-blue-500 font-bold text-sm shadow-inner text-black" value="{currentFormListing.title" ||="" ''}="" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, title: e.target.value})} />
                </div>
                <div classname="space-y-2">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">Building/Asset Name</label>
                  <input required="" type="text" placeholder="e.g. Riverside Apartments" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-blue-500 font-bold text-sm shadow-inner text-black" value="{currentFormListing.buildingName" ||="" ''}="" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, buildingName: e.target.value})} />
                </div>
              </div>

              <div classname="grid grid-cols-2 gap-4">
                <div classname="space-y-2">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">Category</label>
                  <select classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 font-black text-xs uppercase tracking-tight text-black" value="{currentFormListing.unitType}" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, unitType: e.target.value as UnitType})}>
                    {Object.values(UnitType).map(t => <option key="{t}" value="{t}">{t}</option>)}
                  </select>
                </div>
                <div classname="space-y-2">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">Region & Zone</label>
                  <select required="" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 font-black text-xs uppercase tracking-tight text-black" value="{currentFormListing.locationName" ||="" ''}="" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, locationName: e.target.value})}
                  >
                    <option value="" disabled="">Select Location</option>
                    <optgroup label="Kimana Zone">
                      {LOCATIONS_HIERARCHY['Kimana'].map(loc => <option key="{loc}" value="{loc}">{loc}</option>)}
                    </optgroup>
                    <optgroup label="Loitokitok Zone">
                      {LOCATIONS_HIERARCHY['Loitokitok'].map(loc => <option key="{loc}" value="{loc}">{loc}</option>)}
                    </optgroup>
                    <optgroup label="Illasit Zone">
                      {LOCATIONS_HIERARCHY['Illasit'].map(loc => <option key="{loc}" value="{loc}">{loc}</option>)}
                    </optgroup>
                    <optgroup label="Simba Cement Zone">
                      {LOCATIONS_HIERARCHY['Simba Cement'].map(loc => <option key="{loc}" value="{loc}">{loc}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div classname="grid grid-cols-2 gap-4">
                <div classname="space-y-2">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">Pricing (Ksh)</label>
                  <input required="" type="number" placeholder="Price" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 font-black text-sm text-black" value="{currentFormListing.price" ||="" ''}="" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, price: Number(e.target.value)})} />
                </div>
                {/* Airbnb listing does not have deposit charges */}
                {currentFormListing.unitType !== UnitType.AIRBNB && (
                  <div classname="space-y-2">
                    <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-black">Security Deposit</label>
                    <input required="" type="number" placeholder="Deposit" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 font-black text-sm text-black" value="{currentFormListing.deposit" ||="" ''}="" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, deposit: Number(e.target.value)})} />
                  </div>
                )}
              </div>

              <div classname="space-y-3">
                <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Features</label>
                <div classname="flex gap-3">
                  <button type="button" onclick="{()" ==""> setCurrentFormListing({...currentFormListing, hasParking: !currentFormListing.hasParking})}
                    className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${currentFormListing.hasParking ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                  >
                    <i classname="fas fa-car"></i> Parking
                  </button>
                  <button type="button" onclick="{()" ==""> setCurrentFormListing({...currentFormListing, isPetsFriendly: !currentFormListing.isPetsFriendly})}
                    className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${currentFormListing.isPetsFriendly ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                  >
                    <i classname="fas fa-dog"></i> Pets OK
                  </button>
                </div>
              </div>

              <div classname="space-y-2">
                <div classname="flex items-center justify-between px-1">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest text-black">Public Description</label>
                  <button type="button" onclick="{handleRefineWithAI}" disabled="{isRefining}" classname="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full active:scale-95 transition-all">
                    {isRefining ? <i classname="fas fa-circle-notch animate-spin"></i> : <i classname="fas fa-wand-magic-sparkles"></i>}
                    Refine with AI
                  </button>
                </div>
                <textarea required="" rows="{4}" placeholder="Security features, water supply details, house finishings..." classname="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 font-medium text-xs leading-relaxed text-black" value="{currentFormListing.description" ||="" ''}="" onchange="{(e)" ==""> setCurrentFormListing({...currentFormListing, description: e.target.value})}></textarea>
                <p classname="text-[9px] text-slate-400 italic px-2">Use the AI Refiner to make your description more professional and appealing to tenants.</p>
              </div>

              <div classname="space-y-4">
                <div classname="flex items-center justify-between">
                  <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gallery ({currentFormListing.photos?.length || 0}/8 Required)</label>
                  <button type="button" onclick="{()" ==""> fileInputRef.current?.click()}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full"
                  >
                    <i classname="fas fa-cloud-upload-alt"></i> Upload
                  </button>
                </div>
                
                <input type="file" ref="{fileInputRef}" onchange="{handleFileChange}" multiple="" accept="image/*" classname="hidden"/>

                <div classname="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                  {currentFormListing.photos?.map((photo, index) => (
                    <div key="{index}" classname="relative aspect-square w-20 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <img src="{photo}" classname="w-full h-full object-cover" alt=""/>
                      <button type="button" onclick="{()" ==""> removePhoto(index)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center text-[10px] shadow-lg">
                        <i classname="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  {isUploading && (
                    <div classname="aspect-square w-20 flex-shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <i classname="fas fa-circle-notch animate-spin text-blue-600"></i>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled="{isSubmitting}" classname="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 dark:shadow-none uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <i classname="fas fa-circle-notch animate-spin"></i> : (isEditing ? 'Sync Changes' : `Secure Launch (Ksh ${listingFee})`)}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPayment && (
        <paymentmodal onclose="{()" ==""> { setShowPayment(false); setPendingListing(null); }} 
          onSuccess={handlePaymentSuccess} 
          title="Security Activation" 
          amount={listingFee} 
          subtitle={`Activating Asset: ${pendingListing?.title}`} 
        />
      )}
    </div>
  );
};

export default LandlordDashboard;
