
import React, { useState } from 'react';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  amount: number;
  subtitle: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess, title, amount, subtitle }) => {
  const [step, setStep] = useState<'phone' | 'processing' | 'success' | 'error'>('phone');
  const [phone, setPhone] = useState('');

  const handlePay = () => {
    if (phone.length < 9) {
      alert('Please enter a valid phone number');
      return;
    }
    setStep('processing');
    
    // Simulate Daraja API STK Push and Firebase Cloud Function verification
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setStep('error');
      }
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in duration-300 shadow-2xl">
        <div className="bg-[#3BB143] px-6 py-6 flex flex-col items-center justify-center text-white text-center relative">
          {step === 'phone' && (
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:scale-110 transition-transform">
              <i className="fas fa-times"></i>
            </button>
          )}
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" className="w-12 brightness-0 invert" alt="M-Pesa" />
          </div>
          <h3 className="font-bold text-lg leading-tight">Pay Ksh {amount}</h3>
          <p className="text-[10px] text-white/80 mt-1 uppercase tracking-widest font-black">{subtitle}</p>
        </div>

        <div className="p-6 min-h-[250px] flex flex-col justify-center">
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-Pesa Registered Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">+254</span>
                  <input 
                    type="tel" 
                    placeholder="712 345 678"
                    className="w-full pl-16 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3BB143] outline-none font-bold text-slate-700"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={handlePay}
                className="w-full py-4 bg-[#3BB143] text-white font-black rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-xs"
              >
                LIPA NA M-PESA
              </button>
              <p className="text-[9px] text-center text-slate-400 font-medium">Payment triggers an encrypted STK Push to your device via Daraja Gateway.</p>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-[#3BB143] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#3BB143]">
                  <i className="fas fa-shield-alt text-xs animate-pulse"></i>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Verifying Transaction</h4>
                <p className="text-xs text-slate-500">Checking M-Pesa status via Cloud Functions...</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl shadow-inner">
                <i className="fas fa-check-circle"></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Payment Successful</h4>
                <p className="text-xs text-slate-500">Transaction ID: {Math.random().toString(36).substr(2, 10).toUpperCase()}</p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-in bounce-in">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl">
                <i className="fas fa-times-circle"></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Payment Failed</h4>
                <p className="text-xs text-slate-500 mb-4">Request timed out or cancelled.</p>
                <button 
                  onClick={() => setStep('phone')}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase hover:bg-slate-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
