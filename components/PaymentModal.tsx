
import React, { useState } from 'react';
import { FirebaseService } from '../services/db';
import { PaymentMethod } from '../types';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  amount: number;
  subtitle: string;
  listingId: string;
  userEmail?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess, title, amount, subtitle, listingId, userEmail }) => {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [step, setStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (method === 'mpesa' && phone.length < 9) {
      alert('Please enter a valid phone number');
      return;
    }
    if (method === 'card' && (cardNumber.length < 16 || expiry.length < 4 || cvv.length < 3)) {
      alert('Please enter valid card details');
      return;
    }

    setStep('processing');

    try {
      const email = userEmail || 'tenant@masqani.com';
      const callbackUrl = window.location.href; // Return to the exact same page
      
      const { authorizationUrl } = await FirebaseService.initializePaystackPayment(
        listingId,
        email,
        amount,
        callbackUrl
      );
      
      // Redirect to Paystack's secure checkout page
      window.location.href = authorizationUrl;
    } catch (err) {
      console.error("Payment initialization failed:", err);
      setStep('error');
    }
  };

  const renderMethodIcon = (type: PaymentMethod) => {
    switch (type) {
      case 'mpesa':
      case 'mpesa-till':
        return <i className="fas fa-mobile-alt text-slate-400"></i>;
      case 'airtel':
        return <i className="fas fa-sim-card text-red-500"></i>;
      case 'card':
        return <i className="fas fa-credit-card text-green-600"></i>;
    }
  };

  const getMethodTitle = (type: PaymentMethod) => {
    switch (type) {
      case 'mpesa': return 'M-PESA';
      case 'mpesa-till': return 'M-PESA Till';
      case 'airtel': return 'Airtel Money';
      case 'card': return 'Card';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col md:flex-row items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in duration-300 min-h-[500px] relative">
        
        {/* Close Button Mobile - only visible on small screens when we don't have enough space */}
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-50">
           <i className="fas fa-times text-xl"></i>
        </button>

        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 bg-[#f8f9fa] border-r border-slate-200 flex flex-col pt-6 pb-6">
          <div className="px-6 mb-4">
            <h4 className="text-[11px] font-bold text-slate-500 tracking-wider">PAY WITH</h4>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(['mpesa', 'mpesa-till', 'airtel', 'card'] as PaymentMethod[]).map((m) => (
              <button 
                key={m}
                onClick={() => setMethod(m)}
                className={`w-full text-left px-6 py-4 flex items-center gap-4 transition-colors relative border-b border-slate-100 last:border-0 ${
                  method === m 
                    ? 'bg-white font-bold text-slate-800 shadow-[inset_4px_0_0_0_#48bb78]' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-6 flex justify-center text-lg">{renderMethodIcon(m)}</div>
                <span className="text-sm">{getMethodTitle(m)}</span>
                {method === m && (
                  <i className="fas fa-chevron-right absolute right-4 text-[10px] text-slate-300"></i>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Main Content */}
        <div className="w-full md:w-2/3 bg-white p-6 md:p-10 flex flex-col relative">
          
          {/* Close button Desktop */}
          <button onClick={onClose} className="hidden md:block absolute top-6 right-6 text-slate-400 hover:text-slate-600">
            <i className="fas fa-times text-xl"></i>
          </button>

          {/* Header Area */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-8 mt-2 md:mt-0">
            <div className="w-24 h-8 flex items-center">
              {/* Masqani Logo placeholder - replace with actual logo later if needed */}
              <img src="/logo.png" alt="Masqani" className="max-h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
              <div className="hidden font-black tracking-tighter text-blue-600 text-xl"><i className="fas fa-building text-green-500 mr-1"></i>Masqani</div>
            </div>
            <div className="text-right pl-4">
              <p className="text-sm text-slate-600 truncate max-w-[150px] md:max-w-[200px]">tenant@masqani.com</p>
              <p className="text-sm text-slate-500 mt-1">Pay <span className="text-[#38a169] font-bold">KES {amount.toLocaleString()}</span></p>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 flex flex-col">
            {step === 'details' && (
              <div className="flex-1 flex flex-col max-w-md mx-auto w-full justify-center pb-8 animate-in fade-in duration-300">
                <h3 className="text-center font-semibold text-slate-700 mb-8 text-lg">
                  {method === 'card' ? 'Enter your card details to pay' : `Pay via ${getMethodTitle(method)}`}
                </h3>

                <form onSubmit={handlePay} className="space-y-4">
                  {method === 'card' ? (
                    <>
                      <div className="border border-[#3eb2e6] rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-[#3eb2e6]/20">
                        <div className="p-3 border-b border-slate-200">
                          <label className="text-[10px] font-bold text-[#3eb2e6] uppercase tracking-wider block mb-1">CARD NUMBER</label>
                          <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            className="w-full outline-none text-slate-700 text-base"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                          />
                        </div>
                        <div className="flex">
                          <div className="w-1/2 p-3 border-r border-slate-200">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CARD EXPIRY</label>
                            <input 
                              type="text" 
                              placeholder="MM / YY" 
                              className="w-full outline-none text-slate-700 text-base"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                            />
                          </div>
                          <div className="w-1/2 p-3 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CVV</label>
                              <span className="text-[9px] text-slate-400 font-bold">HELP?</span>
                            </div>
                            <input 
                              type="password" 
                              placeholder="123" 
                              maxLength={4}
                              className="w-full outline-none text-slate-700 text-base tracking-widest"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 ml-1">
                        <input type="checkbox" id="save-card" className="w-4 h-4 rounded text-green-500 focus:ring-green-500 accent-[#48bb78] cursor-pointer" />
                        <label htmlFor="save-card" className="text-[13px] text-slate-700 cursor-pointer">
                          Save this card for faster checkouts
                        </label>
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded ml-1">NEW</span>
                      </div>
                    </>
                  ) : (
                    <div className="border border-slate-300 rounded-md p-4 bg-white shadow-sm focus-within:border-[#48bb78] focus-within:ring-1 focus-within:ring-[#48bb78]/50 transition-all">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{getMethodTitle(method)} REGISTERED NUMBER</label>
                      <div className="flex items-center">
                        <span className="text-slate-400 mr-2 font-medium">+254</span>
                        <input 
                          type="tel" 
                          placeholder="712 345 678" 
                          className="w-full outline-none text-slate-700 text-lg"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full py-4 mt-6 bg-[#48bb78] hover:bg-[#38a169] text-white font-bold rounded-md shadow-md active:scale-[0.98] transition-all text-base"
                  >
                    Pay KES {amount.toLocaleString()}
                  </button>

                  <div className="text-center mt-6">
                    <button type="button" className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
                      {method === 'card' ? 'Use a saved card' : 'Cancel payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 'processing' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-[#48bb78] rounded-full animate-spin"></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">Authorizing Payment</h4>
                  <p className="text-sm text-slate-500 mt-2">Please complete the transaction on your device...</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center animate-in zoom-in">
                <div className="w-20 h-20 bg-green-50 text-[#48bb78] rounded-full flex items-center justify-center text-4xl shadow-sm border border-green-100">
                  <i className="fas fa-check"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xl">Payment Successful</h4>
                  <p className="text-sm text-slate-500 mt-2">Details unlocked successfully.</p>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-5 text-center animate-in bounce-in">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl shadow-sm border border-red-100">
                  <i className="fas fa-times"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xl">Payment Failed</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">The transaction could not be completed. Please try again or use a different payment method.</p>
                </div>
                <button 
                  onClick={() => setStep('details')}
                  className="px-8 flex-none py-3 mt-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Paystack footer badge */}
            <div className="mt-auto pt-4 flex justify-center items-center gap-1 text-[10px] text-slate-400 font-medium">
              <i className="fas fa-lock text-[8px]"></i> Secured by <span className="font-black text-slate-700 ml-0.5 tracking-tight">paystack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
