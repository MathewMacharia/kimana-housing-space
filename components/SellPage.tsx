
import React, { useState } from 'react';
import { FirebaseService } from '../services/db';
import { SellerLead } from '../types';

const PROPERTY_TYPES = [
  'Bedsitter', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4+ Bedroom',
  'Own Compound', 'Commercial Space', 'Land for Sale', 'Farmland',
  'B&B / Guest House', 'Property for Sale'
];

const SellPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    propertyType: '',
    location: '',
    description: '',
    askingPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.propertyType || !form.location) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const lead: SellerLead = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      propertyType: form.propertyType,
      location: form.location.trim(),
      description: form.description.trim(),
      askingPrice: form.askingPrice ? Number(form.askingPrice) : undefined,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    try {
      await FirebaseService.saveSellerLead(lead);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit seller lead:', err);
      setError('Submission failed. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2000')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-5">
            <i className="fas fa-tag text-sm" />
            <span className="text-xs font-black uppercase tracking-widest">List Your Property</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Reach Thousands of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Verified Buyers & Tenants
            </span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xl mx-auto mb-8">
            List your property on Masqani Poa and connect with serious buyers, tenants and investors across Kajiado South. Our team handles everything — fast, simple and affordable.
          </p>

          {/* Value props */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: 'fa-bolt', text: 'Listed in 24hrs' },
              { icon: 'fa-shield-halved', text: 'Verified Listings' },
              { icon: 'fa-users', text: '1,200+ Active Seekers' },
            ].map(p => (
              <div key={p.text} className="flex items-center gap-2 text-white/80 text-sm">
                <i className={`fas ${p.icon} text-emerald-400`} />
                {p.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div id="contact" className="max-w-3xl mx-auto px-4 py-12">
        {submitted ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
              <i className="fas fa-check-circle text-4xl" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Submission Received!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto mb-6">
              Thank you, <strong>{form.name}</strong>! Our team will contact you within 24 hours on <strong>{form.phone}</strong> to proceed with your listing.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', email: '', propertyType: '', location: '', description: '', askingPrice: '' }); }}
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest text-xs hover:bg-blue-700 transition-all active:scale-95"
            >
              Submit Another
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Form header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-xl font-black text-white tracking-tight">Property Listing Request</h2>
              <p className="text-blue-100 text-sm mt-1">Fill in the details below and we'll get in touch within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <i className="fas fa-triangle-exclamation text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label htmlFor="sell-name" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sell-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="sell-phone" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sell-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email (optional) */}
              <div>
                <label htmlFor="sell-email" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Address <span className="text-slate-300 font-normal">(optional)</span>
                </label>
                <input
                  id="sell-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Property Type */}
                <div>
                  <label htmlFor="sell-propertyType" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sell-propertyType"
                    name="propertyType"
                    value={form.propertyType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Select type...</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Asking Price */}
                <div>
                  <label htmlFor="sell-price" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Asking Price (KES) <span className="text-slate-300 font-normal">(optional)</span>
                  </label>
                  <input
                    id="sell-price"
                    name="askingPrice"
                    type="number"
                    value={form.askingPrice}
                    onChange={handleChange}
                    placeholder="e.g. 15000 or 1500000"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="sell-location" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="sell-location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Kimana Town Centre, Loitokitok Hospital Zone..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="sell-description" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  id="sell-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your property — size, features, condition, number of rooms..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              {/* Photo upload note */}
              <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                <i className="fas fa-camera text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>Photos:</strong> After you submit, our team will contact you via WhatsApp to collect property photos. High-quality photos increase your chances of getting inquiries faster.
                </p>
              </div>

              <button
                id="sell-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-[0.99] shadow-xl shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><i className="fas fa-circle-notch animate-spin" /> Submitting...</>
                ) : (
                  <><i className="fas fa-paper-plane" /> Submit Listing Request</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Or call/WhatsApp us directly:{' '}
                <a href="tel:+254700000000" className="text-blue-600 font-bold hover:underline">+254 700 000 000</a>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellPage;
