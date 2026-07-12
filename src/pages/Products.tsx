import { useState, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/features/CartDrawer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import ProductCard from '@/components/features/ProductCard';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<(Category & { count?: number })[]>([]);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('product_tags').select('tag').then(({ data }) => {
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(t => { counts[t.tag] = (counts[t.tag] || 0) + 1; });
        setAllTags(Object.entries(counts).map(([tag, count]) => ({ tag, count })));
      }
    });
    // Get max price for slider
    supabase.from('product_variants').select('price').order('price', { ascending: false }).limit(1).then(({ data }) => {
      if (data?.[0]) {
        const max = Math.ceil(data[0].price / 10) * 10;
        setMaxPrice(max > 0 ? max : 1000);
        setPriceRange([0, max > 0 ? max : 1000]);
      }
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_categories(category_id), product_tags(tag)')
      .eq('is_active', true);

    if (debouncedSearch) query = query.ilike('title', `%${debouncedSearch}%`);

    const { data } = await query;
    if (data) {
      // Sort: featured first, then by selected sort
      let filtered = data.map(p => ({
        ...p,
        variants: p.product_variants,
        tags: p.product_tags?.map((t: { tag: string }) => t.tag) || [],
      }));

      if (selectedCategory) {
        filtered = filtered.filter(p =>
          p.product_categories?.some((c: { category_id: string }) => c.category_id === selectedCategory)
        );
      }
      if (selectedTags.length > 0) {
        filtered = filtered.filter(p =>
          selectedTags.every(tag => p.tags?.includes(tag))
        );
      }
      if (inStockOnly) {
        filtered = filtered.filter(p =>
          !p.variants?.length || p.variants.some((v: { stock_quantity: number }) => v.stock_quantity > 0)
        );
      }

      // Price filter
      filtered = filtered.filter(p => {
        const price = p.variants?.length
          ? Math.min(...p.variants.map((v: { price: number }) => v.price))
          : p.base_price;
        return price >= priceRange[0] && price <= priceRange[1];
      });

      // Sort: featured first always, then by selected sort
      filtered.sort((a, b) => {
        if (b.is_featured !== a.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        const pa = a.variants?.length ? Math.min(...a.variants.map((v: { price: number }) => v.price)) : (a.selling_price || a.base_price);
        const pb = b.variants?.length ? Math.min(...b.variants.map((v: { price: number }) => v.price)) : (b.selling_price || b.base_price);
        if (sort === 'price_asc') return pa - pb;
        if (sort === 'price_desc') return pb - pa;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setProducts(filtered);
    }
    setLoading(false);
  }, [debouncedSearch, selectedCategory, selectedTags, sort, priceRange, inStockOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSort('newest');
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
  };

  const hasFilters = search || selectedCategory || selectedTags.length > 0 || inStockOnly || sort !== 'newest' || priceRange[0] > 0 || priceRange[1] < maxPrice;

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <CartDrawer />
      <WhatsAppBubble />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-900 text-[#111111] tracking-tight">All Products</h1>
          <p className="text-[#555555] mt-2 font-500">Premium items with stealth shipping to US & UK</p>
        </div>

        {/* Search + Sort bar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
            <input type="text" placeholder="Search products..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-[#E0E0DC] rounded-xl text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#E6C200] font-500 transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#AAAAAA] hover:text-[#111111]" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
              className="appearance-none pl-3 pr-8 py-3 bg-white border border-[#E0E0DC] rounded-xl text-sm text-[#111111] font-600 focus:outline-none focus:border-[#E6C200] cursor-pointer">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-700 transition-all ${showFilters ? 'bg-[#E6C200] text-black border-[#E6C200]' : 'bg-white border-[#E0E0DC] text-[#555555] hover:border-[#E6C200]'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5 mb-6 space-y-5 fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Category */}
              <div>
                <label className="text-xs font-700 text-[#555555] uppercase tracking-wider block mb-2">Category</label>
                <div className="space-y-1.5">
                  <button onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-600 transition-colors ${!selectedCategory ? 'bg-[#E6C200] text-black' : 'text-[#555555] hover:bg-[#F5F5F2]'}`}>
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-600 transition-colors ${selectedCategory === cat.id ? 'bg-[#E6C200] text-black' : 'text-[#555555] hover:bg-[#F5F5F2]'}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-700 text-[#555555] uppercase tracking-wider block mb-2">
                  Price Range: ${priceRange[0]} – ${priceRange[1]}
                </label>
                <div className="space-y-3">
                  <input type="range" min={0} max={maxPrice} step={5}
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-[#E6C200]" />
                  <div className="flex gap-2">
                    <input type="number" min={0} max={priceRange[1]} value={priceRange[0]}
                      onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                      placeholder="Min"
                      className="w-full px-2 py-1.5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-lg text-xs text-[#111111] focus:outline-none focus:border-[#E6C200]" />
                    <input type="number" min={priceRange[0]} max={maxPrice} value={priceRange[1]}
                      onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                      placeholder="Max"
                      className="w-full px-2 py-1.5 bg-[#F5F5F2] border border-[#E0E0DC] rounded-lg text-xs text-[#111111] focus:outline-none focus:border-[#E6C200]" />
                  </div>
                </div>

                {/* In Stock */}
                <div className="mt-4">
                  <label className="text-xs font-700 text-[#555555] uppercase tracking-wider block mb-2">Availability</label>
                  <button onClick={() => setInStockOnly(!inStockOnly)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-600 border transition-all ${inStockOnly ? 'bg-[#E6C200] text-black border-[#E6C200]' : 'text-[#555555] border-[#E0E0DC] hover:border-[#E6C200]'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${inStockOnly ? 'bg-black border-black' : 'border-[#CCCCCC]'}`}>
                      {inStockOnly && <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    In Stock Only
                  </button>
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <label className="text-xs font-700 text-[#555555] uppercase tracking-wider block mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(({ tag, count }) => (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border font-600 transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-[#E6C200] text-black border-[#E6C200]'
                            : 'bg-white text-[#555555] border-[#E0E0DC] hover:border-[#E6C200]'
                        }`}>
                        {tag}
                        <span className={`text-xs rounded-full px-1 font-700 ${selectedTags.includes(tag) ? 'bg-black/20' : 'bg-[#F0F0ED]'}`}>{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasFilters && (
              <div className="pt-3 border-t border-[#E0E0DC]">
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-700 hover:bg-red-100 transition-colors">
                  <X className="w-3 h-3" /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#E0E0DC]">
                <div className="aspect-square bg-[#F0F0ED] animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#F0F0ED] animate-pulse rounded" />
                  <div className="h-3 bg-[#F0F0ED] animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="text-sm text-[#888888] font-600 mb-4">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <Search className="w-14 h-14 text-[#CCCCCC] mx-auto mb-4" />
            <h3 className="text-2xl font-800 text-[#111111] mb-2">No products found</h3>
            <p className="text-[#888888] font-500 mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="px-5 py-2.5 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000]">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
