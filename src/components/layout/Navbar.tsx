import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';

type Currency = 'USD' | 'EUR' | 'GBP';
const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£' };
const CURRENCY_FLAGS: Record<Currency, string> = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧' };

// Simple in-memory rate cache
let rateCache: { rates: Record<string, number>; time: number } | null = null;

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('nd_currency') as Currency) || 'USD';
  });
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, GBP: 0.79 });

  useEffect(() => {
    const fetchRates = async () => {
      if (rateCache && Date.now() - rateCache.time < 3600000) {
        setRates(rateCache.rates);
        return;
      }
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        const r = { USD: 1, EUR: data.rates.EUR, GBP: data.rates.GBP };
        rateCache = { rates: r, time: Date.now() };
        setRates(r);
      } catch {
        // fallback rates
      }
    };
    fetchRates();
  }, []);

  const selectCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('nd_currency', c);
    window.dispatchEvent(new Event('currency-change'));
  };

  const convert = (usdPrice: number) => usdPrice * (rates[currency] || 1);
  const format = (usdPrice: number) => {
    const converted = convert(usdPrice);
    return `${CURRENCY_SYMBOLS[currency]}${converted.toFixed(2)}`;
  };

  return { currency, selectCurrency, rates, convert, format, symbol: CURRENCY_SYMBOLS[currency] };
}

// Global currency context (simple singleton via localStorage + events)
export function useGlobalCurrency() {
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('nd_currency') as Currency) || 'USD';
  });
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, GBP: 0.79 });

  useEffect(() => {
    const fetchRates = async () => {
      if (rateCache && Date.now() - rateCache.time < 3600000) {
        setRates(rateCache.rates);
        return;
      }
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        const r = { USD: 1, EUR: data.rates.EUR, GBP: data.rates.GBP };
        rateCache = { rates: r, time: Date.now() };
        setRates(r);
      } catch {}
    };
    fetchRates();

    const onCurrencyChange = () => {
      setCurrency((localStorage.getItem('nd_currency') as Currency) || 'USD');
    };
    window.addEventListener('currency-change', onCurrencyChange);
    return () => window.removeEventListener('currency-change', onCurrencyChange);
  }, []);

  const format = (usdPrice: number) => {
    const rate = rates[currency] || 1;
    return `${CURRENCY_SYMBOLS[currency]}${(usdPrice * rate).toFixed(2)}`;
  };

  return { currency, rates, format, symbol: CURRENCY_SYMBOLS[currency] };
}

export default function Navbar() {
  const { itemCount, setIsOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currency, selectCurrency } = useCurrency();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E0E0DC] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — always visible including mobile */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/src/assets/ninjadaddy-logo.png"
              alt="Ninjadaddy Supplies"
              className="h-9 w-auto object-contain flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-black text-base tracking-tight text-[#111111] leading-none">
              NINJA<span className="text-[#E6C200]">DADDY</span>
              <span className="hidden xs:inline text-[#111111]"> SUPPLIES</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-600 text-[#555555] hover:text-[#111111] transition-colors">Home</Link>
            <Link to="/products" className="text-sm font-600 text-[#555555] hover:text-[#111111] transition-colors">Products</Link>
            <Link to="/track-order" className="flex items-center gap-1 text-sm font-600 text-[#555555] hover:text-[#111111] transition-colors">
              <MapPin className="w-3.5 h-3.5" /> Track Order
            </Link>
            <span className="text-xs px-2.5 py-1 bg-[#FFF9E0] text-[#B8A000] border border-[#E6C200]/40 rounded-full font-700">
              🚚 Free US & UK Shipping
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Currency Selector with flags */}
            <div className="relative">
              <select
                value={currency}
                onChange={e => selectCurrency(e.target.value as Currency)}
                className="text-xs font-700 bg-[#F0F0ED] border border-[#E0E0DC] rounded-lg pl-1.5 pr-6 py-1.5 text-[#111111] focus:outline-none focus:border-[#E6C200] cursor-pointer appearance-none"
                style={{ paddingLeft: '6px' }}
              >
                <option value="USD">{CURRENCY_FLAGS.USD} USD</option>
                <option value="GBP">{CURRENCY_FLAGS.GBP} GBP</option>
                <option value="EUR">{CURRENCY_FLAGS.EUR} EUR</option>
              </select>
              <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
                <svg className="w-3 h-3 text-[#888888]" fill="none" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-lg bg-[#F0F0ED] border border-[#E0E0DC] hover:border-[#E6C200] transition-all"
            >
              <ShoppingCart className="w-5 h-5 text-[#111111]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E6C200] text-black text-xs font-black rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/checkout')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#E6C200] text-black text-sm font-800 rounded-lg hover:bg-[#B8A000] transition-colors"
            >
              Checkout
            </button>

            <button className="md:hidden p-2 text-[#111111]" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#E0E0DC] py-4 space-y-1 bg-white">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Products' },
              { to: '/track-order', label: 'Track Order' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="block px-2 py-2.5 text-sm font-600 text-[#555555] hover:text-[#111111] hover:bg-[#F0F0ED] rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <button
              onClick={() => { navigate('/checkout'); setMenuOpen(false); }}
              className="w-full mt-2 py-2.5 bg-[#E6C200] text-black text-sm font-800 rounded-lg"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
