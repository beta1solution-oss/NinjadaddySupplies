import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Globe, Package, Star, MapPin, Truck, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/features/CartDrawer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import ProductCard from '@/components/features/ProductCard';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import heroBanner from '@/assets/hero-banner.jpg';

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_variants(*), product_tags(tag)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data) setProducts(data.map(p => ({
          ...p,
          variants: p.product_variants,
          tags: p.product_tags?.map((t: { tag: string }) => t.tag) || []
        })));
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <CartDrawer />
      <WhatsAppBubble />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image with blur overlay */}
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Hero" className="w-full h-full object-cover" style={{ filter: 'blur(2px) brightness(0.85)', transform: 'scale(1.04)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E6C200] rounded-full mb-6">
              <Truck className="w-3.5 h-3.5 text-black" />
              <span className="text-xs font-900 text-black uppercase tracking-wider">Free Shipping to US & UK</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-900 text-white leading-none mb-6 tracking-tight"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
              Direct
              <span className="block text-[#E6C200]">Sourcing.</span>
              <span className="block text-3xl sm:text-4xl font-600 text-white/80 mt-2">Insane Savings.</span>
            </h1>

            <p className="text-lg text-white/80 font-500 leading-relaxed mb-8 max-w-xl"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
              Premium products direct from source. Zero middleman markup.
              Free stealth shipping to United States & United Kingdom.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#E6C200] text-black font-900 text-base rounded-xl hover:bg-[#B8A000] transition-colors">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/track-order"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/30 text-white font-700 text-base rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm">
                <MapPin className="w-4 h-4" /> Track Order
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 mt-10">
              <div className="flex items-center gap-2">
                <span className="text-base">🇺🇸</span>
                <span className="text-sm text-white/70 font-500">US: 7–15 Business Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🇬🇧</span>
                <span className="text-sm text-white/70 font-500">UK: 6–10 Business Days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-[#E0E0DC] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Verified Quality', desc: 'Every item quality-checked' },
              { icon: Globe, title: 'Global Shipping', desc: 'US & UK stealth delivery' },
              { icon: Zap, title: 'Fast Processing', desc: 'Same-day dispatch' },
              { icon: MapPin, title: 'Live Tracking', desc: 'Track your order 24/7' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFF9E0] border border-[#E6C200]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#E6C200]" />
                </div>
                <div>
                  <p className="text-sm font-800 text-[#111111]">{title}</p>
                  <p className="text-xs text-[#888888] font-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / All Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-900 text-[#111111] tracking-tight">
                {products.some(p => p.is_featured) ? 'Featured Products' : 'Latest Products'}
              </h2>
              <p className="text-[#888888] font-500 mt-1">Hand-picked premium items with unbeatable prices</p>
            </div>
            <Link to="/products" className="flex items-center gap-1.5 text-sm font-700 text-[#E6C200] hover:text-[#B8A000] transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-[#CCCCCC] mx-auto mb-4" />
              <h3 className="text-xl font-800 text-[#111111] mb-2">Products Coming Soon</h3>
              <p className="text-[#888888] font-500">Check back shortly for amazing deals.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-1 mb-5">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-[#E6C200] fill-[#E6C200]" />)}
          </div>
          <h2 className="text-4xl font-900 text-white mb-4 tracking-tight">
            Trusted by <span className="text-[#E6C200]">1,000+</span> Customers
          </h2>
          <p className="text-white/60 font-500 mb-8 text-lg">
            Join thousands of satisfied buyers across the US and UK. Gateway-free. Hassle-free.
          </p>
          <Link to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#E6C200] text-black font-900 text-lg rounded-2xl hover:bg-[#B8A000] transition-colors">
            Start Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
