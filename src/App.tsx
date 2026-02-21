
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
  const [filterType, setFilterType] = useState<unittype |="" 'all'="">('All');
  const [listings, setListings] = useState<listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [exploringTown, setExploringTown] = useState<'Kimana' | 'Loitokitok' | 'Illasit' | 'Simba Cement' | null>(null);
  const [vacantOnly, setVacantOnly] = useState(false);
  const [globalLogo, setGlobalLogo] = useState<string |="" null="">(null);

  // Theme and Language State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [language, setLanguage] = useState<locale>(() => (localStorage.getItem('language') as Locale) || 'EN');

  useEffect(() => {
    const cachedLogo = localStorage.getItem('global_logo');
    if (cachedLogo) setGlobalLogo(cachedLogo);
  }, []);

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
      
      const settings = await FirebaseService.getGlobalSettings();
      if (settings?.logoUrl) {
        setGlobalLogo(settings.logoUrl);
        localStorage.setItem('global_logo', settings.logoUrl);
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
        const profile = await FirebaseService.getUserByPhone(firebaseUser.email || firebaseUser.uid);
        if (profile) {
          setCurrentUser({ 
            ...profile, 
            favorites: profile.favorites || [],
            savedSearches: profile.savedSearches || []
          });
        } else {
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            phone: "",
            role: UserRole.TENANT,
            unlockedListings: [],
            favorites: [],
            savedSearches: [],
            isEncrypted: true
          });
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
                          l.unitType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.buildingName && l.buildingName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'All' || l.unitType === filterType;
    const matchesVacant = !vacantOnly || l.isVacant;
    return matchesSearch && matchesType && matchesVacant;
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
      } catch (error) {}
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
      <div classname="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <i classname="fas fa-circle-notch animate-spin text-blue-600 text-3xl mb-4"></i>
        <p classname="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <authflow onauthenticated="{handleAuthenticated}" logourl="{globalLogo}"/>;
  }

  const renderHomeContent = () => {
    if (isLoading) {
      return (
        <div classname="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <i classname="fas fa-circle-notch animate-spin text-3xl"></i>
          <p classname="text-[10px] font-black uppercase tracking-widest">Updating Market View...</p>
        </div>
      );
    }

    if (searchQuery || filterType !== 'All') {
      return (
        <div classname="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
          <div classname="flex items-center justify-between px-1">
            <h3 classname="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {searchQuery ? `Filtering by "${searchQuery}"` : `${filterType} Units`}
            </h3>
            <button onclick={() => {setSearchQuery(''); setFilterType('All');}} 
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
            >
              Clear All
            </button>
          </div>
          <div classname="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredListings.map(listing => (
              <listingcard key="{listing.id}" listing="{listing}" onclick="{()" ==""> setSelectedListing(listing)} />
            ))}
            {filteredListings.length === 0 && (
              <div classname="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <i classname="fas fa-house-circle-exclamation text-4xl text-slate-200 mb-3"></i>
                <p classname="text-slate-500 font-medium">No matches in this area.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div classname="space-y-10 animate-in fade-in duration-700">
        {/* Welcome Greeting */}
        <div classname="mb-2">
          <h2 classname="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Karibu Masqani</h2>
          <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Finding Your perfect place wherever you are</p>
        </div>

        <section classname="space-y-4">
          <div classname="flex items-center justify-between">
            <div>
              <h2 classname="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <i classname="fas fa-shop text-blue-600"></i> {t('bizSpace')}
              </h2>
              <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">Premium Business Stalls</p>
            </div>
            <button onclick={() => setFilterType(UnitType.BUSINESS_HOUSE)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 dark:border-blue-900 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 shadow-sm">{t('viewAll')}</button>
          </div>
          <div classname="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
            {businessListings.map(l => (
              <listingcard key="{l.id}" listing="{l}" variant="horizontal" onclick="{()" ==""> setSelectedListing(l)} />
            ))}
          </div>
        </section>

        <section classname="space-y-4">
          <div classname="flex items-center justify-between">
            <div>
              <h2 classname="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <i classname="fas fa-bed text-blue-600"></i> {t('topResidencies')}
              </h2>
              <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">Houses & Airbnb Units</p>
            </div>
            <button onclick="{()" ==""> setFilterType('All')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 dark:border-blue-900 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 shadow-sm">{t('viewAll')}</button>
          </div>
          <div classname="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
            {residentialListings.map(l => (
              <listingcard key="{l.id}" listing="{l}" variant="horizontal" onclick="{()" ==""> setSelectedListing(l)} />
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderExploreContent = () => {
    if (exploringTown) {
      const townAreas = LOCATIONS_HIERARCHY[exploringTown];
      return (
        <div classname="space-y-6 animate-in slide-in-from-right duration-500">
          <div classname="flex items-center gap-4 mb-2">
            <button onclick={() => setExploringTown(null)}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-90 transition-transform shadow-sm"
            >
              <i classname="fas fa-arrow-left"></i>
            </button>
            <div>
              <h2 classname="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Explore {exploringTown}</h2>
              <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select sub-neighborhood</p>
            </div>
          </div>
          
          <div classname="grid grid-cols-1 gap-2">
            {townAreas.map(area => (
              <button key="{area}" onclick={() => handleSelectExploreArea(area)}
                className="w-full p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm group"
              >
                <div classname="flex items-center gap-4">
                  <div classname="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-active:bg-blue-600 group-active:text-white transition-colors">
                    <i classname="fas fa-map-pin"></i>
                  </div>
                  <p classname="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{area}</p>
                </div>
                <i classname="fas fa-chevron-right text-slate-200 group-hover:text-blue-400 transition-colors"></i>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div classname="space-y-6 animate-in fade-in duration-500">
        <div classname="space-y-1">
          <h2 classname="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Market Regions</h2>
          <p classname="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select target town to begin</p>
        </div>
        
        <div classname="grid grid-cols-1 gap-4">
          <button onclick={() => setExploringTown('Kimana')}
            className="relative overflow-hidden group h-40 rounded-[2.5rem] bg-blue-600 shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-left"
          >
            <div classname="absolute inset-0 bg-[url(&#39;https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&amp;w=2070&amp;auto=format&amp;fit=crop&#39;)] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
            <div classname="relative h-full p-8 flex flex-col justify-between">
              <div classname="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-xl">
                <i classname="fas fa-mountain"></i>
              </div>
              <div>
                <h3 classname="text-2xl font-black text-white tracking-tight">Kimana Zone</h3>
                <p classname="text-[10px] text-white/80 font-black uppercase tracking-[0.2em]">{LOCATIONS_HIERARCHY['Kimana'].length} Sub-areas</p>
              </div>
            </div>
          </button>

          <button onclick="{()" ==""> setExploringTown('Loitokitok')}
            className="relative overflow-hidden group h-40 rounded-[2.5rem] bg-slate-800 shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 transition-all text-left"
          >
            <div classname="absolute inset-0 bg-[url(&#39;https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&amp;w=2073&amp;auto=format&amp;fit=crop&#39;)] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
            <div classname="relative h-full p-8 flex flex-col justify-between">
              <div classname="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-xl">
                <i classname="fas fa-cloud-sun"></i>
              </div>
              <div>
                <h3 classname="text-2xl font-black text-white tracking-tight">Loitokitok Zone</h3>
                <p classname="text-[10px] text-white/80 font-black uppercase tracking-[0.2em]">{LOCATIONS_HIERARCHY['Loitokitok'].length} Neighborhoods</p>
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
        <settings currentuser="{currentUser}" onlogout="{handleLogout}" onupdateuser="{setCurrentUser}" isdarkmode="{isDarkMode}" setisdarkmode="{setIsDarkMode}" language="{language}" setlanguage="{setLanguage}" t="{t}"/>
      );
    }

    if (activeTab === 'search') {
      return renderExploreContent();
    }

    if (currentUser.role === UserRole.LANDLORD) {
      return (
        <landlorddashboard listings="{listings}" onupdatelisting="{async" (l)=""> {
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
        <listingdetail listing="{selectedListing}" onback="{()" ==""> setSelectedListing(null)} 
          onUnlock={() => setIsPaymentModalOpen(true)}
          isUnlocked={currentUser.unlockedListings.includes(selectedListing.id)}
          currentUser={currentUser}
          onAddReview={handleAddReview}
        />
      );
    }

    return (
      <div classname="space-y-6">
        <div classname="space-y-3">
          <div classname="relative">
            <i classname="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="{t(&#39;searchPlaceholder&#39;)}" classname="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none shadow-sm dark:text-white font-medium text-black" value="{searchQuery}" onchange="{(e)" ==""> setSearchQuery(e.target.value)}
            />
          </div>
          <filters activetype="{filterType}" onselect="{setFilterType}" vacantonly="{vacantOnly}" ontogglevacant="{()" ==""> setVacantOnly(!vacantOnly)} />
        </div>
        {renderHomeContent()}
      </div>
    );
  };

  const unlockFee = selectedListing?.unitType === UnitType.AIRBNB ? UNLOCK_FEE_AIRBNB : 
                  (selectedListing?.unitType === UnitType.BUSINESS_HOUSE ? UNLOCK_FEE_BUSINESS : UNLOCK_FEE_STANDARD);

  return (
    <div classname="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors">
      <header classname="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div classname="flex items-center gap-3">
          <div classname="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden">
            {globalLogo ? (
              <img src="{globalLogo}" alt="Logo" classname="w-full h-full object-cover"/>
            ) : (
              <i classname="fas fa-house-chimney"></i>
            )}
          </div>
          <h1 classname="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Masqani Poa</h1>
        </div>
        <button onclick="{()" ==""> {setActiveTab('profile'); setSelectedListing(null);}} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 overflow-hidden">
           {currentUser.name ? <span classname="text-[10px] font-black">{currentUser.name.substring(0,1)}</span> : <i classname="fas fa-user-circle"></i>}
        </button>
      </header>

      <main classname="px-4 py-4 max-w-2xl mx-auto min-h-[calc(100vh-140px)]">
        {renderMainContent()}
      </main>

      <nav classname="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-8 py-3 flex justify-around items-center border-t border-slate-100 dark:border-slate-800 safe-area-inset-bottom">
        <button onclick="{()" ==""> {setActiveTab('home'); setSelectedListing(null);}} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i classname="fas fa-home text-lg"></i>
          <span classname="text-[9px] font-black uppercase tracking-tighter">{t('market')}</span>
        </button>
        <button onclick="{()" ==""> {setActiveTab('search'); setSelectedListing(null);}} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i classname="fas fa-map-marked-alt text-lg"></i>
          <span classname="text-[9px] font-black uppercase tracking-tighter">{t('explore')}</span>
        </button>
        <button onclick="{()" ==""> {setActiveTab('listings'); setSelectedListing(null);}} className={`flex flex-col items-center gap-1 ${activeTab === 'listings' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i classname="fas fa-heart text-lg"></i>
          <span classname="text-[9px] font-black uppercase tracking-tighter">{t('saved')}</span>
        </button>
        <button onclick="{()" ==""> {setActiveTab('profile'); setSelectedListing(null);}} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
          <i classname="fas fa-cog text-lg"></i>
          <span classname="text-[9px] font-black uppercase tracking-tighter">{t('account')}</span>
        </button>
      </nav>

      {isPaymentModalOpen && (
        <paymentmodal onclose="{()" ==""> setIsPaymentModalOpen(false)} 
          onSuccess={() => {
            if (currentUser && selectedListing) {
              FirebaseService.unlockListingForUser(currentUser.email, selectedListing.id).then(() => {
                setCurrentUser({
                  ...currentUser,
                  unlockedListings: [...currentUser.unlockedListings, selectedListing.id]
                });
                
                // Show details before reverting
                alert(`Unlock Successful!\n\nBuilding: ${selectedListing.buildingName || 'N/A'}\nLandlord: ${selectedListing.landlordName}\nPhone: ${selectedListing.landlordPhone}`);
                
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

      {isSupportModalOpen && <contactsupportmodal onclose="{()" ==""> setIsSupportModalOpen(false)} />}
    </div>
  );
};

export default App;
