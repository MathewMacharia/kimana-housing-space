
import React from 'react';

interface ContactSupportModalProps {
  onClose: () => void;
}

const ContactSupportModal: React.FC<contactsupportmodalprops> = ({ onClose }) => {
  const supportPhone = "+254700000000";
  const supportEmail = "support@masqani-poa.com";

  return (
    <div classname="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
      <div classname="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="{onClose}"/>
      
      <div classname="relative w-full max-w-lg bg-white rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-slate-100">
        <div classname="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"/>
        
        <div classname="text-center mb-8">
          <div classname="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mx-auto mb-4 shadow-inner">
            <i classname="fas fa-headset"></i>
          </div>
          <h3 classname="text-xl font-black text-slate-800 tracking-tight">Support Hub</h3>
          <p classname="text-xs text-slate-500 font-medium">How can we assist you today?</p>
        </div>

        <div classname="space-y-4">
          <a href="{`tel:${supportPhone}`}" classname="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all group">
            <div classname="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
              <i classname="fas fa-phone-alt"></i>
            </div>
            <div classname="flex-1">
              <p classname="text-sm font-black text-slate-800">Call Support</p>
              <p classname="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available 24/7</p>
            </div>
            <i classname="fas fa-chevron-right text-slate-300 text-sm"></i>
          </a>

          <a href="{`sms:${supportPhone}?body=Hello" masqani="" support,="" i="" need="" help="" with...`}="" classname="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all group">
            <div classname="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <i classname="fas fa-comment-dots"></i>
            </div>
            <div classname="flex-1">
              <p classname="text-sm font-black text-slate-800">SMS / Text Message</p>
              <p classname="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fastest Response</p>
            </div>
            <i classname="fas fa-chevron-right text-slate-300 text-sm"></i>
          </a>

          <a href="{`mailto:${supportEmail}?subject=Support" request="" -="" masqani="" poa`}="" classname="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all group">
            <div classname="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <i classname="fas fa-envelope"></i>
            </div>
            <div classname="flex-1">
              <p classname="text-sm font-black text-slate-800">Email Inquiry</p>
              <p classname="text-[10px] text-slate-400 font-bold uppercase tracking-widest">For detailed issues</p>
            </div>
            <i classname="fas fa-chevron-right text-slate-300 text-sm"></i>
          </a>
        </div>

        <button onclick="{onClose}" classname="w-full mt-8 py-4 text-slate-400 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ContactSupportModal;
