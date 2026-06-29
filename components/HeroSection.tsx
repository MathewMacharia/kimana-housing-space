
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [pillTab, setPillTab] = useState<'find' | 'list'>('find');
  const [searchInput, setSearchInput] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pillTab === 'find') {
      onSearch(searchInput);
      navigate(`/rent?q=${encodeURIComponent(searchInput)}&type=${propertyType}`);
    } else {
      navigate('/sell');
    }
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* Background image with parallax-style overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: `url('/kilimanjaro.jpg')`,
        }}
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent" />

      {/* Floating particles / ambient dots */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-white/90 uppercase tracking-widest">Kajiado South's #1 Property Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4">
          Find Your Perfect
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Space in Kajiado
          </span>
        </h1>
        <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Rent, buy, or lease property across Kimana, Loitokitok, Illasit and beyond.
        </p>

        {/* Pill Modal Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-1.5 max-w-2xl mx-auto shadow-2xl">
          {/* Pill Tabs */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-4">
            <button
              id="hero-find-tab"
              onClick={() => setPillTab('find')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                pillTab === 'find'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <i className="fas fa-search mr-2 text-xs" />
              Find a Home
            </button>
            <button
              id="hero-list-tab"
              onClick={() => setPillTab('list')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                pillTab === 'list'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <i className="fas fa-plus-circle mr-2 text-xs" />
              List Property
            </button>
          </div>

          {/* Tab Content */}
          {pillTab === 'find' ? (
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 p-2">
              <div className="flex-1 relative">
                <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  id="hero-search-input"
                  type="text"
                  placeholder="Search by location, property type..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none font-medium shadow-sm"
                />
              </div>
              <select
                id="hero-type-filter"
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="sm:w-44 px-4 py-3.5 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-800 outline-none font-medium shadow-sm cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="bnb">B&B / Short Stay</option>
                <option value="farmland">Farmland</option>
                <option value="land">Land for Sale</option>
                <option value="property">Property for Sale</option>
              </select>
              <button
                id="hero-search-btn"
                type="submit"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/30"
              >
                <i className="fas fa-search mr-1.5" />
                Search
              </button>
            </form>
          ) : (
            <div className="p-4 text-center">
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                List your property and reach thousands of verified buyers and tenants across Kajiado South. Fast, simple, and affordable.
              </p>
              <button
                id="hero-list-cta"
                onClick={() => navigate('/sell')}
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                <i className="fas fa-arrow-right mr-2" />
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mt-10">
          {[
            { value: '500+', label: 'Listings' },
            { value: '4 Towns', label: 'Covered' },
            { value: '1,200+', label: 'Happy Tenants' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="rgb(248 250 252)" className="dark:fill-slate-950" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
