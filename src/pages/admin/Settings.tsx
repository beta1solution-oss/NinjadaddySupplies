import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Eye, EyeOff, KeyRound, Star, ExternalLink, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import type { BankAccount } from '@/types';
import { toast } from 'sonner';

type SettingsMap = Record<string, string>;

interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
  country?: string;
}

const SOCIAL_KEYS = [
  { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage', color: '#1877F2' },
  { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle', color: '#aaaaaa' },
  { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', color: '#E1306C' },
  { key: 'social_x', label: 'X / Twitter', placeholder: 'https://x.com/yourhandle', color: '#aaaaaa' },
  { key: 'social_whatsapp', label: 'WhatsApp (Social Link)', placeholder: 'https://wa.me/yournumber', color: '#25D366' },
  { key: 'social_shopify', label: 'Shopify Store', placeholder: 'https://yourstore.myshopify.com', color: '#96BF48' },
];

const PAYMENT_KEYS = [
  { key: 'crypto_wallet', label: 'Crypto Wallet Address (USDT/USDC)', placeholder: '0x...' },
  { key: 'crypto_network', label: 'Accepted Networks', placeholder: 'Polygon / BSC' },
  { key: 'geegpay_info', label: 'Geegpay Account Details (shown to customer)', placeholder: 'e.g. Geegpay Tag: @ninjadaddy or account number' },
  { key: 'payoneer_email', label: 'Payoneer Email / Account', placeholder: 'yourname@payoneer.com' },
  { key: 'whatsapp_number', label: 'WhatsApp Support Number', placeholder: '+2348101147123' },
  { key: 'whatsapp_greeting', label: 'WhatsApp Pre-filled Greeting', placeholder: 'Hello! I have a question...' },
  { key: 'us_shipping_fee', label: 'US Shipping Fee ($)', placeholder: '5.99' },
  { key: 'uk_shipping_fee', label: 'UK Shipping Fee ($)', placeholder: '7.99' },
];

const EMAILJS_STEPS = [
  { step: 1, title: 'Create EmailJS Account', desc: 'Go to emailjs.com and sign up for a free account. Free tier allows 200 emails/month.', link: 'https://emailjs.com', linkLabel: 'Open EmailJS' },
  { step: 2, title: 'Add an Email Service', desc: 'In EmailJS dashboard → Email Services → Add New Service. Connect your Gmail or any SMTP. Copy the Service ID shown (e.g. service_abc123).', link: null, linkLabel: null },
  { step: 3, title: 'Create an Email Template', desc: 'Go to Email Templates → Create New Template. Use these exact variables in your template body:', link: null, linkLabel: null },
  { step: 4, title: 'Copy IDs to Settings Below', desc: 'Paste your Service ID and Template ID in the fields below. Your Public Key is already pre-filled.', link: null, linkLabel: null },
];

const TEMPLATE_VARS = [
  { var: '{{order_id}}', desc: 'Unique order identifier' },
  { var: '{{customer_name}}', desc: 'Customer full name' },
  { var: '{{customer_email}}', desc: 'Customer email address' },
  { var: '{{order_status}}', desc: 'Current order status' },
  { var: '{{amount_total}}', desc: 'Total amount paid' },
  { var: '{{payment_method}}', desc: 'Payment method used' },
  { var: '{{shipping_address}}', desc: 'Delivery address' },
  { var: '{{shipping_country}}', desc: 'Destination country' },
  { var: '{{tracking_number}}', desc: 'Courier tracking number' },
  { var: '{{tracking_link}}', desc: 'Direct 17TRACK link' },
];

export default function AdminSettings() {
  const { updatePassword } = useAdmin();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [newBank, setNewBank] = useState<Partial<BankAccount>>({ bank_name: '', account_name: '', account_number: '', country: '', currency: 'USD' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState<Review>({ name: '', rating: 5, text: '', date: '', country: '' });
  const [emailGuideOpen, setEmailGuideOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('key, value');
      if (data) {
        const map: SettingsMap = {};
        data.forEach(s => { if (s.value !== null) map[s.key] = s.value; });
        setSettings(map);
        try { setBankAccounts(JSON.parse(map['bank_accounts'] || '[]')); } catch { setBankAccounts([]); }
        try {
          const r = JSON.parse(map['product_reviews'] || '[]');
          if (Array.isArray(r)) setReviews(r);
        } catch { setReviews([]); }
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (!error) { setSettings(prev => ({ ...prev, [key]: value })); toast.success('Saved!'); }
    else toast.error('Failed to save');
    setSaving(null);
  };

  const saveBankAccounts = async (accounts: BankAccount[]) => {
    setBankAccounts(accounts);
    await saveSetting('bank_accounts', JSON.stringify(accounts));
  };

  const addBank = () => {
    if (!newBank.bank_name || !newBank.account_number) { toast.error('Bank name and account number required'); return; }
    const account: BankAccount = { id: Date.now().toString(), bank_name: newBank.bank_name!, account_name: newBank.account_name!, account_number: newBank.account_number!, routing_number: newBank.routing_number, sort_code: newBank.sort_code, swift_code: newBank.swift_code, country: newBank.country!, currency: newBank.currency!, notes: newBank.notes };
    saveBankAccounts([...bankAccounts, account]);
    setNewBank({ bank_name: '', account_name: '', account_number: '', country: '', currency: 'USD' });
  };

  const removeBank = (id: string) => saveBankAccounts(bankAccounts.filter(b => b.id !== id));

  const addReview = async () => {
    if (!newReview.name || !newReview.text) { toast.error('Name and review text required'); return; }
    const updated = [...reviews, { ...newReview, date: newReview.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }];
    await saveSetting('product_reviews', JSON.stringify(updated));
    setReviews(updated);
    setNewReview({ name: '', rating: 5, text: '', date: '', country: '' });
  };

  const removeReview = async (i: number) => {
    const updated = reviews.filter((_, idx) => idx !== i);
    await saveSetting('product_reviews', JSON.stringify(updated));
    setReviews(updated);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setChangingPass(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated successfully');
      setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    }
    setChangingPass(false);
  };

  const hasEmailjsConfigured = settings['emailjs_service_id'] && settings['emailjs_template_id'];

  const inputCls = "w-full px-3 py-2.5 bg-[#161616] border border-[#3A3A3A] rounded-xl text-sm text-[#EEEEEE] placeholder-[#555555] focus:outline-none focus:border-[#FFCC00]/60 transition-colors";

  const Section = ({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="bg-[#222222] border border-[#333333] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2E2E2E] bg-[#1C1C1C] flex items-center justify-between">
        <h2 className="font-bold text-[#EEEEEE] text-sm">{title}</h2>
        {badge}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const SettingInput = ({ settingKey, label, placeholder, type = 'text' }: { settingKey: string; label: string; placeholder: string; type?: string }) => {
    const [val, setVal] = useState(settings[settingKey] || '');
    useEffect(() => setVal(settings[settingKey] || ''), [settings[settingKey]]);
    return (
      <div>
        <label className="text-xs text-[#999999] font-600 block mb-1.5">{label}</label>
        <div className="flex gap-2">
          <input type={type} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} className={`${inputCls} flex-1`} />
          <button onClick={() => saveSetting(settingKey, val)} disabled={saving === settingKey}
            className="px-3 py-2.5 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors disabled:opacity-60 flex-shrink-0">
            {saving === settingKey ? '...' : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  };

  const TextAreaSetting = ({ settingKey, label }: { settingKey: string; label: string }) => {
    const [val, setVal] = useState(settings[settingKey] || '');
    useEffect(() => setVal(settings[settingKey] || ''), [settings[settingKey]]);
    return (
      <div>
        <label className="text-xs text-[#999999] font-600 block mb-1.5">{label}</label>
        <textarea value={val} onChange={e => setVal(e.target.value)} rows={5}
          className={`${inputCls} resize-none w-full`} />
        <button onClick={() => saveSetting(settingKey, val)} disabled={saving === settingKey}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving === settingKey ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  };

  if (loading) return <AdminLayout><div className="text-center py-20 text-[#888888]">Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-[#F5F5F7]">Settings</h1>

        {/* ─── EmailJS Section ─── */}
        <Section
          title="📧 Email Notifications (EmailJS)"
          badge={
            hasEmailjsConfigured
              ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-700"><CheckCircle2 className="w-3.5 h-3.5" />Configured</span>
              : <span className="text-xs text-amber-400 font-600 bg-amber-400/10 px-2 py-0.5 rounded-full">Setup Required</span>
          }
        >
          {/* Step-by-step guide toggle */}
          <button
            onClick={() => setEmailGuideOpen(o => !o)}
            className="w-full flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#FFCC00]/20 rounded-xl text-sm text-[#FFCC00] font-700 hover:bg-[#FFCC00]/5 transition-colors"
          >
            <span>📋 EmailJS Setup Guide (Step-by-Step)</span>
            {emailGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {emailGuideOpen && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Steps */}
              {EMAILJS_STEPS.map(({ step, title, desc, link, linkLabel }) => (
                <div key={step} className="flex gap-3 p-3.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl">
                  <div className="w-7 h-7 bg-[#FFCC00] text-black rounded-full flex items-center justify-center font-900 text-xs flex-shrink-0">{step}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-700 text-[#EEEEEE] mb-1">{title}</p>
                    <p className="text-xs text-[#999999] leading-relaxed">{desc}</p>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-[#FFCC00] hover:underline font-700">
                        {linkLabel} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {step === 3 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {TEMPLATE_VARS.map(({ var: v, desc: d }) => (
                          <div key={v} className="flex items-start gap-2 p-1.5 bg-[#222222] rounded-lg">
                            <code className="text-[#FFCC00] text-xs font-mono flex-shrink-0">{v}</code>
                            <span className="text-[#777777] text-xs">{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Sample template */}
              <div className="p-3 bg-[#111111] border border-[#2E2E2E] rounded-xl">
                <p className="text-xs font-700 text-[#FFCC00] mb-2">📝 Sample Template Subject & Body</p>
                <p className="text-xs text-[#777777] mb-1"><strong className="text-[#999999]">Subject:</strong> Your Ninjadaddy Order Update — {'{{order_status}}'}</p>
                <p className="text-xs text-[#777777] leading-relaxed">
                  <strong className="text-[#999999]">Body:</strong><br />
                  Hi {'{{customer_name}}'}!<br /><br />
                  {'{{order_status}}'} — Order #{'{{order_id}}'}<br />
                  Amount: {'{{amount_total}}'} | Method: {'{{payment_method}}'}<br />
                  Tracking: {'{{tracking_number}}'}<br />
                  Track here: {'{{tracking_link}}'}<br /><br />
                  Shipping to: {'{{shipping_address}}'}, {'{{shipping_country}}'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-[#2E2E2E]">
            <p className="text-xs text-[#777777]">Enter your EmailJS credentials below. These are used to send automatic order emails to customers.</p>
            <SettingInput settingKey="emailjs_service_id" label="Service ID (e.g. service_abc123)" placeholder="service_xxxxxxx" />
            <SettingInput settingKey="emailjs_template_id" label="Template ID (e.g. template_abc123)" placeholder="template_xxxxxxx" />
            <SettingInput settingKey="emailjs_public_key" label="Public Key" placeholder="h7UDz0N4LIdd94R9O" />
            <SettingInput settingKey="emailjs_to_email" label="Admin Notification Email" placeholder="ninjadaddy@gmail.com" />
          </div>
        </Section>

        {/* Payment Settings */}
        <Section title="💳 Payment Settings">
          {PAYMENT_KEYS.map(({ key, label, placeholder }) => (
            <SettingInput key={key} settingKey={key} label={label} placeholder={placeholder} />
          ))}
        </Section>

        {/* Bank Accounts */}
        <Section title="🏦 Bank Transfer Accounts">
          <div className="space-y-3">
            {bankAccounts.map(bank => (
              <div key={bank.id} className="p-3 bg-[#161616] border border-[#2E2E2E] rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#EEEEEE]">{bank.bank_name} <span className="text-xs text-[#FFCC00]">({bank.currency})</span></p>
                    <p className="text-xs text-[#888888]">Account: {bank.account_number} — {bank.account_name}</p>
                    {bank.routing_number && <p className="text-xs text-[#888888]">Routing: {bank.routing_number}</p>}
                    {bank.sort_code && <p className="text-xs text-[#888888]">Sort: {bank.sort_code}</p>}
                    {bank.swift_code && <p className="text-xs text-[#888888]">SWIFT: {bank.swift_code}</p>}
                    {bank.notes && <p className="text-xs text-[#FFCC00]">{bank.notes}</p>}
                  </div>
                  <button onClick={() => removeBank(bank.id)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#2E2E2E] pt-4">
            <p className="text-xs font-bold text-[#FFCC00] mb-3">Add New Bank Account</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Bank Name', 'bank_name', 'e.g. Chase Bank'],
                ['Account Name', 'account_name', 'Account holder name'],
                ['Account Number / IBAN', 'account_number', ''],
                ['Routing # (US)', 'routing_number', ''],
                ['Sort Code (UK)', 'sort_code', ''],
                ['SWIFT/BIC', 'swift_code', ''],
                ['Country', 'country', 'US / UK'],
                ['Currency', 'currency', 'USD / GBP'],
              ].map(([label, field, placeholder]) => (
                <div key={field}>
                  <label className="text-xs text-[#999999] font-600 block mb-1">{label}</label>
                  <input value={newBank[field as keyof BankAccount] as string || ''} onChange={e => setNewBank(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-[#999999] font-600 block mb-1">Notes (shown to customer)</label>
                <input value={newBank.notes || ''} onChange={e => setNewBank(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Include your Order ID as reference" className={inputCls} />
              </div>
            </div>
            <button onClick={addBank} className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors">
              <Plus className="w-4 h-4" /> Add Bank Account
            </button>
          </div>
        </Section>

        {/* Social Links */}
        <Section title="🌐 Social Media Links">
          {SOCIAL_KEYS.map(({ key, label, placeholder, color }) => (
            <div key={key}>
              <label className="text-xs font-600 block mb-1.5" style={{ color }}>{label}</label>
              <div className="flex gap-2">
                <input defaultValue={settings[key] || ''} key={settings[key]}
                  onBlur={e => { if (e.target.value !== settings[key]) saveSetting(key, e.target.value); }}
                  placeholder={placeholder} className={`${inputCls} flex-1`} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#333333] flex-shrink-0" style={{ backgroundColor: color + '22' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* Reviews Management */}
        <Section title="⭐ Customer Reviews">
          <p className="text-xs text-[#888888]">These reviews appear on all product detail pages.</p>
          <div className="space-y-2">
            {reviews.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#161616] border border-[#2E2E2E] rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-bold text-[#EEEEEE]">{r.name}</p>
                    {r.country && <span className="text-xs text-[#777777]">{r.country}</span>}
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-[#FFCC00] fill-[#FFCC00]' : 'text-[#3A3A3A]'}`} />)}
                    </div>
                  </div>
                  <p className="text-xs text-[#888888] line-clamp-1">{r.text}</p>
                </div>
                <button onClick={() => removeReview(i)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-xs text-[#666666] text-center py-4">No reviews added yet. Add some below to show social proof.</p>
            )}
          </div>
          <div className="border-t border-[#2E2E2E] pt-4 space-y-3">
            <p className="text-xs font-bold text-[#FFCC00]">Add Review</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#999999] font-600 block mb-1">Reviewer Name</label>
                <input value={newReview.name} onChange={e => setNewReview(r => ({ ...r, name: e.target.value }))} className={inputCls} placeholder="John D." />
              </div>
              <div>
                <label className="text-xs text-[#999999] font-600 block mb-1">Country (optional)</label>
                <input value={newReview.country || ''} onChange={e => setNewReview(r => ({ ...r, country: e.target.value }))} className={inputCls} placeholder="🇺🇸 United States" />
              </div>
              <div>
                <label className="text-xs text-[#999999] font-600 block mb-1">Rating</label>
                <select value={newReview.rating} onChange={e => setNewReview(r => ({ ...r, rating: Number(e.target.value) }))}
                  className={inputCls}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n} className="bg-[#222222]">{n} Star{n !== 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#999999] font-600 block mb-1">Date (optional)</label>
                <input value={newReview.date} onChange={e => setNewReview(r => ({ ...r, date: e.target.value }))} className={inputCls} placeholder="Jan 2025" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#999999] font-600 block mb-1">Review Text</label>
                <textarea value={newReview.text} onChange={e => setNewReview(r => ({ ...r, text: e.target.value }))} rows={3} className={`${inputCls} resize-none w-full`} placeholder="Great product! Fast delivery..." />
              </div>
            </div>
            <button onClick={addReview} className="flex items-center gap-2 px-4 py-2.5 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors">
              <Star className="w-4 h-4" /> Add Review
            </button>
          </div>
        </Section>

        {/* Policy */}
        <Section title="📄 Terms & Privacy">
          <TextAreaSetting settingKey="terms_of_service" label="Terms of Service" />
          <TextAreaSetting settingKey="privacy_policy" label="Privacy Policy" />
        </Section>

        {/* Password Change */}
        <Section title="🔐 Change Admin Password">
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="text-xs text-[#999999] font-600 block mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#EEEEEE] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#999999] font-600 block mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} />
            </div>
            <button type="submit" disabled={changingPass}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FFCC00] text-black font-bold rounded-xl hover:bg-[#E6B800] disabled:opacity-60 transition-colors">
              <KeyRound className="w-4 h-4" /> {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Section>
      </div>
    </AdminLayout>
  );
}
