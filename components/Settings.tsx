
import React, { useState } from 'react';
import { User, UserRole, UnitType } from '../types';

interface SettingsProps {
  currentUser: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

type ActiveModule = 'main' | 'personal' | 'security' | 'preferences';

const SettingRow: React.FC<{
  icon: string;
  label: string;
  sublabel?: string;
  action?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}> = ({ icon, label, sublabel, action, color = 'blue', onClick }) => (
  <button
    onClick={onClick}
    disabled={!!action && !onClick}
    className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2 shadow-sm transition-all text-left ${onClick ? 'active:bg-slate-50 dark:active:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
        {sublabel && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{sublabel}</p>}
      </div>
    </div>
    <div>{action ? action : (onClick ? <i className="fas fa-chevron-right text-slate-300 dark:text-slate-600 text-xs"></i> : null)}</div>
  </button>
);

const SectionTitle: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3 mt-6">
    {children}
  </h3>
);

const Settings: React.FC<SettingsProps> = ({ currentUser, onLogout, onUpdateUser, isDarkMode, onToggleTheme }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('main');
  const [language, setLanguage] = useState<'EN' | 'SW'>('EN');
  const [batchVisibility, setBatchVisibility] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Form states
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser({
        ...currentUser,
        name: editName,
        email: editEmail,
        phone: editPhone
      });
      setIsSaving(false);
      setActiveModule('main');
    }, 1000);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== confirmPin) {
      alert("PINs do not match");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setActiveModule('main');
      alert("Security PIN updated successfully!");
    }, 1000);
  };

  const renderPersonalModule = () => (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveModule('main')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Personal Details</h2>
      </div>
      <form onSubmit={handleUpdateProfile} className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
          <input
            type="email"
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">M-Pesa Connected Phone</label>
          <input
            type="tel"
            value={editPhone}
            onChange={e => setEditPhone(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 uppercase text-xs tracking-widest active:scale-95 transition-all"
        >
          {isSaving ? 'Syncing...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );

  const renderSecurityModule = () => (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveModule('main')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Account Security</h2>
      </div>
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6 flex gap-4 items-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
          <i className="fas fa-shield-alt"></i>
        </div>
        <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
          Your account is protected by <span className="font-black">E2EE</span>. Updating your secure PIN ensures only you can reveal landlord contacts.
        </p>
      </div>
      <form onSubmit={handleUpdatePin} className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New 4-Digit Security PIN</label>
          <input
            type="password"
            maxLength={4}
            placeholder="****"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-black tracking-[1em]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Security PIN</label>
          <input
            type="password"
            maxLength={4}
            placeholder="****"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-black tracking-[1em]"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 uppercase text-xs tracking-widest active:scale-95 transition-all"
        >
          {isSaving ? 'Updating...' : 'Update PIN'}
        </button>
      </form>
    </div>
  );

  const renderPreferencesModule = () => (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveModule('main')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {currentUser.role === UserRole.LANDLORD ? 'Agency Preferences' : 'Housing Preferences'}
        </h2>
      </div>
      <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Unit Types</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(UnitType).map(type => (
              <button
                key={type}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-black text-slate-600 uppercase text-center active:bg-blue-600 active:text-white transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maximum Price Range</label>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[9px] font-black text-slate-400">
            <span>KSH 1K</span>
            <span>KSH 100K</span>
          </div>
        </div>
        <button
          onClick={() => setActiveModule('main')}
          className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );

  if (activeModule === 'personal') return renderPersonalModule();
  if (activeModule === 'security') return renderSecurityModule();
  if (activeModule === 'preferences') return renderPreferencesModule();

  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500 pb-10">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-100 relative">
          <i className={`fas ${currentUser.role === UserRole.LANDLORD ? 'fa-user-tie' : 'fa-user'}`}></i>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-950"></div>
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-4 tracking-tight">{currentUser.name}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{currentUser.phone} • {currentUser.role === UserRole.LANDLORD ? 'Agent/Landlord' : 'Tenant Account'}</p>
      </div>

      <SectionTitle>Profile Management</SectionTitle>
      <SettingRow
        icon="fa-id-card"
        label="Personal Details"
        sublabel="Name, Phone, Email & Encryption Key"
        onClick={() => setActiveModule('personal')}
      />
      <SettingRow
        icon="fa-key"
        label="Account Security"
        sublabel="Update PIN & Password"
        onClick={() => setActiveModule('security')}
      />

      {currentUser.role === UserRole.TENANT ? (
        <>
          <SectionTitle>Search Preferences</SectionTitle>
          <SettingRow
            icon="fa-sliders-h"
            label="Housing Preferences"
            sublabel="Default unit types & area"
            onClick={() => setActiveModule('preferences')}
          />
          <SettingRow
            icon="fa-bell"
            label="Price Alerts"
            sublabel={notifications ? "Push notifications active" : "Notifications disabled"}
            onClick={() => setNotifications(!notifications)}
            action={
              <button className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            }
          />

          <SectionTitle>Payment & Billing</SectionTitle>
          <SettingRow
            icon="fa-history"
            label="Unlock History"
            sublabel={`${currentUser.unlockedListings.length} properties revealed`}
            color="green"
            onClick={() => alert(`You have revealed contact details for ${currentUser.unlockedListings.length} properties in Kimana.`)}
          />
          <SettingRow
            icon="fa-wallet"
            label="Saved M-Pesa Number"
            sublabel={`+254 ${currentUser.phone}`}
            color="green"
            onClick={() => alert(`Primary M-Pesa: +254 ${currentUser.phone}\nStatus: Verified via Daraja API`)}
          />
        </>
      ) : (
        <>
          <SectionTitle>Property Management</SectionTitle>
          <SettingRow
            icon="fa-building"
            label="Listing Preferences"
            sublabel="Default location & amenities"
            onClick={() => setActiveModule('preferences')}
          />
          <SettingRow
            icon="fa-eye-slash"
            label="Batch Visibility"
            sublabel={batchVisibility ? "All units visible" : "Units temporarily hidden"}
            color="amber"
            onClick={() => setBatchVisibility(!batchVisibility)}
            action={
              <button className={`w-12 h-6 rounded-full transition-colors relative ${batchVisibility ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${batchVisibility ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            }
          />

          <SectionTitle>Agency Billing</SectionTitle>
          <SettingRow
            icon="fa-chart-pie"
            label="Payment Reports"
            sublabel="History of listing fees & subscriptions"
            color="green"
            onClick={() => alert("Total Listing Fees Paid: Ksh 4,500\nActive Subscriptions: 1\nPending Renewals: 0")}
          />
          <SettingRow
            icon="fa-star"
            label="Premium Boosts"
            sublabel="Get 3x more tenant reach"
            color="amber"
            onClick={() => alert("Promote your listings to the top of search results for Ksh 500/week.\nContact support to activate.")}
          />
        </>
      )}

      <SectionTitle>Shared Settings</SectionTitle>
      <SettingRow
        icon="fa-language"
        label="App Language"
        action={
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={(e) => { e.stopPropagation(); setLanguage('EN'); }} className={`px-2 py-1 text-[10px] font-bold rounded-md ${language === 'EN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
            <button onClick={(e) => { e.stopPropagation(); setLanguage('SW'); }} className={`px-2 py-1 text-[10px] font-bold rounded-md ${language === 'SW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>SW</button>
          </div>
        }
      />
      <SettingRow
        icon="fa-moon"
        label="Theme Mode"
        onClick={onToggleTheme}
        action={
          <div className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </div>
        }
      />

      <SectionTitle>Help & Support</SectionTitle>
      <SettingRow
        icon="fa-question-circle"
        label="Help Center"
        sublabel="FAQs & Contact Support"
        onClick={() => alert("Need help? Email us at support@kimana-housing.com or call +254 700 000 000")}
      />
      <SettingRow
        icon="fa-shield-alt"
        label="Privacy & Security Policy"
        sublabel="E2EE & GDPR compliance"
        onClick={() => alert("Your data is encrypted using AES-256. We do not store your M-Pesa PIN.")}
      />

      <div className="mt-10 px-4">
        <button
          onClick={onLogout}
          className="w-full py-4 bg-red-50 text-red-600 font-black rounded-2xl border border-red-100 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-xs tracking-widest"
        >
          <i className="fas fa-sign-out-alt"></i> Sign Out Account
        </button>
        <p className="text-center text-[10px] text-slate-300 font-bold mt-6 uppercase tracking-tighter">Kimana Housing Space v1.4.2 • Secure E2EE</p>
      </div>
    </div>
  );
};

export default Settings;
