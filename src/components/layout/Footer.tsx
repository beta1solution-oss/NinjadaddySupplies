import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

const SocialFacebook = () => (
  <svg viewBox="0 0 24 24" fill="#1877F2" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const SocialTikTok = () => (
  <svg viewBox="0 0 24 24" fill="#000000" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.53V6.77a4.85 4.85 0 01-1-.08z"/>
  </svg>
);
const SocialInstagram = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <defs>
      <linearGradient id="ig-grad2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#FCAF45"/>
        <stop offset="50%" stopColor="#F77737"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad2)"/>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
  </svg>
);
const SocialX = () => (
  <svg viewBox="0 0 24 24" fill="#000000" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);
const SocialWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const SocialShopify = () => (
  <svg viewBox="0 0 24 24" fill="#96BF48" className="w-5 h-5">
    <path d="M15.337 23.979l6.772-1.464S19.725 7.487 19.712 7.362c-.012-.124-.124-.207-.235-.207s-2.167-.151-2.167-.151-.151-.027-1.64-1.419c0 0-.554.151-.554.166L15.337 23.98zm-2.956.012l.748-17.777s-1.281-.347-1.695-.347c-.013 0-.582-1.778-2.069-1.778-.082 0-.165.012-.248.027C8.7 3.667 8.06 3 7.263 3c-2.29 0-3.392 2.872-3.738 4.331-.898.277-1.529.47-1.612.497-.499.152-.513.166-.58.636-.052.346-1.985 15.318-1.985 15.318l13.987 2.209h.046z"/>
  </svg>
);

const socialIcons: Record<string, JSX.Element> = {
  social_facebook: <SocialFacebook />,
  social_tiktok: <SocialTikTok />,
  social_instagram: <SocialInstagram />,
  social_x: <SocialX />,
  social_whatsapp: <SocialWhatsApp />,
  social_shopify: <SocialShopify />,
};

const socialLabels: Record<string, string> = {
  social_facebook: 'Facebook',
  social_tiktok: 'TikTok',
  social_instagram: 'Instagram',
  social_x: 'X / Twitter',
  social_whatsapp: 'WhatsApp',
  social_shopify: 'Shopify',
};

// Payment method icons
const CryptoIcon = () => (
  <svg viewBox="0 0 32 32" className="w-6 h-5" fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.8-1.7-.4-.7 2.7c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.8c-.4-.1-.7-.2-1.1-.2v0l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8.9l-2 8c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.9 1.9 2.2.6c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.8c.5.1.9.2 1.4.3l-.7 2.8 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.6zm-3.7 5.2c-.5 2-3.9.9-5 .6l.9-3.6c1.1.3 4.6.8 4.1 3zm.5-5.2c-.5 1.8-3.3.9-4.2.7l.8-3.3c.9.2 3.9.7 3.4 2.6z" fill="white"/>
  </svg>
);

const WiseIcon = () => (
  <svg viewBox="0 0 60 24" className="w-10 h-5" fill="none">
    <text x="0" y="18" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="#9FE870">W</text>
    <text x="14" y="18" fontFamily="Arial" fontSize="14" fontWeight="600" fill="#2A2A2A">ise</text>
  </svg>
);

const BankIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-5" fill="none">
    <rect x="2" y="19" width="20" height="2" rx="1" fill="#555"/>
    <rect x="4" y="10" width="3" height="9" fill="#555"/>
    <rect x="10.5" y="10" width="3" height="9" fill="#555"/>
    <rect x="17" y="10" width="3" height="9" fill="#555"/>
    <path d="M1 9l11-7 11 7H1z" fill="#555"/>
  </svg>
);

const GiftCardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-5" fill="none">
    <rect x="2" y="8" width="20" height="13" rx="2" fill="#E6C200" opacity="0.15" stroke="#E6C200" strokeWidth="1.5"/>
    <path d="M2 12h20M12 8v13" stroke="#E6C200" strokeWidth="1.5"/>
    <path d="M12 8c0 0-2-3.5 0-3.5s2 3.5 2 3.5M12 8c0 0 2-3.5 0-3.5s-2 3.5-2 3.5" stroke="#E6C200" strokeWidth="1.2"/>
  </svg>
);

export default function Footer() {
  const { settings } = useSettings();
  const activeSocials = Object.entries(socialIcons).filter(([key]) => settings[key]);

  return (
    <footer className="bg-[#111111] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/src/assets/ninjadaddy-logo.png"
                alt="Ninjadaddy Supplies"
                className="h-12 w-auto object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="font-black text-xl text-white tracking-tight">
                NINJA<span className="text-[#E6C200]">DADDY</span>
              </span>
            </div>
            <p className="text-sm text-[#999999] leading-relaxed mb-5">
              Direct sourcing = insane savings. Premium products with stealth shipping to US & UK markets.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 bg-[#E6C200]/10 text-[#E6C200] border border-[#E6C200]/30 rounded-full font-700">🇺🇸 Ships to US</span>
              <span className="text-xs px-2.5 py-1 bg-[#E6C200]/10 text-[#E6C200] border border-[#E6C200]/30 rounded-full font-700">🇬🇧 Ships to UK</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-800 text-white mb-4 text-sm uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'All Products' },
                { to: '/track-order', label: 'Track Order' },
                { to: '/checkout', label: 'Checkout' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-[#999999] hover:text-[#E6C200] transition-colors font-500">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-800 text-white mb-4 text-sm uppercase tracking-widest">We Accept</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                <CryptoIcon />
                <div>
                  <p className="text-xs font-700 text-white">Cryptocurrency</p>
                  <p className="text-xs text-[#777777] font-500">BTC, ETH, USDT & more</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                <div className="w-6 h-5 flex items-center justify-center">
                  <span className="text-[#9FE870] font-900 text-lg leading-none">W</span>
                </div>
                <div>
                  <p className="text-xs font-700 text-white">Wise Transfer</p>
                  <p className="text-xs text-[#777777] font-500">Fast international transfer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                <BankIcon />
                <div>
                  <p className="text-xs font-700 text-white">Direct Bank</p>
                  <p className="text-xs text-[#777777] font-500">US & UK bank accounts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                <GiftCardIcon />
                <div>
                  <p className="text-xs font-700 text-white">Gift Card</p>
                  <p className="text-xs text-[#777777] font-500">Amazon, Apple & store cards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Socials */}
          <div>
            <h4 className="font-800 text-white mb-4 text-sm uppercase tracking-widest">Follow Us</h4>
            {activeSocials.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {activeSocials.map(([key, icon]) => (
                  <a key={key} href={settings[key]} target="_blank" rel="noopener noreferrer"
                    title={socialLabels[key]}
                    className="w-10 h-10 bg-[#222222] border border-[#333333] rounded-xl flex items-center justify-center hover:border-[#E6C200]/50 hover:scale-110 transition-all">
                    {icon}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#666666]">Social links coming soon.</p>
            )}

            <div className="mt-6">
              <h4 className="font-800 text-white mb-3 text-xs uppercase tracking-widest">Gateway-Free Promise</h4>
              <p className="text-xs text-[#777777] leading-relaxed font-500">
                No PayPal. No Stripe. No card processors. 100% private, secure, peer-to-peer payments only.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#666666]">© {new Date().getFullYear()} Ninjadaddy Supplies. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <span className="text-xs text-[#666666]">🔐 Gateway-Free Checkout</span>
            <span className="text-xs text-[#E6C200]">●</span>
            <span className="text-xs text-[#666666]">📦 Stealth Shipping</span>
            <span className="text-xs text-[#E6C200]">●</span>
            <span className="text-xs text-[#666666]">🌍 US & UK Markets</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
