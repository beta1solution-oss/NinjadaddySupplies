import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowRight, ShoppingBag, CreditCard, Landmark, Gift, Zap, Wind, Tag, X as XIcon, MessageSquare, Send } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CartDrawer from '@/components/features/CartDrawer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import { useCart } from '@/hooks/useCart';
import { useSettings } from '@/hooks/useSettings';
import { useGlobalCurrency } from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { BankAccount } from '@/types';

declare global {
  interface Window {
    emailjs: {
      send: (serviceId: string, templateId: string, params: Record<string, string>, publicKey: string) => Promise<void>;
    };
  }
}

type Country = 'United States' | 'United Kingdom';
type PayMethod = 'crypto' | 'geegpay' | 'payoneer' | 'bank' | 'giftcard';
type DeliveryType = 'delivery' | 'pickup';

const GIFT_CARD_TYPES = [
  { id: 'amazon', name: 'Amazon', emoji: '📦' },
  { id: 'google_play', name: 'Google Play', emoji: '🎮' },
  { id: 'apple', name: 'Apple', emoji: '🍎' },
  { id: 'steam', name: 'Steam', emoji: '🎯' },
  { id: 'ebay', name: 'eBay', emoji: '🛒' },
  { id: 'walmart', name: 'Walmart', emoji: '🏪' },
  { id: 'target', name: 'Target', emoji: '🎯' },
  { id: 'nike', name: 'Nike', emoji: '👟' },
];

interface AddonProduct {
  id: string;
  name: string;
  persona: string;
  price: number;
  discountedPrice: number;
  icon: React.ReactNode;
}

const ADDON_PRODUCTS: AddonProduct[] = [
  {
    id: 'neck_fan',
    name: 'Hands-Free Neck Fan',
    persona: 'Daily commuting, gym, outdoor walking',
    price: 34.99,
    discountedPrice: 24.49,
    icon: <Wind className="w-5 h-5" />,
  },
  {
    id: 'waist_fan',
    name: 'Heavy-Duty Waist Fan',
    persona: 'Construction, delivery, warehouse staff',
    price: 44.99,
    discountedPrice: 31.49,
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'desk_fan',
    name: 'Wall/Desk Suction Fan',
    persona: 'Office workers, kitchen, bedside cooling',
    price: 29.99,
    discountedPrice: 20.99,
    icon: <Wind className="w-5 h-5" />,
  },
];

interface PromoDiscount {
  percent_off: number | null;
  fixed_off: number | null;
  code: string;
}

