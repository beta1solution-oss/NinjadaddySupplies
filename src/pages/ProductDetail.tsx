import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, CheckCircle2, Clock, Package, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/features/CartDrawer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import ImageGallery from '@/components/features/ImageGallery';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/hooks/useCart';
import { useSettings } from '@/hooks/useSettings';
import { useGlobalCurrency } from '@/components/layout/Navbar';
import type { Product, ProductVariant } from '@/types';
import { toast } from 'sonner';

interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
  country?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'star-filled fill-[#E6C200]' : 'star-empty'}`} />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { getSetting } = useSettings();
  const { format } = useGlobalCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*), product_categories(category_id, categories(name)), product_tags(tag)')
        .eq('id', id)
        .single();
      if (data) {
        const p: Product = {
          ...data,
          variants: data.product_variants,
          tags: data.product_tags?.map((t: { tag: string }) => t.tag) || [],
        };
        setProduct(p);
        if (p.variants?.length) setSelectedVariant(p.variants[0]);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    try {
      const raw = getSetting('product_reviews', '[]');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setReviews(parsed);
    } catch {
      setReviews([]);
    }
  }, [getSetting]);

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F2] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#E6C200] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#F5F5F2] flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-800 text-[#111111]">Product Not Found</h2>
      <Link to="/products" className="text-[#E6C200] hover:underline font-700">← Back to Products</Link>
    </div>
  );

  const price = selectedVariant?.price ?? product.base_price;
  const colors = [...new Set(product.variants?.map(v => v.color).filter(Boolean))];
  const sizes = [...new Set(product.variants?.map(v => v.size).filter(Boolean))];

  const selectColor = (color: string) => {
    const v = product.variants?.find(v => v.color === color && (selectedVariant?.size ? v.size === selectedVariant.size : true));
    if (v) setSelectedVariant(v);
  };

  const selectSize = (size: string) => {
    const v = product.variants?.find(v => v.size === size && (selectedVariant?.color ? v.color === selectedVariant.color : true));
    if (v) setSelectedVariant(v);
  };

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    toast.success(`${product.title} added to cart!`);
  };

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <CartDrawer />
      <WhatsAppBubble />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-600 text-[#888888] hover:text-[#111111] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="fade-in-up">
            <ImageGallery images={product.images} title={product.title} />
          </div>

          {/* Info */}
          <div className="space-y-6 fade-in-up">
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-[#FFF9E0] text-[#B8A000] border border-[#E6C200]/40 rounded-full font-700">{tag}</span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-900 text-[#111111] leading-tight tracking-tight">{product.title}</h1>

            {product.product_sku && (
              <p className="text-xs text-[#888888] font-600">SKU: <span className="text-[#555555] font-mono">{product.product_sku}</span></p>
            )}

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm font-700 text-[#111111]">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-[#888888] font-500">({reviews.length} reviews)</span>
              </div>
            )}

            <div className="text-4xl font-900 text-[#111111]">{format(price)}</div>

            {product.description && (
              <p className="text-[#555555] leading-relaxed font-500">{product.description}</p>
            )}

            {/* Color selector */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-700 text-[#111111] mb-2">Color: <span className="text-[#E6C200]">{selectedVariant?.color || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button key={color!} onClick={() => selectColor(color!)}
                      className={`px-4 py-2 rounded-xl text-sm font-700 border-2 transition-all ${
                        selectedVariant?.color === color
                          ? 'bg-[#E6C200] text-black border-[#E6C200]'
                          : 'bg-white text-[#555555] border-[#E0E0DC] hover:border-[#E6C200]'
                      }`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div>
                <p className="text-sm font-700 text-[#111111] mb-2">Size: <span className="text-[#E6C200]">{selectedVariant?.size || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button key={size!} onClick={() => selectSize(size!)}
                      className={`px-4 py-2 rounded-xl text-sm font-700 border-2 transition-all ${
                        selectedVariant?.size === size
                          ? 'bg-[#E6C200] text-black border-[#E6C200]'
                          : 'bg-white text-[#555555] border-[#E0E0DC] hover:border-[#E6C200]'
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-700 text-[#111111] mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 bg-white border-2 border-[#E0E0DC] rounded-xl flex items-center justify-center hover:border-[#E6C200] transition-colors">
                  <Minus className="w-4 h-4 text-[#555555]" />
                </button>
                <span className="text-lg font-800 w-8 text-center text-[#111111]">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 bg-white border-2 border-[#E0E0DC] rounded-xl flex items-center justify-center hover:border-[#E6C200] transition-colors">
                  <Plus className="w-4 h-4 text-[#555555]" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#E6C200] text-black font-800 text-base rounded-2xl hover:bg-[#B8A000] transition-colors">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart — {format(price * quantity)}
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-[#E0E0DC] rounded-2xl">
              {[
                { icon: CheckCircle2, label: 'Quality Verified', color: 'text-green-600' },
                { icon: Clock, label: 'Fast Dispatch', color: 'text-[#E6C200]' },
                { icon: Package, label: 'Stealth Ship', color: 'text-blue-600' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className="text-xs text-[#888888] font-600">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-xs font-800 text-green-700">🇺🇸 United States</p>
                <p className="text-xs text-green-600 font-500 mt-1">7–15 Business Days</p>
                <p className="text-xs text-green-500 font-500">via CJPacket Ordinary</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <p className="text-xs font-800 text-blue-700">🇬🇧 United Kingdom</p>
                <p className="text-xs text-blue-600 font-500 mt-1">6–10 Business Days</p>
                <p className="text-xs text-blue-500 font-500">via CJPacket Euro</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-900 text-[#111111] tracking-tight">Customer Reviews</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF9E0] border border-[#E6C200]/40 rounded-full">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm font-800 text-[#111111]">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-[#888888] font-600">({reviews.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review, i) => (
                <div key={i} className="bg-white border border-[#E0E0DC] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-800 text-[#111111]">{review.name}</p>
                      {review.country && <p className="text-xs text-[#888888] font-500 mt-0.5">{review.country}</p>}
                    </div>
                    <span className="text-xs text-[#AAAAAA] font-500">{review.date}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-sm text-[#555555] font-500 mt-3 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
