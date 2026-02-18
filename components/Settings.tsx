
import React, { useState } from 'react';
import { User, UserRole, UnitType } from '../types';
import { FirebaseService } from '../services/db';
import { Locale } from '../translations';

interface SettingsProps {
  currentUser: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  language: Locale;
  setLanguage: (val: Locale) => void;
  t: (key: string) => string;
}

const SettingRow: React.FC<{ 
  icon: string; 
  label: string; 
  sublabel?: string; 
  action?: React.ReactNode; 
  color?: string; 
  onClick?: () => void;
}> = ({ icon, label, sublabel, action, color = 'blue', onClick }) => (
  <div 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2 shadow-sm transition-all text-left ${onClick ? 'active:bg-slate-50 dark:active:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
        {sublabel && <p className="text-[10px] text-slate-400 font-medium truncate">{sublabel}</p>}
      </div>
    </div>
    <div onClick={(e) => e.stopPropagation()}>{action ? action : (onClick ? <i className="fas fa-chevron-right text-slate-300 text-xs"></i> : null)}</div>
  </div>
);

const SectionTitle: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3 mt-6">
    {children}
  </h3>
);

const Settings: React.FC<SettingsProps> = ({ 
  currentUser, onLogout, onUpdateUser, isDarkMode, setIsDarkMode, language, setLanguage, t 
}) => {
  const [activeModule, setActiveModule] = useState<'main' | 'personal' | 'security' | 'preferences'>('main');

  const handleToggleRole = async () => {
    // Tenants cannot switch to landlord view according to strict rules.
    if (currentUser.role === UserRole.TENANT) {
      alert("Tenants are restricted from switching to Landlord View. Please contact support to upgrade your account.");
      return;
    }

    const newRole = currentUser.role === UserRole.LANDLORD ? UserRole.TENANT : UserRole.LANDLORD;
    if (window.confirm(t(newRole === UserRole.LANDLORD ? 'switchRole' : 'switchRoleTenant'))) {
      const updatedUser = { ...currentUser, role: newRole };
      await FirebaseService.saveUserProfile(updatedUser);
      onUpdateUser(updatedUser);
    }
  };

  const LANGUAGES: Locale[] = ['EN', 'SW', 'ZH', 'FR', 'ES', 'DE'];

  if (activeModule !== 'main') {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button onClick={() => setActiveModule('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
           <i className="fas fa-arrow-left"></i> Back to settings
        </button>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-400 italic">Form placeholder for {activeModule} module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500 pb-10">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-100 dark:shadow-blue-900/20 relative">
          <i className={`fas ${currentUser.role === UserRole.LANDLORD ? 'fa-user-tie' : 'fa-user'}`}></i>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-950"></div>
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-4 tracking-tight">{currentUser.name}</h2>
        <p className="text-xs text-slate-500 font-medium">{currentUser.phone} • {currentUser.role === UserRole.LANDLORD ? 'Agent/Landlord' : 'Tenant Account'}</p>
      </div>

      <SectionTitle>{t('settings')}</SectionTitle>
      <SettingRow 
        icon="fa-id-card" 
        label={t('personalDetails')} 
        sublabel="Name, Phone, Email" 
        onClick={() => setActiveModule('personal')}
      />
      <SettingRow 
        icon="fa-key" 
        label={t('security')} 
        sublabel="Update PIN & Password" 
        onClick={() => setActiveModule('security')}
      />

      {currentUser.role === UserRole.LANDLORD && (
        <>
          <SectionTitle>Account Control</SectionTitle>
          <SettingRow 
            icon="fa-user" 
            label={t('switchRoleTenant')} 
            color="amber"
            onClick={handleToggleRole}
          />
        </>
      )}

      <SectionTitle>App Configuration</SectionTitle>
      <SettingRow 
        icon="fa-language" 
        label={t('language')} 
        action={
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-[150px]">
            {LANGUAGES.map(lang => (
              <button 
                key={lang}
                onClick={() => setLanguage(lang)} 
                className={`px-2 py-1 text-[8px] font-black rounded-md shrink-0 ${language === lang ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        } 
      />
      <SettingRow 
        icon="fa-moon" 
        label={t('theme')} 
        action={
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        } 
      />

      <div className="mt-10 px-4">
        <button 
          onClick={onLogout}
          className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-xs tracking-widest"
        >
          <i className="fas fa-sign-out-alt"></i> {t('signOut')}
        </button>
      </div>
    </div>
  );
};

export default Settings;
