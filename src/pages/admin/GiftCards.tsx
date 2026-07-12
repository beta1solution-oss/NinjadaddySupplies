import { useState, useEffect } from 'react';
import { Plus, Gift, Check, X, Search } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/utils';
import type { GiftCard } from '@/types';
import { toast } from 'sonner';

const CARD_TYPES = ['Amazon', 'Google Play', 'Apple/iTunes', 'Steam', 'PayPal', 'Visa Gift', 'eBay', 'Walmart', 'Other'];

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 16 }, (_, i) => (i > 0 && i % 4 === 0 ? '-' : '') + chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminGiftCards() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [form, setForm] = useState({ code: generateCode(), card_type: 'Amazon', amount: '25' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false });
    if (data) setCards(data as GiftCard[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.amount) return;
    setSaving(true);
    const { error } = await supabase.from('gift_cards').insert({ code: form.code.toUpperCase(), card_type: form.card_type, amount: parseFloat(form.amount) });
    if (error) { toast.error(error.message.includes('unique') ? 'Code already exists' : error.message); }
    else { toast.success('Gift card created'); setForm({ code: generateCode(), card_type: 'Amazon', amount: '25' }); load(); }
    setSaving(false);
  };

  const markUsed = async (id: string, isUsed: boolean) => {
    await supabase.from('gift_cards').update({ is_used: !isUsed, used_at: !isUsed ? new Date().toISOString() : null }).eq('id', id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gift card?')) return;
    await supabase.from('gift_cards').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  const filtered = cards.filter(c => {
    const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.card_type.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'used' ? c.is_used : !c.is_used);
    return matchSearch && matchFilter;
  });

  const stats = { total: cards.length, used: cards.filter(c => c.is_used).length, unused: cards.filter(c => !c.is_used).length, value: cards.filter(c => !c.is_used).reduce((s, c) => s + c.amount, 0) };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-brand-off-white">Gift Cards</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Cards', value: stats.total, color: 'text-brand-yellow' },
            { label: 'Active', value: stats.unused, color: 'text-green-400' },
            { label: 'Used', value: stats.used, color: 'text-brand-muted' },
            { label: 'Active Value', value: formatPrice(stats.value), color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 bg-brand-surface border border-brand-border rounded-2xl">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-brand-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Create Form */}
        <div className="p-5 bg-brand-surface border border-brand-border rounded-2xl">
          <h2 className="font-bold text-brand-off-white mb-4 flex items-center gap-2"><Gift className="w-4 h-4 text-brand-yellow" /> Generate Gift Card</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-brand-muted block mb-1">Code</label>
              <div className="flex gap-2">
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="flex-1 px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-sm font-mono text-brand-off-white focus:outline-none focus:border-brand-yellow/50" />
                <button type="button" onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                  className="px-3 py-2.5 bg-brand-surface2 border border-brand-border rounded-xl text-xs text-brand-muted hover:text-brand-yellow transition-colors">
                  Gen
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-brand-muted block mb-1">Card Type</label>
              <select value={form.card_type} onChange={e => setForm(f => ({ ...f, card_type: e.target.value }))}
                className="w-full px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-sm text-brand-off-white focus:outline-none focus:border-brand-yellow/50">
                {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-muted block mb-1">Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="1"
                className="w-full px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-sm text-brand-off-white focus:outline-none focus:border-brand-yellow/50" />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-yellow text-black font-bold rounded-xl hover:bg-brand-yellow-dim transition-colors disabled:opacity-60">
                <Plus className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Gift Card'}
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or type..."
              className="w-full pl-9 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-off-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow/50" />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-brand-border">
            {(['all', 'unused', 'used'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-brand-yellow text-black' : 'bg-brand-surface text-brand-muted hover:text-brand-off-white'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-brand-surface rounded-xl animate-pulse border border-brand-border" />)}</div>
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-brand-border">
                  {['Code', 'Type', 'Amount', 'Status', 'Order', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-brand-muted font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-brand-border">
                  {filtered.map(card => (
                    <tr key={card.id} className="hover:bg-brand-surface2 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-brand-yellow font-bold">{card.code}</td>
                      <td className="px-4 py-3 text-brand-off-white text-sm">{card.card_type}</td>
                      <td className="px-4 py-3 font-bold text-green-400">{formatPrice(card.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.is_used ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                          {card.is_used ? 'Used' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted font-mono">{card.order_id ? card.order_id.slice(0, 8) + '...' : '—'}</td>
                      <td className="px-4 py-3 text-xs text-brand-muted">{formatDate(card.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => markUsed(card.id, card.is_used)} title={card.is_used ? 'Mark Unused' : 'Mark Used'}
                            className={`p-1.5 rounded-lg transition-colors ${card.is_used ? 'text-brand-muted hover:text-brand-yellow' : 'text-green-400 hover:text-green-300'}`}>
                            {card.is_used ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(card.id)} className="p-1.5 text-brand-muted hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-brand-muted">No gift cards found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
