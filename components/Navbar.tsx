
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  globalLogo: string | null;
  onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, globalLogo, onProfileClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: 'Rent', to: '/rent' },
    { label: 'Buy', to: '/buy' },
    { label: 'Sell', to: '/sell' },
  ];

  const activeClass = 'text-blue-600 font-black';
  const inactiveClass = 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            <img src={globalLogo || '/logo.png'} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight hidden sm:block">
            Masqani Poa
          </span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-semibold ${isActive ? activeClass : inactiveClass}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Download App CTA */}
          <a
            href="#download"
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-full uppercase tracking-widest hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-download text-[10px]" />
            Get App
          </a>

          {/* User Icon */}
          <button
            id="navbar-profile-btn"
            onClick={onProfileClick}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all overflow-hidden"
            aria-label="User profile"
          >
            {currentUser?.name
              ? <span className="text-[10px] font-black">{currentUser.name.substring(0, 1).toUpperCase()}</span>
              : <i className="fas fa-user text-sm" />
            }
          </button>

          {/* Mobile Hamburger */}
          <button
            id="navbar-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            aria-label="Open menu"
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-sm`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-1 animate-in slide-in-from-top duration-200">
          <NavLink to="/" onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `block px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
          >
            <i className="fas fa-home w-5 mr-2" />Home
          </NavLink>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-sm font-semibold ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'}`
              }
            >
              {item.label === 'Rent' && <i className="fas fa-key w-5 mr-2" />}
              {item.label === 'Buy' && <i className="fas fa-home w-5 mr-2" />}
              {item.label === 'Sell' && <i className="fas fa-tag w-5 mr-2" />}
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => { onProfileClick(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <i className="fas fa-user w-5 mr-2" />
              {currentUser ? currentUser.name : 'Login / Sign Up'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
