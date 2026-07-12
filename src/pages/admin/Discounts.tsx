import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Tag, Check, X, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { DiscountCode } from '@/types';
import { toast } from 'sonner';

const inputCls = "w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm text-[#F5F5F7] placeholder-[#666666] focus:outline-none focus:border-[#FFCC00]/50 transition-colors";

const emptyForm = { code: '', percent_off: '', fixed_off: '', expiry: '', is_active: true };

export default function AdminDiscounts() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCode, setEditCode] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    if (data) setCodes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditCode(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (c: DiscountCode) => {
    setEditCode(c);
    setForm({
      code: c.code,
      percent_off: c.percent_off != null ? String(c.percent_off) : '',
      fixed_off: c.fixed_off != null ? String(c.fixed_off) : '',
      expiry: c.expiry ? c.expiry.slice(0, 16) : '',
      is_active: c.is_active
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Code is required'); return; }
    if (!form.percent_off && !form.fixed_off) { toast.error('Enter either percent off or fixed off amount'); return; }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      percent_off: form.percent_off ? parseFloat(form.percent_off) : null,
      fixed_off: form.fixed_off ? parseFloat(form.fixed_off) : null,
      expiry: form.expiry ? new Date(form.expiry).toISOString() : null,
      is_active: form.is_active,
    };
    if (editCode) {
      const { error } = await supabase.from('discount_codes').update(payload).eq('id', editCode.id);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Discount code updated!');
    } else {
      const { error } = await supabase.from('discount_codes').insert(payload);
      if (error) {
        if (error.code === '23505') toast.error('Code already exists');
        else toast.error('Failed to create');
        setSaving(false); return;
      }
      toast.success('Discount code created!');
    }
    setModalOpen(false); setSaving(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  const toggleActive = async (code: DiscountCode) => {
    await supabase.from('discount_codes').update({ is_active: !code.is_active }).eq('id', code.id);
    load();
  };

  const isExpired = (expiry: string | null) => expiry && new Date(expiry) < new Date();

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7]">Discount Codes</h1>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Code</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#222222] rounded-xl animate-pulse border border-[#333333]" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-20 bg-[#222222] border border-[#333333] rounded-2xl">
            <Tag className="w-12 h-12 text-[#444444] mx-auto mb-3" />
            <p className="text-[#888888] font-600">No discount codes yet</p>
            <p className="text-xs text-[#666666] mt-1">Create promo codes to boost conversions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map(code => (
              <div key={code.id}
                className={`p-4 bg-[#222222] border rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${
                  isExpired(code.expiry) ? 'border-red-500/30 opacity-70' :
                  code.is_active ? 'border-[#333333] hover:border-[#FFCC00]/30' : 'border-[#333333] opacity-60'
                }`}>
                {/* Code */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-[#FFCC00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-900 text-[#F5F5F7] text-base font-mono">{code.code}</p>
                      {code.is_active && !isExpired(code.expiry) && (
                        <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-700">ACTIVE</span>
                      )}
                      {isExpired(code.expiry) && (
                        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-700">EXPIRED</span>
                      )}
                      {!code.is_active && !isExpired(code.expiry) && (
                        <span className="text-xs bg-[#333333] text-[#888888] px-2 py-0.5 rounded-full font-700">DISABLED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {code.percent_off != null && (
                        <p className="text-sm text-[#FFCC00] font-700">{code.percent_off}% off</p>
                      )}
                      {code.fixed_off != null && (
                        <p className="text-sm text-[#FFCC00] font-700">${code.fixed_off} off</p>
                      )}
                      {code.expiry && (
                        <p className="text-xs text-[#888888] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires {new Date(code.expiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <button onClick={() => toggleActive(code)}
                    className={`p-2 rounded-lg border transition-all ${code.is_active ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400' : 'bg-[#2A2A2A] border-[#444444] text-[#888888] hover:border-[#FFCC00]/30 hover:text-[#FFCC00]'}`}
                    title={code.is_active ? 'Disable' : 'Enable'}>
                    {code.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(code)}
                    className="p-2 text-[#888888] hover:text-[#FFCC00] rounded-lg border border-[#333333] hover:border-[#FFCC00]/30 transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(code.id)}
                    className="p-2 text-[#888888] hover:text-red-400 rounded-lg border border-[#333333] hover:border-red-500/30 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-[#222222] border border-[#333333] rounded-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#333333]">
              <h2 className="font-bold text-[#F5F5F7]">{editCode ? 'Edit Discount Code' : 'New Discount Code'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-[#888888] hover:text-[#FFCC00]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[#888888] font-600 block mb-1">Promo Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20" className={inputCls} />
                <p className="text-xs text-[#666666] mt-1">Auto-uppercased. Must be unique.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#888888] font-600 block mb-1">Percent Off (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.percent_off}
                    onChange={e => setForm(f => ({ ...f, percent_off: e.target.value }))}
                    placeholder="e.g. 20 for 20%" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-[#888888] font-600 block mb-1">Fixed Off ($)</label>
                  <input type="number" min="0" step="0.01" value={form.fixed_off}
                    onChange={e => setForm(f => ({ ...f, fixed_off: e.target.value }))}
                    placeholder="e.g. 10 for $10 off" className={inputCls} />
                </div>
              </div>
              <p className="text-xs text-[#666666]">Fill one or both. If both are set, both will apply.</p>
              <div>
                <label className="text-xs text-[#888888] font-600 block mb-1">Expiry Date (optional)</label>
                <input type="datetime-local" value={form.expiry}
                  onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-700 transition-all ${form.is_active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#2A2A2A] border-[#333333] text-[#888888]'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${form.is_active ? 'bg-green-500 border-green-500' : 'border-[#555555]'}`}>
                    {form.is_active && <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5"><path d="M1 4l3 3 5-6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {form.is_active ? 'Code is Active' : 'Code is Disabled'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#333333]">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-[#2A2A2A] border border-[#333333] rounded-xl text-sm font-600 text-[#888888]">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-[#FFCC00] text-black font-bold rounded-xl hover:bg-[#E6B800] disabled:opacity-60">
                {saving ? 'Saving...' : editCode ? 'Update' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
