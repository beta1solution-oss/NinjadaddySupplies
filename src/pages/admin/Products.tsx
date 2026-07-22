import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, X, Package, ChevronDown, ChevronUp, Star, Truck, Tag } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductVariant, Category } from '@/types';
import { toast } from 'sonner';

interface ProductFormData {
  title: string;
  description: string;
  base_price: string;
  cost_price: string;
  selling_price: string;
  is_active: boolean;
  is_featured: boolean;
  is_free_shipping: boolean;
  product_sku: string;
}

const emptyForm: ProductFormData = {
  title: '', description: '', base_price: '0',
  cost_price: '0', selling_price: '0',
  is_active: true, is_featured: false,
  is_free_shipping: true, product_sku: ''
};

const inputCls = "w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm text-[#F5F5F7] placeholder-[#666666] focus:outline-none focus:border-[#FFCC00]/50 transition-colors";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantForm, setVariantForm] = useState({ color: '', size: '', price: '0', stock_quantity: '100' });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from('products')
      .select('*, product_variants(*), product_categories(category_id), product_tags(tag)')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setProducts(data.map(p => ({
      ...p,
      variants: p.product_variants,
      tags: p.product_tags?.map((t: { tag: string }) => t.tag) || []
    })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from('categories').select('*').then(({ data }) => { if (data) setCategories(data); });
  }, []);

  const openCreate = () => {
    setEditProduct(null); setForm(emptyForm); setImages([]);
    setSelectedCats([]); setTags(''); setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      title: p.title, description: p.description || '',
      base_price: String(p.base_price),
      cost_price: String(p.cost_price || 0),
      selling_price: String(p.selling_price || 0),
      is_active: p.is_active, is_featured: p.is_featured,
      is_free_shipping: p.is_free_shipping, product_sku: p.product_sku || ''
    });
    setImages(p.images || []);
    setSelectedCats((p as Product & { product_categories?: { category_id: string }[] }).product_categories?.map(c => c.category_id) || []);
    setTags((p.tags || []).join(', '));
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImage(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      console.log('Uploading image:', file.name, 'to path:', path, 'size:', file.size);
      const { data: uploadData, error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      } else {
        console.log('Upload success:', uploadData);
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        console.log('Public URL:', urlData.publicUrl);
        setImages(prev => [...prev, urlData.publicUrl]);
        successCount++;
      }
    }
    if (successCount > 0) toast.success(`${successCount} image${successCount > 1 ? 's' : ''} uploaded!`);
    setUploadingImage(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (url: string) => setImages(prev => prev.filter(i => i !== url));

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      base_price: parseFloat(form.base_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_free_shipping: form.is_free_shipping,
      product_sku: form.product_sku || null,
      images
    };
    let productId = editProduct?.id;

    if (editProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error || !data) { toast.error('Failed to create'); setSaving(false); return; }
      productId = data.id;
    }

    if (productId) {
      await supabase.from('product_categories').delete().eq('product_id', productId);
      if (selectedCats.length) await supabase.from('product_categories').insert(selectedCats.map(cid => ({ product_id: productId, category_id: cid })));
      await supabase.from('product_tags').delete().eq('product_id', productId);
      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArr.length) await supabase.from('product_tags').insert(tagArr.map(tag => ({ product_id: productId, tag })));
    }

    toast.success(editProduct ? 'Product updated!' : 'Product created!');
    setModalOpen(false); setSaving(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Product deleted'); load();
  };

  const loadVariants = async (productId: string) => {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('created_at');
    if (data) setVariants(data);
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); setVariants([]); }
    else { setExpandedId(id); loadVariants(id); }
  };

  const addVariant = async (productId: string) => {
    if (!variantForm.price) return;
    const { error } = await supabase.from('product_variants').insert({
      product_id: productId,
      color: variantForm.color || null,
      size: variantForm.size || null,
      price: parseFloat(variantForm.price),
      stock_quantity: parseInt(variantForm.stock_quantity) || 100
    });
    if (!error) {
      toast.success('Variant added');
      loadVariants(productId);
      setVariantForm({ color: '', size: '', price: '0', stock_quantity: '100' });
    }
  };

  const deleteVariant = async (id: string, productId: string) => {
    await supabase.from('product_variants').delete().eq('id', id);
    loadVariants(productId);
  };

  const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7]">Products</h1>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#222222] border border-[#333333] rounded-xl text-sm text-[#F5F5F7] placeholder-[#666666] focus:outline-none focus:border-[#FFCC00]/50" />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#222222] rounded-xl animate-pulse border border-[#333333]" />
          ))}</div>
        ) : (
          <div className="bg-[#222222] border border-[#333333] rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[#333333]">
                  {['', 'Title', 'Pricing', 'Badges', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs text-[#888888] font-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filtered.map(p => (
                  <>
                    <tr key={p.id} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-3 py-3 w-12">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg" />
                          : <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-[#555555]" />
                            </div>
                        }
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-600 text-[#F5F5F7] text-sm truncate max-w-[180px]">{p.title}</p>
                        {p.product_sku && <p className="text-xs text-[#888888] font-mono">{p.product_sku}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs text-[#888888]">Cost: <span className="text-red-400 font-600">{formatPrice(p.cost_price || 0)}</span></p>
                          <p className="text-xs text-[#888888]">Sell: <span className="text-[#FFCC00] font-700">{formatPrice(p.selling_price || p.base_price)}</span></p>
                          {p.cost_price > 0 && p.selling_price > p.cost_price && (
                            <p className="text-xs text-green-400 font-600">+{Math.round(((p.selling_price - p.cost_price) / p.cost_price) * 100)}% margin</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {p.is_featured && (
                            <span className="inline-flex items-center gap-0.5 text-xs bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/30 rounded-full px-1.5 py-0.5 font-700">
                              <Star className="w-2.5 h-2.5" /> Featured
                            </span>
                          )}
                          {p.is_free_shipping && (
                            <span className="inline-flex items-center gap-0.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-1.5 py-0.5 font-600">
                              <Truck className="w-2.5 h-2.5" /> Free Ship
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-600 ${p.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleExpand(p.id)} className="p-1.5 text-[#888888] hover:text-[#FFCC00] transition-colors" title="Variants">
                            {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 text-[#888888] hover:text-[#FFCC00] transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-[#888888] hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === p.id && (
                      <tr key={`${p.id}-variants`}>
                        <td colSpan={6} className="px-4 py-4 bg-[#1A1A1A] border-b border-[#333333]">
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-[#FFCC00]">Variants for: {p.title}</p>
                            <div className="space-y-2">
                              {variants.map(v => (
                                <div key={v.id} className="flex items-center gap-3 p-2.5 bg-[#222222] rounded-lg text-xs border border-[#333333]">
                                  {v.color && <span className="text-[#F5F5F7]">{v.color}</span>}
                                  {v.size && <span className="text-[#888888]">/ {v.size}</span>}
                                  <span className="text-[#FFCC00] font-bold ml-auto">{formatPrice(v.price)}</span>
                                  <span className="text-[#888888]">Qty: {v.stock_quantity}</span>
                                  <button onClick={() => deleteVariant(v.id, p.id)} className="text-red-400 hover:text-red-300">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {variants.length === 0 && <p className="text-xs text-[#666666]">No variants yet. Add one below.</p>}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[['Color', 'color'], ['Size', 'size'], ['Price', 'price'], ['Stock', 'stock_quantity']].map(([label, field]) => (
                                <input key={field} type={field === 'price' || field === 'stock_quantity' ? 'number' : 'text'}
                                  placeholder={label} value={variantForm[field as keyof typeof variantForm]}
                                  onChange={e => setVariantForm(prev => ({ ...prev, [field]: e.target.value }))}
                                  className="px-2 py-1.5 bg-[#222222] border border-[#333333] rounded-lg text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FFCC00]/50" />
                              ))}
                              <button onClick={() => addVariant(p.id)}
                                className="px-3 py-1.5 bg-[#FFCC00] text-black text-xs font-bold rounded-lg hover:bg-[#E6B800]">
                                Add
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-[#888888] text-sm">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#222222] border border-[#333333] rounded-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-[#333333]">
              <h2 className="font-bold text-[#F5F5F7] text-lg">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-[#888888] hover:text-[#FFCC00] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-xs text-[#888888] block mb-1 font-600">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Product name" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-[#888888] block mb-1 font-600">CJ SKU / Product SKU</label>
                  <input value={form.product_sku} onChange={e => setForm(f => ({ ...f, product_sku: e.target.value }))}
                    placeholder="SKU-001" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-[#888888] block mb-1 font-600">Base Price ($) — fallback</label>
                  <input type="number" step="0.01" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              {/* Pricing Strategy */}
              <div className="p-4 bg-[#1A1A1A] border border-[#333333] rounded-xl space-y-3">
                <p className="text-xs font-bold text-[#FFCC00] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Pricing Strategy (shows discount to customers)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#888888] block mb-1 font-600">Cost Price ($) — internal</label>
                    <input type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                      placeholder="0.00" className={inputCls} />
                    <p className="text-xs text-[#666666] mt-1">Shown as original/strikethrough price</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#888888] block mb-1 font-600">Selling Price ($) — customer sees</label>
                    <input type="number" step="0.01" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))}
                      placeholder="0.00" className={inputCls} />
                    <p className="text-xs text-[#666666] mt-1">Displayed as the actual price</p>
                  </div>
                </div>
                {parseFloat(form.cost_price) > 0 && parseFloat(form.selling_price) > 0 && parseFloat(form.cost_price) > parseFloat(form.selling_price) && (
                  <p className="text-xs text-green-400 font-700">
                    Customer saves {Math.round(((parseFloat(form.cost_price) - parseFloat(form.selling_price)) / parseFloat(form.cost_price)) * 100)}% — discount badge will appear
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[#888888] block mb-1 font-600">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className={`${inputCls} resize-none`} placeholder="Product description..." />
              </div>

              {/* Tags & Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#888888] block mb-1 font-600">Tags (comma-separated)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="electronics, gadget, new"
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-[#888888] block mb-1 font-600">Categories (Ctrl+click for multi)</label>
                  <select multiple value={selectedCats} onChange={e => setSelectedCats(Array.from(e.target.selectedOptions, o => o.value))}
                    className={`${inputCls} h-[84px]`}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-xs text-[#888888] block mb-2 font-600">Product Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-[#333333]" />
                      <button onClick={() => removeImage(img)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-[#333333] rounded-lg flex items-center justify-center hover:border-[#FFCC00]/50 transition-colors">
                    {uploadingImage
                      ? <div className="w-4 h-4 border-2 border-[#FFCC00] border-t-transparent rounded-full animate-spin" />
                      : <Upload className="w-5 h-5 text-[#888888]" />
                    }
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Toggles */}
              <div className="p-4 bg-[#1A1A1A] border border-[#333333] rounded-xl space-y-3">
                <p className="text-xs font-bold text-[#888888] uppercase tracking-wider">Product Settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'is_active', label: 'Active (visible)', sub: 'Show to customers', color: 'green' },
                    { key: 'is_featured', label: '★ Featured', sub: 'Show badge + sort first', color: 'yellow' },
                    { key: 'is_free_shipping', label: '🚚 Free Shipping', sub: 'Show free shipping badge', color: 'green' },
                  ].map(({ key, label, sub, color }) => (
                    <button key={key} type="button"
                      onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof ProductFormData] }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form[key as keyof ProductFormData]
                          ? color === 'yellow'
                            ? 'border-[#FFCC00] bg-[#FFCC00]/10'
                            : 'border-green-500 bg-green-500/10'
                          : 'border-[#333333] hover:border-[#444444]'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-700 ${
                          form[key as keyof ProductFormData]
                            ? color === 'yellow' ? 'text-[#FFCC00]' : 'text-green-400'
                            : 'text-[#888888]'
                        }`}>{label}</span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          form[key as keyof ProductFormData]
                            ? color === 'yellow' ? 'bg-[#FFCC00] border-[#FFCC00]' : 'bg-green-500 border-green-500'
                            : 'border-[#555555]'
                        }`}>
                          {form[key as keyof ProductFormData] && (
                            <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                              <path d="M1 4l3 3 5-6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#666666]">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#333333]">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-[#2A2A2A] border border-[#333333] rounded-xl text-sm font-600 text-[#888888] hover:border-[#FFCC00]/40 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-[#FFCC00] text-black font-bold rounded-xl hover:bg-[#E6B800] transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
