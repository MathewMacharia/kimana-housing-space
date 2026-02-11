
import React, { useState, useEffect } from 'react';
import { User, UserRole, Listing, UnitType, Review } from './types';
import { UNLOCK_FEE_STANDARD, UNLOCK_FEE_AIRBNB, UNLOCK_FEE_BUSINESS } from './constants';
import ListingCard from './components/ListingCard';
import ListingDetail from './components/ListingDetail';
import LandlordDashboard from './components/LandlordDashboard';
import Filters from './components/Filters';
import PaymentModal from './components/PaymentModal';
import AuthFlow from './components/AuthFlow';
import Settings from './components/Settings';
import ContactSupportModal from './components/ContactSupportModal';
import { FirebaseService } from './services/db';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'listings' | 'profile'>('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<UnitType | 'All'>('All');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedListings = await FirebaseService.getListings();
        setListings(fetchedListings);
      } catch (error) {
        console.error("Cloud connection failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.unitType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || l.unitType === filterType;
    
    if (l.unitType === UnitType.AIRBNB && l.subscriptionExpiry) {
      const isExpired = new Date(l.subscriptionExpiry) < new Date();
      if (isExpired && currentUser?.role === UserRole.TENANT) return false;
    }
    
    return matchesSearch && matchesType;
  });

  const businessListings = listings.filter(l => l.unitType === UnitType.BUSINESS_HOUSE);
  const residentialListings = listings.filter(l => l.unitType !== UnitType.BUSINESS_HOUSE);

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedListing(null);
    setActiveTab('home');
  };

  const handleUnlockContact = (listing: Listing) => {
    if (!currentUser) return;
    setSelectedListing(listing);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (currentUser && selectedListing) {
      await FirebaseService.unlockListingForUser(currentUser.phone, selectedListing.id);
      const updatedUser = await FirebaseService.getUserByPhone(currentUser.phone);
      if (updatedUser) setCurrentUser(updatedUser);
      setIsPaymentModalOpen(false);
    }
  };

  const handleUpdateListing = async (updatedListing: Listing) => {
    await FirebaseService.updateListing(updatedListing.id, updatedListing);
    setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
  };

  const handleAddReview = async (review: Review) => {
    if (selectedListing) {
      const updatedListing = {
        ...selectedListing,
        reviews: [...selectedListing.reviews, review]
      };
      await FirebaseService.updateListing(selectedListing.id, { reviews: updatedListing.reviews });
      setListings(prev => prev.map(l => l.id === selectedListing.id ? updatedListing : l));
      setSelectedListing(updatedListing);
    }
  };

  const handleViewAllCategory = (type: UnitType | 'All') => {
    setFilterType(type);
    setSearchQuery('');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentUser) {
    return <AuthFlow onAuthenticated={handleAuthenticated} />;
  }

  const renderHomeContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <i className="fas fa-circle-notch animate-spin text-3xl"></i>
          <p className="text-[10px] font-black uppercase tracking-widest">Connecting to Registry...</p>
        </div>
      );
    }

    if (searchQuery || filterType !== 'All') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="col-span-full flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              {filterType !== 'All' ? `${filterType}s` : 'Search Results'}
            </h3>
            <button 
              onClick={() => handleViewAllCategory('All')}
              className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full active:scale-90 transition-transform"
            >
              Clear Filters
            </button>
          </div>
          {filteredListings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onClick={() => setSelectedListing(listing)}
            />
          ))}
          {filteredListings.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <i className="fas fa-house-circle-exclamation text-4xl text-slate-200 mb-3"></i>
              <p className="text-slate-500">No matches in Kimana.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <i className="fas fa-shop text-blue-600"></i> Nyumba ya Biashara
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Premium Business Stalls</p>
            </div>
            <button 
              onClick={() => handleViewAllCategory(UnitType.BUSINESS_HOUSE)}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 px-3 py-1.5 rounded-full bg-blue-50 active:scale-90 transition-all shadow-sm"
            >
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
            {businessListings.map(l => (
              <ListingCard 
                key={l.id} 
                listing={l} 
                variant="horizontal" 
                onClick={() => setSelectedListing(l)}
              />
            ))}
            {businessListings.length === 0 && <div className="p-10 text-slate-300 text-[10px] font-black uppercase tracking-widest">No listings found</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <i className="fas fa-bed text-blue-600"></i> Top Residencies
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Houses & Airbnb Units</p>
            </div>
            <button 
              onClick={() => handleViewAllCategory('All')}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 px-3 py-1.5 rounded-full bg-blue-50 active:scale-90 transition-all shadow-sm"
            >
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
            {residentialListings.map(l => (
              <ListingCard 
                key={l.id} 
                listing={l} 
                variant="horizontal" 
                onClick={() => setSelectedListing(l)}
              />
            ))}
             {residentialListings.length === 0 && <div className="p-10 text-slate-300 text-[10px] font-black uppercase tracking-widest">No listings found</div>}
          </div>
        </section>
      </div>
    );
  };

  const renderMainContent = () => {
    if (activeTab === 'profile') {
      return <Settings currentUser={currentUser} onLogout={handleLogout} onUpdateUser={handleAuthenticated} />;
    }

    if (currentUser.role === UserRole.LANDLORD) {
      return (
        <div className="space-y-6">
          {selectedListing ? (
            <ListingDetail 
              listing={selectedListing} 
              onBack={() => setSelectedListing(null)} 
              onUnlock={() => handleUnlockContact(selectedListing)}
              isUnlocked={currentUser.unlockedListings.includes(selectedListing.id)}
              currentUser={currentUser}
              onAddReview={handleAddReview}
            />
          ) : (
            <LandlordDashboard 
              listings={listings} 
              setListings={setListings}
              onUpdateListing={handleUpdateListing}
              landlordId={currentUser.id}
              landlordName={currentUser.name}
              landlordPhone={currentUser.phone}
              landlordEmail={currentUser.email}
              onViewPublicDetails={setSelectedListing}
            />
          )}
        </div>
      );
    }

    if (selectedListing) {
      return (
        <ListingDetail 
          listing={selectedListing} 
          onBack={() => setSelectedListing(null)} 
          onUnlock={() => handleUnlockContact(selectedListing)}
          isUnlocked={currentUser.unlockedListings.includes(selectedListing.id)}
          currentUser={currentUser}
          onAddReview={handleAddReview}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search by area or unit type..." 
              className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Filters activeType={filterType} onSelect={setFilterType} />
        </div>

        {renderHomeContent()}
      </div>
    );
  };

  const unlockFee = selectedListing?.unitType === UnitType.AIRBNB ? UNLOCK_FEE_AIRBNB : 
                  (selectedListing?.unitType === UnitType.BUSINESS_HOUSE ? UNLOCK_FEE_BUSINESS : UNLOCK_FEE_STANDARD);

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-100">
            <i className="fas fa-house-chimney"></i>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight">Kimana Space</h1>
            <p className="text-[9px] text-green-600 font-bold flex items-center gap-1 uppercase tracking-widest">
              <i className="fas fa-shield-alt text-[7px]"></i> Verified Marketplace
            </p>
          </div>
        </div>
        <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
           <i className="fas fa-user-circle"></i>
        </button>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {renderMainContent()}
      </main>

      <button 
        onClick={() => setIsSupportModalOpen(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl z-40 active:scale-90 transition-all group"
      >
        <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20"></div>
        <i className="fas fa-headset group-hover:rotate-12 transition-transform"></i>
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur px-8 py-3 flex justify-around items-center border-t border-slate-100 safe-area-inset-bottom">
        <button 
          onClick={() => {setActiveTab('home'); setSelectedListing(null)}}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Market</span>
        </button>
        <button 
          onClick={() => {setActiveTab('search'); setSelectedListing(null)}}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'search' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <i className="fas fa-map-marked-alt text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Explore</span>
        </button>
        <button 
          onClick={() => {setActiveTab('listings'); setSelectedListing(null)}}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'listings' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <i className="fas fa-heart text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Favorites</span>
        </button>
        <button 
          onClick={() => {setActiveTab('profile'); setSelectedListing(null)}}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <i className="fas fa-cog text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">Account</span>
        </button>
      </nav>

      {isPaymentModalOpen && (
        <PaymentModal 
          onClose={() => setIsPaymentModalOpen(false)} 
          onSuccess={handlePaymentSuccess}
          title="Secure Unlock"
          amount={unlockFee}
          subtitle={`Revealing Contact: ${selectedListing?.title}`}
        />
      )}

      {isSupportModalOpen && (
        <ContactSupportModal 
          onClose={() => setIsSupportModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
