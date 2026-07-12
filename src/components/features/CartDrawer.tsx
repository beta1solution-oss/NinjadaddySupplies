import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useGlobalCurrency } from '@/components/layout/Navbar';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCart();
  const { format } = useGlobalCurrency();
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0DC]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#111111]" />
            <h2 className="font-800 text-[#111111]">Cart ({items.length})</h2>
          </div>
          <button onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#F0F0ED] transition-colors">
            <X className="w-5 h-5 text-[#555555]" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingCart className="w-14 h-14 text-[#CCCCCC]" />
              <p className="text-[#888888] font-600">Your cart is empty</p>
              <button onClick={() => { setIsOpen(false); navigate('/products'); }}
                className="px-4 py-2 bg-[#E6C200] text-black text-sm font-800 rounded-lg">
                Browse Products
              </button>
            </div>
          ) : (
            items.map(item => {
              const itemPrice = item.variant?.price ?? item.product.base_price;
              return (
                <div key={item.cartKey} className="flex gap-3 p-3 bg-[#F5F5F2] rounded-xl">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-[#E0E0DC] rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-700 text-[#111111] line-clamp-1">{item.product.title}</p>
                    {item.variant && (
                      <p className="text-xs text-[#888888] font-500 mt-0.5">
                        {[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    <p className="text-sm font-800 text-[#111111] mt-1">{format(itemPrice)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        className="w-6 h-6 bg-white border border-[#E0E0DC] rounded flex items-center justify-center hover:border-[#E6C200]">
                        <Minus className="w-3 h-3 text-[#555555]" />
                      </button>
                      <span className="text-sm font-700 w-6 text-center text-[#111111]">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="w-6 h-6 bg-white border border-[#E0E0DC] rounded flex items-center justify-center hover:border-[#E6C200]">
                        <Plus className="w-3 h-3 text-[#555555]" />
                      </button>
                      <button onClick={() => removeItem(item.cartKey)}
                        className="ml-auto p-1 text-[#AAAAAA] hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[#E0E0DC] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#555555] font-600">Subtotal</span>
              <span className="text-lg font-800 text-[#111111]">{format(subtotal)}</span>
            </div>
            <p className="text-xs text-[#888888]">Shipping calculated at checkout</p>
            <button
              onClick={() => { setIsOpen(false); navigate('/checkout'); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000] transition-colors text-sm"
            >
              <ArrowRight className="w-4 h-4" /> Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
