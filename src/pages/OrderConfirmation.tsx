import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, Copy, Check, MapPin } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('orders').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setOrder(data as Order); });
  }, [id]);

  const copyId = () => {
    if (id) { navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">

        {/* Success */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#E6C200] rounded-3xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-900 text-[#111111] tracking-tight mb-2">Order Confirmed!</h1>
          <p className="text-[#555555] font-500">Thank you! We received your order and will verify payment within 24 hours.</p>
        </div>

        {/* Order ID */}
        <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5 mb-5">
          <p className="text-xs font-700 text-[#888888] uppercase tracking-wider mb-2">Your Order ID</p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-700 text-[#111111] font-mono flex-1 break-all">{id}</p>
            <button onClick={copyId}
              className="p-2 bg-[#F5F5F2] border border-[#E0E0DC] rounded-lg hover:border-[#E6C200] transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#888888]" />}
            </button>
          </div>
          <p className="text-xs text-[#888888] font-500 mt-2">Save this ID to track your order status.</p>
        </div>

        {order && (
          <div className="space-y-4">
            {/* Shipping */}
            <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5">
              <p className="text-xs font-700 text-[#888888] uppercase tracking-wider mb-3">Shipping To</p>
              <p className="font-800 text-[#111111]">{order.customer_name}</p>
              <p className="text-sm text-[#555555] font-500 mt-1">{order.shipping_address}, {order.shipping_city}</p>
              <p className="text-sm text-[#555555] font-500">{order.shipping_province} {order.shipping_zip}</p>
              <p className="text-sm font-700 text-[#111111] mt-2">{order.shipping_country === 'United States' ? '🇺🇸' : '🇬🇧'} {order.shipping_country}</p>
            </div>

            {/* What's next */}
            <div className="bg-[#FFF9E0] border border-[#E6C200]/40 rounded-2xl p-5">
              <p className="text-xs font-700 text-[#B8A000] uppercase tracking-wider mb-3">What Happens Next</p>
              <div className="space-y-3">
                {[
                  { icon: Clock, text: 'Admin verifies your payment (within 24h)', done: false },
                  { icon: Package, text: 'Order is prepared and dispatched via CJPacket', done: false },
                  { icon: MapPin, text: 'Tracking number sent — track live on 17TRACK', done: false },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#E6C200] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-black" />
                    </div>
                    <p className="text-sm text-[#555555] font-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery estimate */}
            <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-700 text-[#888888] uppercase tracking-wider">Est. Delivery</p>
                <p className="font-800 text-[#111111] mt-1">
                  {order.shipping_country === 'United States' ? '7–15 Business Days' : '6–10 Business Days'}
                </p>
                <p className="text-xs text-[#888888] font-500">
                  {order.shipping_country === 'United States' ? 'via CJPacket Ordinary' : 'via CJPacket Euro'}
                </p>
              </div>
              <span className="text-3xl">{order.shipping_country === 'United States' ? '🇺🇸' : '🇬🇧'}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to={`/track-order`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000] transition-colors">
            <MapPin className="w-4 h-4" /> Track My Order
          </Link>
          <Link to="/products"
            className="flex-1 flex items-center justify-center py-3 bg-white border border-[#E0E0DC] text-[#555555] font-700 rounded-xl hover:border-[#E6C200] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
