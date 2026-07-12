import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Truck, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useGlobalCurrency } from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface Props { product: Product; }

// Persist likes in localStorage so they survive page refresh
function getLikedSet(): Set<string> {
  try {
    const raw = localStorage.getItem('nd_liked_products');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function setLikedSet(set: Set<string>) {
  localStorage.setItem('nd_liked_products', JSON.stringify([...set]));
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const { format } = useGlobalCurrency();

  // Use selling_price if set, else variant min, else base_price
  const sellingPrice = product.selling_price && product.selling_price > 0
    ? product.selling_price
    : (product.variants?.length
      ? Math.min(...product.variants.map(v => v.price))
      : product.base_price);

  const originalPrice = product.cost_price && product.cost_price > 0 && product.cost_price > sellingPrice
    ? product.cost_price
    : null;

  const discountPct = originalPrice
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : null;

  // ── Likes ──────────────────────────────────────────────
  const [liked, setLiked] = useState(() => getLikedSet().has(product.id));
  const [likesCount, setLikesCount] = useState(product.likes_count ?? 0);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setLiked(getLikedSet().has(product.id));
    setLikesCount(product.likes_count ?? 0);
  }, [product.id, product.likes_count]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;

    const wasLiked = liked;
    const newCount = wasLiked ? Math.max(0, likesCount - 1) : likesCount + 1;

    // Optimistic UI
    setLiked(!wasLiked);
    setLikesCount(newCount);

    // Update localStorage
    const set = getLikedSet();
    if (wasLiked) set.delete(product.id);
    else set.add(product.id);
    setLikedSet(set);

    // Persist to DB
    setLiking(true);
    const { error } = await supabase
      .from('products')
      .update({ likes_count: newCount })
      .eq('id', product.id);

    if (error) {
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(likesCount);
      const set2 = getLikedSet();
      if (wasLiked) set2.add(product.id);
      else set2.delete(product.id);
      setLikedSet(set2);
    } else if (!wasLiked) {
      toast.success('Added to wishlist ❤️', { duration: 1500 });
    }
    setLiking(false);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.variants?.[0] || null, 1);
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <Link to={`/products/${product.id}`}
      className="group block bg-white border border-[#E0E0DC] rounded-2xl overflow-hidden hover:border-[#E6C200] hover:shadow-md transition-all duration-200 relative">

      {/* Featured badge */}
      {product.is_featured && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#E6C200] text-black text-xs font-900 px-2.5 py-0.5 rounded-full shadow-sm">
          ★ FEATURED
        </div>
      )}

      {/* Discount badge */}
      {discountPct && discountPct > 0 && (
        <div className={`absolute z-10 bg-red-500 text-white text-xs font-900 px-2 py-0.5 rounded-full ${product.is_featured ? 'top-8 right-2' : 'top-2 right-2'}`}>
          -{discountPct}%
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-[#F5F5F2] overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#CCCCCC]" />
          </div>
        )}

        {/* Like button — top right on image */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={`absolute top-2 ${discountPct ? 'bottom-2 right-2 top-auto' : 'right-2'} w-8 h-8 rounded-full flex items-center justify-center shadow transition-all duration-200 ${
            liked
              ? 'bg-red-50 border border-red-200'
              : 'bg-white/80 border border-white/60 opacity-0 group-hover:opacity-100'
          }`}
          title={liked ? 'Unlike' : 'Like'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-[#888888]'}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-[#FFF9E0] text-[#B8A000] rounded font-600">{tag}</span>
            ))}
          </div>
        )}

        <h3 className="text-xs sm:text-sm font-700 text-[#111111] leading-snug line-clamp-2 mb-2">{product.title}</h3>

        {/* Free shipping badge */}
        {product.is_free_shipping && (
          <div className="flex items-center gap-1 mb-2">
            <Truck className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-600 font-700">Free Shipping</span>
          </div>
        )}

        {/* Pricing + actions */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-900 text-[#111111]">{format(sellingPrice)}</span>
              {originalPrice && (
                <span className="text-xs text-[#AAAAAA] line-through font-500">{format(originalPrice)}</span>
              )}
            </div>
            {discountPct && discountPct > 0 && (
              <p className="text-xs text-green-600 font-700">Save {discountPct}%</p>
            )}
            {likesCount > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                <span className="text-xs text-[#AAAAAA] font-500">{likesCount.toLocaleString()}</span>
              </div>
            )}
          </div>
          <button onClick={handleAddToCart}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#E6C200] text-black rounded-xl hover:bg-[#B8A000] transition-colors text-xs font-800 whitespace-nowrap">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