// ── Gift card 5% auto-discount helpers ────────────────────────────
const GIFTCARD_DISCOUNT_PCT = 5;
// ── Bulk 2+ same product 10% discount ─────────────────────────────
const BULK_QTY_THRESHOLD = 2;
const BULK_DISCOUNT_PCT = 10;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const { format, currency } = useGlobalCurrency();
  const navigate = useNavigate();

  const [country, setCountry] = useState<Country>('United States');
  const [delivery, setDelivery] = useState<DeliveryType>('delivery');
  const [payMethod, setPayMethod] = useState<PayMethod>('crypto');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [selectedGiftType, setSelectedGiftType] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // One-time proof message (shown after gift card / crypto checkout)
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [proofMessage, setProofMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);
  const promoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
    reference: '', notes: ''
  });

  // ── Bulk discount: any item with qty >= 2 of same product ─────────
  const hasBulkItem = items.some(item => item.quantity >= BULK_QTY_THRESHOLD);
  const bulkSavings = hasBulkItem ? subtotal * (BULK_DISCOUNT_PCT / 100) : 0;

  const usFee = parseFloat(settings['us_shipping_fee'] || '5.99');
  const ukFee = parseFloat(settings['uk_shipping_fee'] || '7.99');
  const shippingFee = country === 'United States' ? usFee : ukFee;
  const addonTotal = ADDON_PRODUCTS.filter(a => selectedAddons.includes(a.id)).reduce((s, a) => s + a.discountedPrice, 0);

  // Base after bulk discount
  const afterBulk = subtotal - bulkSavings + shippingFee + addonTotal;

  // Promo code discount
  const promoSavings = promoDiscount
    ? (promoDiscount.percent_off ? afterBulk * (promoDiscount.percent_off / 100) : 0)
      + (promoDiscount.fixed_off ? promoDiscount.fixed_off : 0)
    : 0;
  const afterPromo = Math.max(0, afterBulk - promoSavings);

  // Gift card 5% auto-discount
  const giftCardSavings = payMethod === 'giftcard' ? afterPromo * (GIFTCARD_DISCOUNT_PCT / 100) : 0;
  const total = Math.max(0, afterPromo - giftCardSavings);

  const cryptoWallet = settings['crypto_wallet'] || '';
  const geegpayInfo = settings['geegpay_info'] || 'Contact admin for Geegpay details';
  const payoneerEmail = settings['payoneer_email'] || '';
  const bankAccounts: BankAccount[] = (() => {
    try { return JSON.parse(settings['bank_accounts'] || '[]'); } catch { return []; }
  })();

  const [displayTotal, setDisplayTotal] = useState('');
  useEffect(() => {
    setDisplayTotal(format(total));
  }, [total, format, currency]);

  // Promo code real-time validation with debounce
  useEffect(() => {
    if (!promoCode.trim()) {
      setPromoStatus('idle');
      setPromoDiscount(null);
      return;
    }
    if (promoRef.current) clearTimeout(promoRef.current);
    promoRef.current = setTimeout(async () => {
      setPromoStatus('checking');
      const { data } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
      if (data) {
        const expired = data.expiry && new Date(data.expiry) < new Date();
        if (expired) {
          setPromoStatus('invalid');
          setPromoDiscount(null);
        } else {
          setPromoStatus('valid');
          setPromoDiscount({ percent_off: data.percent_off, fixed_off: data.fixed_off, code: data.code });
        }
      } else {
        setPromoStatus('invalid');
        setPromoDiscount(null);
      }
    }, 600);
    return () => { if (promoRef.current) clearTimeout(promoRef.current); };
  }, [promoCode]);

  const copyWallet = () => {
    navigator.clipboard.writeText(cryptoWallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const sendEmailNotification = async (orderId: string) => {
    try {
      if (!window.emailjs) return;
      const serviceId = settings['emailjs_service_id'];
      const templateId = settings['emailjs_template_id'];
      const publicKey = settings['emailjs_public_key'] || 'h7UDz0N4LIdd94R9O';
      if (!serviceId || !templateId) return;

      const addonsText = ADDON_PRODUCTS.filter(a => selectedAddons.includes(a.id))
        .map(a => `${a.name} (${format(a.discountedPrice)})`).join(', ') || 'None';
      const itemsText = items.map(i => `${i.product.title} x${i.quantity}`).join(', ');

      await window.emailjs.send(serviceId, templateId, {
        order_id: orderId,
        customer_name: form.name,
        customer_email: form.email || 'Not provided',
        customer_phone: form.phone,
        shipping_country: country,
        shipping_address: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
        delivery_type: delivery,
        payment_method: payMethod,
        payment_reference: payMethod === 'giftcard' ? giftCode : form.reference,
        amount_total: `$${total.toFixed(2)} USD (${displayTotal} ${currency})`,
        order_items: itemsText,
        addon_items: addonsText,
        notes: form.notes || 'None',
      }, publicKey);
    } catch (err) {
      console.log('Email notification skipped:', err);
    }
  };

  const handleSendProof = async () => {
    if (!proofMessage.trim() || !completedOrderId) return;
    setSendingMsg(true);
    const { error } = await supabase.from('messages').insert({
      order_id: completedOrderId,
      customer_name: form.name || 'Customer',
      customer_email: form.email || null,
      message: proofMessage.trim(),
    });
    if (!error) {
      setMessageSent(true);
      toast.success('Message sent to admin!');
      setTimeout(() => {
        navigate(`/order-confirmation/${completedOrderId}`);
      }, 1500);
    } else {
      toast.error('Failed to send message. Please try WhatsApp instead.');
    }
    setSendingMsg(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city || !form.state || !form.zip) {
      toast.error('Please fill all required shipping fields.');
      return;
    }
    if (payMethod !== 'giftcard' && !form.reference) {
      toast.error('Payment reference is required.');
      return;
    }
    if (payMethod === 'giftcard') {
      if (!giftCode) { toast.error('Please enter your gift card code.'); return; }
      if (!selectedGiftType) { toast.error('Please select the gift card type.'); return; }
    }

    const payRef = payMethod === 'giftcard' ? giftCode : form.reference;
    const payMethodLabel = {
      crypto: 'Crypto (USDT/USDC)',
      geegpay: 'Geegpay Transfer',
      payoneer: 'Payoneer Transfer',
      bank: 'Bank Transfer',
      giftcard: `Gift Card (${selectedGiftType})`,
    }[payMethod];

    setLoading(true);

    const notesArr = [];
    if (form.notes) notesArr.push(form.notes);
    if (selectedAddons.length > 0) {
      const addonNames = ADDON_PRODUCTS.filter(a => selectedAddons.includes(a.id)).map(a => a.name);
      notesArr.push(`Add-ons: ${addonNames.join(', ')}`);
    }
    if (hasBulkItem) notesArr.push(`Bulk discount applied: -${BULK_DISCOUNT_PCT}%`);
    if (promoDiscount) notesArr.push(`Promo: ${promoDiscount.code} (-${format(promoSavings)})`);
    if (payMethod === 'giftcard') notesArr.push(`Gift card 5% auto-discount applied`);

    const { data: order, error } = await supabase.from('orders').insert({
      customer_name: form.name,
      customer_email: form.email || null,
      customer_phone: form.phone,
      shipping_country: country,
      shipping_address: form.address,
      shipping_city: form.city,
      shipping_province: form.state,
      shipping_zip: form.zip,
      delivery_type: delivery,
      verification_reference: payRef,
      verification_method: payMethodLabel,
      verification_status: 'Pending Verification',
      amount_paid: total,
      gift_card_code: payMethod === 'giftcard' ? giftCode : null,
      gift_card_type: payMethod === 'giftcard' ? selectedGiftType : null,
      notes: notesArr.join(' | ') || null,
    }).select().single();

    if (error || !order) {
      toast.error('Failed to place order. Please try again.');
      setLoading(false);
      return;
    }

    if (items.length > 0) {
      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          variant_id: item.variant?.id || null,
          quantity: item.quantity,
          price: item.variant?.price ?? item.product.base_price,
        }))
      );
    }

    await sendEmailNotification(order.id);
    clearCart();
    toast.success('Order placed! Please send your payment proof below.');

    // For gift card and crypto, show the proof message box instead of navigating
    if (payMethod === 'giftcard' || payMethod === 'crypto') {
      setCompletedOrderId(order.id);
      setLoading(false);
    } else {
      navigate(`/order-confirmation/${order.id}`);
    }
  };

  const InputClass = "w-full px-4 py-3 bg-[#F5F5F2] border border-[#E0E0DC] rounded-xl text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#E6C200] font-600 transition-colors";
  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="font-800 text-[#111111] text-base sm:text-lg">{title}</h2>
      {children}
    </div>
  );

  if (items.length === 0 && !completedOrderId) return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 px-4">
        <ShoppingBag className="w-16 h-16 text-[#CCCCCC]" />
        <h2 className="text-2xl font-800 text-[#111111]">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="px-6 py-3 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000]">
          Browse Products
        </button>
      </div>
    </div>
  );

  // ── POST-CHECKOUT PROOF MESSAGE SCREEN ──────────────────────────────
  if (completedOrderId) {
    return (
      <div className="min-h-screen bg-[#F5F5F2]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-14">
          <div className="bg-white border border-[#E0E0DC] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#111111] p-6 text-center">
              <div className="w-12 h-12 bg-[#E6C200] rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-xl font-900 text-white">Order Placed!</h2>
              <p className="text-sm text-[#888888] mt-1 font-mono break-all">#{completedOrderId.slice(0, 16)}...</p>
            </div>

            {/* Chat message area */}
            <div className="p-6 space-y-5">
              {!messageSent ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#E6C200] rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-black" />
                    </div>
                    <div className="bg-[#F5F5F2] rounded-2xl rounded-tl-none px-4 py-3 flex-1">
                      <p className="text-xs font-700 text-[#888888] mb-1">Ninjadaddy Admin</p>
                      <p className="text-sm text-[#111111] font-500 leading-relaxed">
                        Hi {form.name || 'there'}! 👋 Your order is received.
                        {payMethod === 'giftcard'
                          ? ' Please send proof of your gift card payment below — a screenshot or confirmation showing the card type, code and value.'
                          : ' Please paste your transaction hash or screenshot proof of payment below so we can verify quickly.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-700 text-[#555555] block">
                      {payMethod === 'giftcard'
                        ? 'Send gift card details / screenshot description'
                        : 'Send payment proof / transaction details'}
                    </label>
                    <textarea
                      value={proofMessage}
                      onChange={e => setProofMessage(e.target.value)}
                      rows={4}
                      placeholder={payMethod === 'giftcard'
                        ? 'E.g. "Amazon gift card $50 — code: XXXX-XXXX-XXXX-XXXX, screenshot sent to WhatsApp"'
                        : 'E.g. "Sent 0.032 ETH, TX Hash: 0x123...abc, from Binance"'}
                      className={`${InputClass} resize-none`}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSendProof}
                        disabled={!proofMessage.trim() || sendingMsg}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000] transition-colors disabled:opacity-50"
                      >
                        {sendingMsg
                          ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          : <><Send className="w-4 h-4" /> Send to Admin</>
                        }
                      </button>
                      <button
                        onClick={() => navigate(`/order-confirmation/${completedOrderId}`)}
                        className="px-4 py-3 border border-[#E0E0DC] text-[#888888] font-700 rounded-xl hover:border-[#E6C200] transition-colors text-sm"
                      >
                        Skip
                      </button>
                    </div>
                    <p className="text-xs text-center text-[#AAAAAA] font-500">
                      This message goes directly to admin. You can also reach us on WhatsApp.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-800 text-[#111111]">Message Sent!</p>
                  <p className="text-sm text-[#888888] font-500 mt-1">Admin will verify and confirm within 24h.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <CartDrawer />
      <WhatsAppBubble />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <h1 className="text-3xl sm:text-4xl font-900 text-[#111111] mb-1 tracking-tight">Checkout</h1>
        <p className="text-[#888888] font-500 mb-6 sm:mb-8">Gateway-free · Secure · Verified within 24h</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left */}
            <div className="lg:col-span-2 space-y-4">

              {/* Shipping Destination */}
              <SectionCard title="Shipping Destination">
                <div className="grid grid-cols-2 gap-3">
                  {(['United States', 'United Kingdom'] as Country[]).map(c => (
                    <button type="button" key={c} onClick={() => setCountry(c)}
                      className={`p-4 rounded-xl border-2 text-sm font-700 transition-all text-left ${country === c ? 'border-[#E6C200] bg-[#FFF9E0]' : 'border-[#E0E0DC] bg-white hover:border-[#E6C200]/50'}`}>
                      <span className="block text-xl mb-1">{c === 'United States' ? '🇺🇸' : '🇬🇧'}</span>
                      <span className="text-[#111111] text-xs sm:text-sm">{c}</span>
                      <span className="block text-xs text-[#888888] font-500 mt-0.5">{c === 'United States' ? '7–15 Business Days' : '6–10 Business Days'}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([['delivery', '🏠', 'Home Delivery', 'Shipped to your door'], ['pickup', '📦', 'Pickup Point', 'Collect at nearest point']] as [DeliveryType, string, string, string][]).map(([v, emoji, label, sub]) => (
                    <button type="button" key={v} onClick={() => setDelivery(v)}
                      className={`p-4 rounded-xl border-2 text-sm font-700 text-left transition-all ${delivery === v ? 'border-[#E6C200] bg-[#FFF9E0]' : 'border-[#E0E0DC] bg-white hover:border-[#E6C200]/50'}`}>
                      <span className="block text-xl mb-1">{emoji}</span>
                      <span className="text-[#111111] text-xs sm:text-sm">{label}</span>
                      <span className="block text-xs text-[#888888] font-500 mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Customer Info */}
              <SectionCard title="Customer Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-700 text-[#555555] block mb-1.5">Full Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" className={InputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-700 text-[#555555] block mb-1.5">Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className={InputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-700 text-[#555555] block mb-1.5">Phone Number *</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="+1 (555) 000-0000" className={InputClass} />
                  </div>
                </div>
              </SectionCard>

              {/* Shipping Address */}
              <SectionCard title="Shipping Address">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-700 text-[#555555] block mb-1.5">Street Address *</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} required placeholder="123 Main Street" className={InputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">City *</label>
                      <input type="text" name="city" value={form.city} onChange={handleChange} required className={InputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">{country === 'United States' ? 'State *' : 'County/Region *'}</label>
                      <input type="text" name="state" value={form.state} onChange={handleChange} required className={InputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-700 text-[#555555] block mb-1.5">{country === 'United States' ? 'ZIP Code *' : 'Postcode *'}</label>
                    <input type="text" name="zip" value={form.zip} onChange={handleChange} required className={InputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-700 text-[#555555] block mb-1.5">Order Notes (Optional)</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Any special instructions..." className={`${InputClass} resize-none`} />
                  </div>
                </div>
              </SectionCard>

              {/* PROMO CODE */}
              <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-[#E6C200]" />
                  <h2 className="font-800 text-[#111111]">Promo Code</h2>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    placeholder="Enter promo code (e.g. SAVE20)"
                    className={`${InputClass} pr-8 uppercase tracking-widest`}
                  />
                  {promoCode && (
                    <button
                      type="button"
                      onClick={() => { setPromoCode(''); setPromoStatus('idle'); setPromoDiscount(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#111111]"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {promoStatus === 'checking' && (
                  <p className="text-xs text-[#888888] mt-2 flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-[#888888] border-t-transparent rounded-full animate-spin inline-block" />
                    Validating code...
                  </p>
                )}
                {promoStatus === 'valid' && promoDiscount && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-700">
                      <span className="font-900">{promoDiscount.code}</span> applied —
                      {promoDiscount.percent_off ? ` ${promoDiscount.percent_off}% off` : ''}
                      {promoDiscount.fixed_off ? ` $${promoDiscount.fixed_off} off` : ''}
                      {' '}(saving {format(promoSavings)})
                    </p>
                  </div>
                )}
                {promoStatus === 'invalid' && promoCode && (
                  <p className="text-xs text-red-500 mt-2 font-700 flex items-center gap-1">
                    <XIcon className="w-3 h-3" /> Invalid or expired code.
                  </p>
                )}
              </div>

              {/* ADD-ON UPSELL */}
              <div className="bg-[#FFF9E0] border-2 border-[#E6C200] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-[#B8A000]" />
                  <h2 className="font-900 text-[#111111] text-base sm:text-lg">Add a Utility Fan — 30% Off!</h2>
                </div>
                <p className="text-sm text-[#888888] font-500 mb-4">Upgrade your order with a premium cooling fan at a special bundled discount.</p>
                <div className="space-y-3">
                  {ADDON_PRODUCTS.map(addon => (
                    <button type="button" key={addon.id} onClick={() => toggleAddon(addon.id)}
                      className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 sm:gap-4 ${
                        selectedAddons.includes(addon.id)
                          ? 'border-[#E6C200] bg-white'
                          : 'border-[#F0E8B0] bg-white/60 hover:border-[#E6C200]/70'
                      }`}>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedAddons.includes(addon.id) ? 'bg-[#E6C200] text-black' : 'bg-[#F5F5F2] text-[#888888]'}`}>
                        {addon.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-800 text-[#111111] text-xs sm:text-sm">{addon.name}</p>
                        <p className="text-xs text-[#888888] font-500 mt-0.5 hidden sm:block">{addon.persona}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[#AAAAAA] line-through font-500">{format(addon.price)}</p>
                        <p className="text-sm sm:text-base font-900 text-[#111111]">{format(addon.discountedPrice)}</p>
                        <p className="text-xs font-700 text-green-600">-30%</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedAddons.includes(addon.id) ? 'bg-[#E6C200] border-[#E6C200]' : 'border-[#CCCCCC]'}`}>
                        {selectedAddons.includes(addon.id) && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-3 h-3"><path d="M1 4l3 3 5-6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <SectionCard title="Payment Method">
                {/* Gift card auto-discount notice */}
                <div className="p-3 bg-[#FFF9E0] border border-[#E6C200]/50 rounded-xl flex items-start gap-2">
                  <Gift className="w-4 h-4 text-[#B8A000] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-800 text-[#B8A000]">Gift Card = 5% Extra Off Automatically</p>
                    <p className="text-xs text-[#888888] font-500 mt-0.5">Select "Gift Card" as payment and get an instant 5% discount on your order total.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {([
                    ['crypto', '₿', 'Crypto'],
                    ['geegpay', '🌍', 'Geegpay'],
                    ['payoneer', '💳', 'Payoneer'],
                    ['bank', '🏦', 'Bank'],
                    ['giftcard', '🎁', 'Gift Card'],
                  ] as [PayMethod, string, string][]).map(([v, emoji, label]) => (
                    <button type="button" key={v} onClick={() => setPayMethod(v)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-xs font-700 transition-all ${payMethod === v ? 'border-[#E6C200] bg-[#FFF9E0] text-[#111111]' : 'border-[#E0E0DC] bg-white text-[#888888] hover:border-[#E6C200]/50'}`}>
                      <span className="text-base">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {payMethod === 'crypto' && (
                  <div className="p-4 sm:p-5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-xl space-y-3">
                    <p className="text-sm font-800 text-[#111111]">Crypto Payment (USDT/USDC)</p>
                    <p className="text-sm text-[#555555] font-500">Send exactly <span className="font-800 text-[#111111]">${total.toFixed(2)} USDT</span> via {settings['crypto_network'] || 'Polygon/BSC'} to:</p>
                    <div className="flex items-center gap-2 p-3 bg-white border border-[#E0E0DC] rounded-xl">
                      <code className="text-xs text-[#111111] flex-1 break-all font-mono font-600">{cryptoWallet || 'Wallet address not configured'}</code>
                      <button type="button" onClick={copyWallet} className="p-2 bg-[#F5F5F2] hover:bg-[#E6C200] rounded-lg transition-colors flex-shrink-0">
                        {copiedWallet ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-[#888888]" />}
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">Transaction Hash (TX ID) *</label>
                      <input type="text" name="reference" value={form.reference} onChange={handleChange}
                        placeholder="0x... paste your transaction hash" className={InputClass} />
                    </div>
                    <p className="text-xs text-[#888888] font-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      💬 After placing order, you'll be prompted to send payment proof directly to admin.
                    </p>
                  </div>
                )}

                {payMethod === 'geegpay' && (
                  <div className="p-4 sm:p-5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌍</span>
                      <p className="text-sm font-800 text-[#111111]">Geegpay Transfer</p>
                    </div>
                    <p className="text-sm text-[#555555] font-500">Send <span className="font-800 text-[#111111]">${total.toFixed(2)}</span> via Geegpay:</p>
                    <div className="p-3 bg-white border border-[#E0E0DC] rounded-xl">
                      <p className="text-sm text-[#111111] font-600 whitespace-pre-wrap">{geegpayInfo || 'Contact admin for Geegpay account details'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">Geegpay Transfer Reference *</label>
                      <input type="text" name="reference" value={form.reference} onChange={handleChange}
                        placeholder="Enter your Geegpay transaction reference" className={InputClass} />
                    </div>
                  </div>
                )}

                {payMethod === 'payoneer' && (
                  <div className="p-4 sm:p-5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💳</span>
                      <p className="text-sm font-800 text-[#111111]">Payoneer Transfer</p>
                    </div>
                    <p className="text-sm text-[#555555] font-500">Send <span className="font-800 text-[#111111]">${total.toFixed(2)}</span> to this Payoneer account:</p>
                    <div className="p-3 bg-white border border-[#E0E0DC] rounded-xl">
                      <p className="text-sm text-[#111111] font-700 font-mono">{payoneerEmail || 'Payoneer email not configured — check Admin Settings'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">Your Payoneer Account / Reference *</label>
                      <input type="text" name="reference" value={form.reference} onChange={handleChange}
                        placeholder="Your Payoneer email or transaction reference" className={InputClass} />
                    </div>
                  </div>
                )}

                {payMethod === 'bank' && (
                  <div className="p-4 sm:p-5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-xl space-y-3">
                    <p className="text-sm font-800 text-[#111111]">Bank Transfer</p>
                    {bankAccounts.length > 0 ? bankAccounts.map(bank => (
                      <div key={bank.id} className="p-4 bg-white border border-[#E0E0DC] rounded-xl space-y-1.5">
                        <p className="text-sm font-800 text-[#111111]">{bank.bank_name} <span className="text-[#E6C200] font-700">({bank.currency})</span></p>
                        <p className="text-sm text-[#555555] font-500">Account: <span className="font-700 text-[#111111]">{bank.account_number}</span></p>
                        <p className="text-sm text-[#555555] font-500">Name: <span className="font-700 text-[#111111]">{bank.account_name}</span></p>
                        {bank.routing_number && <p className="text-xs text-[#888888] font-500">Routing: <span className="font-600 text-[#555555]">{bank.routing_number}</span></p>}
                        {bank.sort_code && <p className="text-xs text-[#888888] font-500">Sort Code: <span className="font-600 text-[#555555]">{bank.sort_code}</span></p>}
                        {bank.notes && <p className="text-xs font-700 text-[#E6C200] mt-2">{bank.notes}</p>}
                      </div>
                    )) : (
                      <p className="text-sm text-[#888888] font-500">Bank account details not configured. Contact support.</p>
                    )}
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">Payment Reference / Your Name *</label>
                      <input type="text" name="reference" value={form.reference} onChange={handleChange}
                        placeholder="Name used for the bank transfer" className={InputClass} />
                    </div>
                  </div>
                )}

                {payMethod === 'giftcard' && (
                  <div className="p-4 sm:p-5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-xl space-y-3">
                    {/* 5% auto-discount highlight */}
                    <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm font-800 text-green-700">5% auto-discount applied to this order!</p>
                    </div>
                    <p className="text-sm font-800 text-[#111111]">E-Gift Card Payment</p>
                    <p className="text-xs text-[#888888] font-500">We accept Amazon, Apple, Google Play, and other major gift cards. Admin will verify the card value manually. You'll be prompted to send proof after checkout.</p>
                    <div className="grid grid-cols-4 gap-2">
                      {GIFT_CARD_TYPES.map(gc => (
                        <button type="button" key={gc.id} onClick={() => setSelectedGiftType(gc.id)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${selectedGiftType === gc.id ? 'border-[#E6C200] bg-[#FFF9E0]' : 'border-[#E0E0DC] bg-white hover:border-[#E6C200]/50'}`}>
                          <p className="text-lg">{gc.emoji}</p>
                          <p className="text-xs font-700 text-[#111111] mt-1 leading-none">{gc.name}</p>
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-700 text-[#555555] block mb-1.5">Gift Card Code *</label>
                      <input type="text" value={giftCode} onChange={e => setGiftCode(e.target.value)}
                        placeholder="Enter gift card redemption code" className={InputClass} />
                    </div>
                    <p className="text-xs text-[#888888] font-500 italic bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      💬 After placing your order, you'll be prompted to send photo proof of the gift card directly to admin for verification.
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Right - Order Summary */}
            <div>
              <div className="sticky top-20 bg-white border border-[#E0E0DC] rounded-2xl p-5 space-y-4">
                <h2 className="font-800 text-[#111111] text-lg">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
                  {items.map(item => {
                    const itemPrice = item.variant?.price ?? item.product.base_price;
                    return (
                      <div key={item.cartKey} className="flex gap-2.5">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-[#F0F0ED] rounded-xl flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-700 text-[#111111] line-clamp-1">{item.product.title}</p>
                          {item.variant && <p className="text-xs text-[#888888] font-500">{[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}</p>}
                          <p className="text-xs font-800 text-[#111111]">{format(itemPrice)} × {item.quantity}</p>
                          {item.quantity >= BULK_QTY_THRESHOLD && (
                            <p className="text-xs text-green-600 font-700">🎉 Bulk 10% off applied</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add-ons */}
                {selectedAddons.length > 0 && (
                  <div className="border-t border-[#F0F0ED] pt-3 space-y-1.5">
                    <p className="text-xs font-700 text-[#888888]">Add-ons (30% off)</p>
                    {ADDON_PRODUCTS.filter(a => selectedAddons.includes(a.id)).map(a => (
                      <div key={a.id} className="flex justify-between text-xs">
                        <span className="text-[#555555] font-600 truncate">{a.name}</span>
                        <span className="font-800 text-[#111111] ml-2">{format(a.discountedPrice)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-[#E0E0DC] pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888] font-600">Subtotal</span>
                    <span className="font-700 text-[#111111]">{format(subtotal)}</span>
                  </div>
                  {addonTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888888] font-600">Add-ons</span>
                      <span className="font-700 text-[#111111]">{format(addonTotal)}</span>
                    </div>
                  )}
                  {hasBulkItem && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-700">Bulk Discount (×2) 🎉</span>
                      <span className="font-800">-{format(bulkSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888] font-600">Shipping {country === 'United States' ? '🇺🇸' : '🇬🇧'}</span>
                    <span className="font-700 text-[#111111]">{format(shippingFee)}</span>
                  </div>
                  {promoSavings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-700 flex items-center gap-1"><Tag className="w-3 h-3" /> {promoDiscount?.code}</span>
                      <span className="font-800">-{format(promoSavings)}</span>
                    </div>
                  )}
                  {giftCardSavings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-700 flex items-center gap-1"><Gift className="w-3 h-3" /> Gift Card 5%</span>
                      <span className="font-800">-{format(giftCardSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-900 text-lg border-t border-[#E0E0DC] pt-2">
                    <span className="text-[#111111]">Total</span>
                    <span className="text-[#111111]">{displayTotal || format(total)}</span>
                  </div>
                  <p className="text-xs text-[#AAAAAA] font-500">≈ USD ${total.toFixed(2)}</p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#E6C200] text-black font-900 text-base rounded-2xl hover:bg-[#B8A000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><ArrowRight className="w-5 h-5" /> Confirm & Place Order</>
                  )}
                </button>
                <p className="text-xs text-center text-[#AAAAAA] font-500">Gateway-free. Manual verification within 24h.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
