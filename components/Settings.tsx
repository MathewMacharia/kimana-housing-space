
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
  <div onclick="{onClick}" classname="{`w-full" flex="" items-center="" justify-between="" p-4="" bg-white="" dark:bg-slate-900="" rounded-2xl="" border="" border-slate-100="" dark:border-slate-800="" mb-2="" shadow-sm="" transition-all="" text-left="" ${onclick="" ?="" 'active:bg-slate-50="" dark:active:bg-slate-800="" hover:border-slate-200="" dark:hover:border-slate-700="" cursor-pointer'="" :="" 'cursor-default'}`}="">
    <div classname="flex items-center gap-4">
      <div classname="{`w-10" h-10="" rounded-xl="" bg-${color}-50="" dark:bg-${color}-900="" 20="" text-${color}-600="" dark:text-${color}-400="" flex="" items-center="" justify-center`}="">
        <i classname="{`fas" ${icon}`}=""></i>
      </div>
      <div classname="min-w-0">
        <p classname="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
        {sublabel && <p classname="text-[10px] text-slate-400 font-medium truncate">{sublabel}</p>}
      </div>
    </div>
    <div onclick="{(e)" ==""> e.stopPropagation()}>{action ? action : (onClick ? <i classname="fas fa-chevron-right text-slate-300 text-xs"></i> : null)}</div>
  </div>
);

const SectionTitle: React.FC<react.propswithchildren<{}>> = ({ children }) => (
  <h3 classname="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3 mt-6">
    {children}
  </h3>
);

const Settings: React.FC<settingsprops> = ({ 
  currentUser, onLogout, onUpdateUser, isDarkMode, setIsDarkMode, language, setLanguage, t 
}) => {
  const [activeModule, setActiveModule] = useState<'main' | 'personal' | 'security' | 'preferences'>('main');
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedUser = { ...currentUser, ...formData };
      await FirebaseService.saveUserProfile(updatedUser);
      onUpdateUser(updatedUser);
      alert("Profile updated successfully!");
      setActiveModule('main');
    } catch (err) {
      alert("Update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<htmlinputelement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const url = await FirebaseService.uploadPropertyImage(`logos/${currentUser.id}`, base64);
        const updatedUser = { ...currentUser, logoUrl: url };
        await FirebaseService.saveUserProfile(updatedUser);
        
        // Also update global settings if landlord
        if (currentUser.role === UserRole.LANDLORD) {
          await FirebaseService.updateGlobalSettings({ logoUrl: url });
        }
        
        onUpdateUser(updatedUser);
        alert("Logo updated successfully!");
      } catch (err) {
        alert("Logo upload failed.");
      } finally {
        setIsUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

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

  if (activeModule === 'personal') {
    return (
      <div classname="animate-in slide-in-from-right duration-300">
        <button onclick="{()" ==""> setActiveModule('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
           <i classname="fas fa-arrow-left"></i> Back to settings
        </button>
        <div classname="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
          <h3 classname="text-xl font-black text-slate-800 dark:text-slate-100 mb-6">Personal Details</h3>
          <form onsubmit="{handleUpdateProfile}" classname="space-y-4">
            <div classname="space-y-1">
              <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input required="" type="text" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm text-black" value="{formData.name}" onchange="{e" ==""> setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div classname="space-y-1">
              <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <input required="" type="tel" classname="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm text-black" value="{formData.phone}" onchange="{e" ==""> setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <button type="submit" disabled="{isUpdating}" classname="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 dark:shadow-none">
              {isUpdating ? <i classname="fas fa-circle-notch animate-spin"></i> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeModule === 'security') {
    return (
      <div classname="animate-in slide-in-from-right duration-300">
        <button onclick="{()" ==""> setActiveModule('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">
           <i classname="fas fa-arrow-left"></i> Back to settings
        </button>
        <div classname="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center">
          <i classname="fas fa-shield-halved text-4xl text-blue-600 mb-4"></i>
          <h3 classname="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Security Center</h3>
          <p classname="text-xs text-slate-500 mb-6">Password reset links are sent to your registered email for security.</p>
          <button onclick="{()" ==""> alert("Password reset link sent to " + currentUser.email)}
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Send Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div classname="animate-in fade-in slide-in-from-bottom duration-500 pb-10">
      <div classname="text-center mb-8">
        <div classname="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-100 dark:shadow-blue-900/20 relative group overflow-hidden">
          {currentUser.logoUrl ? (
            <img src="{currentUser.logoUrl}" alt="Logo" classname="w-full h-full object-cover"/>
          ) : (
            <i classname="{`fas" ${currentuser.role="==" userrole.landlord="" ?="" 'fa-user-tie'="" :="" 'fa-user'}`}=""></i>
          )}
          <label classname="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <i classname="fas fa-camera text-white text-base"></i>
            <input type="file" classname="hidden" onchange="{handleLogoUpload}" accept="image/*"/>
          </label>
          <div classname="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-950"></div>
        </div>
        <h2 classname="text-xl font-black text-slate-800 dark:text-slate-100 mt-4 tracking-tight">{currentUser.name}</h2>
        <p classname="text-xs text-slate-500 font-medium">{currentUser.phone} • {currentUser.role === UserRole.LANDLORD ? 'Agent/Landlord' : 'Tenant Account'}</p>
      </div>

      <sectiontitle>{t('settings')}</SectionTitle>
      <settingrow icon="fa-id-card" label="{t(&#39;personalDetails&#39;)}" sublabel="Name, Phone, Email" onclick="{()" ==""> setActiveModule('personal')}
      />
      <settingrow icon="fa-key" label="{t(&#39;security&#39;)}" sublabel="Update PIN &amp; Password" onclick="{()" ==""> setActiveModule('security')}
      />

      {currentUser.role === UserRole.LANDLORD && (
        <>
          <sectiontitle>Account Control</SectionTitle>
          <settingrow icon="fa-user" label="{t(&#39;switchRoleTenant&#39;)}" color="amber" onclick="{handleToggleRole}"/>
        </>
      )}

      <sectiontitle>App Configuration</SectionTitle>
      <settingrow icon="fa-language" label="{t(&#39;language&#39;)}" action="{" <div="" classname="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-[150px]">
            {LANGUAGES.map(lang => (
              <button key="{lang}" onclick="{()" ==""> setLanguage(lang)} 
                className={`px-2 py-1 text-[8px] font-black rounded-md shrink-0 ${language === lang ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        } 
      />
      <settingrow icon="fa-moon" label="{t(&#39;theme&#39;)}" action="{" <button="" onclick="{()" ==""> setIsDarkMode(!isDarkMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <div classname="{`absolute" top-1="" w-4="" h-4="" bg-white="" rounded-full="" transition-transform="" ${isdarkmode="" ?="" 'translate-x-7'="" :="" 'translate-x-1'}`}=""></div>
          </button>
        } 
      />

      <div classname="mt-10 px-4">
        <button onclick="{onLogout}" classname="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-xs tracking-widest">
          <i classname="fas fa-sign-out-alt"></i> {t('signOut')}
        </button>
      </div>
    </div>
  );
};

export default Settings;
