
import React from 'react';

interface ContactSupportModalProps {
  onClose: () => void;
}

const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ onClose }) => {
  const supportPhone = "+254700000000";
  const supportEmail = "support@masqani-poa.com";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-slate-100 dark:border-slate-800">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl mx-auto mb-4 shadow-inner">
            <i className="fas fa-headset"></i>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Support Hub</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">How can we assist you today?</p>
        </div>

        <div className="space-y-4">
          <a href={`tel:${supportPhone}`} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
              <i className="fas fa-phone-alt"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800 dark:text-white">Call Support</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available 24/7</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 dark:text-slate-600 text-sm"></i>
          </a>

          <a href={`sms:${supportPhone}?body=Hello Masqani Support, I need help with...`} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <i className="fas fa-comment-dots"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800 dark:text-white">SMS / Text Message</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fastest Response</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 dark:text-slate-600 text-sm"></i>
          </a>

          <a href={`mailto:${supportEmail}?subject=Support Request - Masqani Poa`} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800 dark:text-white">Email Inquiry</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">For detailed issues</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 dark:text-slate-600 text-sm"></i>
          </a>
        </div>

        <button onClick={onClose} className="w-full mt-8 py-4 text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ContactSupportModal;
