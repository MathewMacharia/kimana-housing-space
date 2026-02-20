import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Listing, UnitType, Review, SavedSearch } from './types';
import { UNLOCK_FEE_STANDARD, UNLOCK_FEE_AIRBNB, UNLOCK_FEE_BUSINESS, MOCK_LISTINGS, LOCATIONS_HIERARCHY } from './constants';
import ListingCard from './components/ListingCard';
import ListingDetail from './components/ListingDetail';
import LandlordDashboard from './components/LandlordDashboard';
import Filters from './components/Filters';
import PaymentModal from './components/PaymentModal';
import AuthFlow from './components/AuthFlow';
import Settings from './components/Settings';
import ContactSupportModal from './components/ContactSupportModal';
import { FirebaseService } from './services/db';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { TRANSLATIONS, Locale } from './translations';

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
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [exploringTown, setExploringTown] = useState<'Kimana' | 'Loitokitok' | null>(null);

  // Theme and Language State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [language, setLanguage] = useState<Locale>(() => (localStorage.getItem('language') as Locale) || 'EN');

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedListings = await FirebaseService.getListings();
      if (fetchedListings && fetchedListings.length > 0) {
        setListings(fetchedListings);
        setIsOfflineMode(false);
      } else {
        setListings(MOCK_LISTINGS);
        setIsOfflineMode(true);
      }
    } catch (error: any) {
      setListings(MOCK_LISTINGS);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await FirebaseService.getUserProfile(firebaseUser.email || firebaseUser.uid);
        if (profile) {
          setCurrentUser({
            ...profile,
            favorites: profile.favorites || [],
            savedSearches: profile.savedSearches || []
          });
        } else {
          // If no profile found in either landlords or tenants collection, 
          // we force them back to AuthFlow to complete registration or selection
          setCurrentUser(null);
          auth.signOut();
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthChecking) {
      loadData();
    }
  }, [currentUser, isAuthChecking, loadData]);

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.unitType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || l.unitType === filterType;
    return matchesSearch && matchesType;
  });

  const businessListings = listings.filter(l => l.unitType === UnitType.BUSINESS_HOUSE);
  const residentialListings = listings.filter(l => l.unitType !== UnitType.BUSINESS_HOUSE);

  const handleAuthenticated = (user: User) => setCurrentUser(user);
  const handleLogout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setSelectedListing(null);
    setActiveTab('home');
  };

  const handleAddReview = async (review: Review) => {
    if (selectedListing) {
      const updatedListing = { ...selectedListing, reviews: [...selectedListing.reviews, review] };
      setListings(prev => prev.map(l => l.id === selectedListing.id ? updatedListing : l));
      setSelectedListing(updatedListing);
      try {
        await FirebaseService.updateListing(selectedListing.id, { reviews: updatedListing.reviews });
      } catch (error) { }
    }
  };

  const handleSelectExploreArea = (area: string) => {
    setSearchQuery(area);
    setFilterType('All');
    setActiveTab('home');
    setExploringTown(null); // Reset drill-down for next time
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <i className="fas fa-circle-notch animate-spin text-blue-600 text-3xl mb-4"></i>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthFlow onAuthenticated={handleAuthenticated} />;
  }

  const renderHomeContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <i className="fas fa-circle-notch animate-spin text-3xl"></i>
          <p className="text-[10px] font-black uppercase tracking-widest">Updating Market View...</p>
        </div>
      );
    }

    if (searchQuery || filterType !== 'All') {
      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {searchQuery ? `Filtering by "${searchQuery}"` : `${filterType} Units`}
            </h3>
            <button
              onClick={() => { setSearchQuery(''); setFilterType('All'); }}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
            ))}
            {filteredListings.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <i className="fas fa-house-circle-exclamation text-4xl text-slate-200 mb-3"></i>
                <p className="text-slate-500 font-medium">No matches in this area.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Welcome Greeting */}
        <div className="mb-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Karibu Masqani</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Finding your perfect home in Kimana</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
          ))}
          {filteredListings.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <i className="fas fa-house-circle-exclamation text-4xl text-slate-200 mb-3"></i>
              <p className="text-slate-500 font-medium">No listings available here.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExploreContent = () => {
    if (exploringTown) {
      const townAreas = LOCATIONS_HIERARCHY[exploringTown];
      return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setExploringTown(null)}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-90 transition-transform shadow-sm"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Explore {exploringTown}</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select sub-neighborhood</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {townAreas.map(area => (
              <button
                key={area}
                onClick={() => handleSelectExploreArea(area)}
                className="w-full p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-active:bg-blue-600 group-active:text-white transition-colors">
                    <i className="fas fa-map-pin"></i>
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{area}</p>
                </div>
                <i className="fas fa-chevron-right text-slate-200 group-hover:text-blue-400 transition-colors"></i>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Market Regions</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select target town to begin</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setExploringTown('Kimana')}
            className="relative overflow-hidden group h-40 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-left"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
            <div className="relative h-full p-8 flex flex-col justify-between">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-xl">
                <i className="fas fa-mountain"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Kimana Zone</h3>
                <p className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em]">{LOCATIONS_HIERARCHY['Kimana'].length} Sub-areas</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setExploringTown('Loitokitok')}
            className="relative overflow-hidden group h-40 rounded-[2.5rem] bg-slate-800 shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 transition-all text-left"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
            <div className="relative h-full p-8 flex flex-col justify-between">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-xl">
                <i className="fas fa-cloud-sun"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Loitokitok Zone</h3>
                <p className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em]">{LOCATIONS_HIERARCHY['Loitokitok'].length} Neighborhoods</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (activeTab === 'profile') {
      return (
        <Settings
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateUser={setCurrentUser}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          language={language}
          setLanguage={setLanguage}
          t={t}
        />
      );
    }

    if (activeTab === 'search') {
      return renderExploreContent();
    }

    if (currentUser.role === UserRole.LANDLORD) {
      return (
        <LandlordDashboard
          listings={listings}
          onUpdateListing={async (l) => {
            // Handle state update locally
            setListings(prev => prev.map(x => x.id === l.id ? l : x));
            // Handle persistence
            try {
              await FirebaseService.updateListing(l.id, l);
            } catch (e) {
              console.error("Failed to update listing on firestore", e);
            }
          }}
          onCreateListing={async (l) => {
            const id = await FirebaseService.createListing(l);
            setListings(prev => [...prev, { ...l, id }]);
            return id;
          }}
          landlordId={currentUser.id}
          landlordName={currentUser.name}
          landlordPhone={currentUser.phone}
          landlordEmail={currentUser.email}
          onViewPublicDetails={setSelectedListing}
          onGoHome={() => { setActiveTab('home'); setSelectedListing(null); }}
        />
      );
    }

    if (selectedListing) {
      return (
        <ListingDetail
          listing={selectedListing}
          onBack={() => setSelectedListing(null)}
          onUnlock={() => setIsPaymentModalOpen(true)}
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
              placeholder={t('searchPlaceholder')}
              className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none shadow-sm dark:text-white font-medium"
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
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-house-chimney"></i>
          </div>
          <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Masqani Poa</h1>
        </div>
        <button onClick={() => { setActiveTab('profile'); setSelectedListing(null); }} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 overflow-hidden">
          {currentUser.name ? <span className="text-[10px] font-black">{currentUser.name.substring(0, 1)}</span> : <i className="fas fa-user-circle"></i>}
        </button>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto min-h-[calc(100vh-140px)]">
        {renderMainContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-8 py-3 flex justify-around items-center border-t border-slate-100 dark:border-slate-800 safe-area-inset-bottom">
        <button onClick={() => { setActiveTab('home'); setSelectedListing(null); }} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i className="fas fa-home text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">{t('market')}</span>
        </button>
        <button onClick={() => { setActiveTab('search'); setSelectedListing(null); }} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i className="fas fa-map-marked-alt text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">{t('explore')}</span>
        </button>
        <button onClick={() => { setActiveTab('listings'); setSelectedListing(null); }} className={`flex flex-col items-center gap-1 ${activeTab === 'listings' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i className="fas fa-heart text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">{t('saved')}</span>
        </button>
        <button onClick={() => { setActiveTab('profile'); setSelectedListing(null); }} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i className="fas fa-cog text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-tighter">{t('account')}</span>
        </button>
      </nav>

      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            if (currentUser && selectedListing) {
              FirebaseService.unlockListingForUser(currentUser.email, selectedListing.id).then(() => {
                setCurrentUser({
                  ...currentUser,
                  unlockedListings: [...currentUser.unlockedListings, selectedListing.id]
                });
                setIsPaymentModalOpen(false);
                // Automatic Home Screen after unlock
                setActiveTab('home');
                setSelectedListing(null);
              });
            }
          }}
          title="Secure Unlock"
          amount={unlockFee}
          subtitle={`Revealing Contact: ${selectedListing?.title}`}
        />
      )}

      {isSupportModalOpen && <ContactSupportModal onClose={() => setIsSupportModalOpen(false)} />}
    </div>
  );
};

export default App;
