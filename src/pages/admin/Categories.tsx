import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('categories').insert({ name: newName.trim() });
    if (error) { toast.error(error.message); } else { toast.success('Category created'); setNewName(''); load(); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This will unlink products.`)) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Category deleted'); load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-heading font-bold text-brand-off-white">Categories</h1>

        {/* Add Form */}
        <div className="p-5 bg-brand-surface border border-brand-border rounded-2xl">
          <h2 className="font-bold text-brand-off-white mb-4">Add Category</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name (e.g. Electronics)"
              className="flex-1 px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-sm text-brand-off-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow/50"
            />
            <button type="submit" disabled={saving || !newName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-yellow text-black font-bold rounded-xl hover:bg-brand-yellow-dim transition-colors disabled:opacity-60">
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-brand-border">
            <h2 className="font-bold text-brand-off-white">{categories.length} Categories</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-brand-surface2 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3 hover:bg-brand-surface2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="font-medium text-brand-off-white text-sm">{cat.name}</p>
                      <p className="text-xs text-brand-muted">{formatDate(cat.created_at)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-brand-muted hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="p-10 text-center">
                  <Tag className="w-10 h-10 text-brand-border mx-auto mb-3" />
                  <p className="text-brand-muted text-sm">No categories yet. Add one above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
