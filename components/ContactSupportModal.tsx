
import React from 'react';

interface ContactSupportModalProps {
  onClose: () => void;
}

const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ onClose }) => {
  const supportPhone = "+254700000000";
  const supportEmail = "support@kimana-housing.com";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-slate-100">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mx-auto mb-4 shadow-inner">
            <i className="fas fa-headset"></i>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Support Hub</h3>
          <p className="text-xs text-slate-500 font-medium">How can we assist you today?</p>
        </div>

        <div className="space-y-4">
          <a 
            href={`tel:${supportPhone}`}
            className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
              <i className="fas fa-phone-alt"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">Call Support</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available 24/7</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 text-sm"></i>
          </a>

          <a 
            href={`sms:${supportPhone}?body=Hello Kimana Support, I need help with...`}
            className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <i className="fas fa-comment-dots"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">SMS / Text Message</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fastest Response</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 text-sm"></i>
          </a>

          <a 
            href={`mailto:${supportEmail}?subject=Support Request - Kimana Housing`}
            className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">Email Inquiry</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">For detailed issues</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 text-sm"></i>
          </a>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 text-slate-400 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ContactSupportModal;
