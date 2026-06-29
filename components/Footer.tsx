
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1 — Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
              <span className="text-lg font-black text-white uppercase tracking-tight">Masqani Poa</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your one-stop property marketplace for Kajiado South. Find rentals, B&Bs, land and homes for sale — all in one place.
            </p>
            <div className="flex gap-4 mt-5">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                <i className="fab fa-facebook-f text-xs" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
                <i className="fab fa-twitter text-xs" />
              </a>
              <a href="https://wa.me/254700000000" aria-label="WhatsApp" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-green-600 hover:text-white transition-all">
                <i className="fab fa-whatsapp text-xs" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                <i className="fab fa-instagram text-xs" />
              </a>
            </div>
          </div>

          {/* Col 2 — Quick Links (Rent) */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Residential Rentals', to: '/rent/residential' },
                { label: 'Commercial Spaces', to: '/rent/commercial' },
                { label: 'B&Bs / Short Stays', to: '/rent/bnb' },
                { label: 'Farmland for Rent', to: '/rent/farmland' },
                { label: 'New Listings', to: '/rent?filter=new' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Jump To (Buy) */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Jump To</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Buy Property', to: '/buy/property' },
                { label: 'Buy Land', to: '/buy/land' },
                { label: 'Lease Farmland', to: '/rent/farmland' },
                { label: 'List Your Property', to: '/sell' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Contact Us', to: '/sell#contact' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'FAQs', to: '/faqs' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 bg-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Call / WhatsApp</p>
              <a href="tel:+254700000000" className="text-sm text-white font-bold hover:text-blue-400 transition-colors">
                +254 700 000 000
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {year} Masqani Poa. All rights reserved. Kajiado South, Kenya.
          </p>
          <div className="flex gap-6">
            <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms</Link>
            <Link to="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
