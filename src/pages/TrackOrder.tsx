import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, ExternalLink, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppBubble from '@/components/features/WhatsAppBubble';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  'Pending Verification': {
    icon: Clock,
    label: 'Pending Verification',
    desc: 'We received your order and are verifying your payment.',
    color: '#F59E0B',
    bg: '#FEF3C7',
    step: 1,
  },
  'Paid - Ready to Ship': {
    icon: Package,
    label: 'Payment Verified',
    desc: 'Payment confirmed! Your order is being prepared for dispatch.',
    color: '#10B981',
    bg: '#D1FAE5',
    step: 2,
  },
  'Dispatched': {
    icon: Truck,
    label: 'Dispatched',
    desc: 'Your order is on its way! Use the tracking number to follow your shipment.',
    color: '#3B82F6',
    bg: '#DBEAFE',
    step: 3,
  },
};

const STEPS = ['Order Placed', 'Payment Verified', 'Dispatched', 'Delivered'];

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId.trim())
      .single();

    if (error || !data) {
      setOrder(null);
      toast.error('Order not found. Please check your Order ID.');
    } else {
      setOrder(data as Order);
    }
    setLoading(false);
  };

  const statusInfo = order ? STATUS_CONFIG[order.verification_status] : null;
  const currentStep = statusInfo?.step ?? 0;

  const getEstimatedDelivery = (order: Order) => {
    if (!order.created_at) return null;
    const base = new Date(order.created_at);
    const [min, max] = order.shipping_country === 'United States' ? [7, 15] : [6, 10];
    const earliest = new Date(base); earliest.setDate(earliest.getDate() + min);
    const latest = new Date(base); latest.setDate(latest.getDate() + max);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(earliest)} – ${fmt(latest)}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Navbar />
      <WhatsAppBubble />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#E6C200] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-900 text-[#111111] tracking-tight">Track Your Order</h1>
          <p className="text-[#555555] font-500 mt-2">Enter your Order ID to see real-time status and tracking info</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
            <input
              type="text"
              placeholder="Paste your Order ID here..."
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-[#E0E0DC] rounded-xl text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#E6C200] font-600 transition-colors"
            />
          </div>
          <button type="submit" disabled={loading || !orderId.trim()}
            className="flex items-center gap-2 px-5 py-3.5 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000] transition-colors disabled:opacity-50 text-sm">
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <><ArrowRight className="w-4 h-4" /> Track</>
            )}
          </button>
        </form>

        {/* Result */}
        {searched && !loading && (
          <>
            {!order ? (
              <div className="bg-white border border-[#E0E0DC] rounded-2xl p-8 text-center">
                <Package className="w-12 h-12 text-[#CCCCCC] mx-auto mb-3" />
                <h3 className="text-lg font-800 text-[#111111] mb-1">Order Not Found</h3>
                <p className="text-[#888888] font-500 text-sm">Double-check your Order ID from your confirmation message.</p>
              </div>
            ) : (
              <div className="space-y-5 fade-in-up">
                {/* Status Card */}
                <div className="bg-white border border-[#E0E0DC] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#F0F0ED]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-700 text-[#888888] uppercase tracking-wider">Order ID</span>
                      <span className="text-xs font-700 text-[#888888]">{formatDate(order.created_at)}</span>
                    </div>
                    <p className="text-xs font-700 text-[#111111] font-mono break-all">{order.id}</p>
                  </div>

                  {/* Status Banner */}
                  {statusInfo && (
                    <div className="p-5" style={{ backgroundColor: statusInfo.bg }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: statusInfo.color }}>
                          <statusInfo.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-800 text-[#111111]">{statusInfo.label}</p>
                          <p className="text-sm text-[#555555] font-500 mt-0.5">{statusInfo.desc}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Steps */}
                  <div className="p-5">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E0E0DC] z-0" />
                      <div className="absolute top-4 left-0 h-0.5 bg-[#E6C200] z-0 transition-all"
                        style={{ width: `${Math.min(100, ((currentStep - 1) / (STEPS.length - 1)) * 100)}%` }} />
                      {STEPS.map((step, idx) => {
                        const done = idx + 1 <= currentStep;
                        return (
                          <div key={step} className="flex flex-col items-center gap-1.5 z-10 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              done ? 'bg-[#E6C200] border-[#E6C200]' : 'bg-white border-[#E0E0DC]'
                            }`}>
                              {done
                                ? <CheckCircle className="w-4 h-4 text-black" />
                                : <span className="text-xs font-800 text-[#CCCCCC]">{idx + 1}</span>
                              }
                            </div>
                            <span className="text-xs font-600 text-[#555555] text-center w-16 leading-tight">{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Delivery + Tracking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5">
                    <p className="text-xs font-700 text-[#888888] uppercase tracking-wider mb-3">Shipping To</p>
                    <p className="font-700 text-[#111111]">{order.customer_name}</p>
                    <p className="text-sm text-[#555555] font-500 mt-1">{order.shipping_address}</p>
                    <p className="text-sm text-[#555555] font-500">{order.shipping_city}, {order.shipping_province} {order.shipping_zip}</p>
                    <p className="text-sm font-700 text-[#111111] mt-2">{order.shipping_country === 'United States' ? '🇺🇸' : '🇬🇧'} {order.shipping_country}</p>
                    {getEstimatedDelivery(order) && (
                      <div className="mt-3 pt-3 border-t border-[#F0F0ED]">
                        <p className="text-xs text-[#888888] font-600">Est. Delivery Window</p>
                        <p className="text-sm font-800 text-[#111111]">{getEstimatedDelivery(order)}</p>
                        <p className="text-xs text-[#888888] font-500">
                          {order.shipping_country === 'United States' ? 'via CJPacket Ordinary' : 'via CJPacket Euro'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5">
                    <p className="text-xs font-700 text-[#888888] uppercase tracking-wider mb-3">Tracking</p>
                    {order.tracking_number ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-[#F5F5F2] rounded-xl">
                          <p className="text-xs text-[#888888] font-600 mb-1">Tracking Number</p>
                          <p className="font-700 text-[#111111] font-mono text-sm break-all">{order.tracking_number}</p>
                        </div>
                        {/* 17TRACK button */}
                        <a
                          href={`https://t.17track.net/en#nums=${encodeURIComponent(order.tracking_number)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000] transition-colors text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Track on 17TRACK
                        </a>
                        <p className="text-xs text-[#AAAAAA] text-center font-500">Opens live courier tracking on 17track.net</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-28 text-center">
                        <Truck className="w-8 h-8 text-[#CCCCCC] mb-2" />
                        <p className="text-sm text-[#888888] font-500">Tracking number will appear here once your order is dispatched.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment info */}
                <div className="bg-white border border-[#E0E0DC] rounded-2xl p-5">
                  <p className="text-xs font-700 text-[#888888] uppercase tracking-wider mb-3">Payment Details</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#888888] font-600">Method</p>
                      <p className="font-700 text-[#111111]">{order.verification_method}</p>
                    </div>
                    <div>
                      <p className="text-[#888888] font-600">Amount</p>
                      <p className="font-800 text-[#111111]">${order.amount_paid?.toFixed(2) || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Help */}
        {!searched && (
          <div className="bg-white border border-[#E0E0DC] rounded-2xl p-6 text-center">
            <p className="text-sm text-[#888888] font-500">
              Your Order ID was included in the confirmation message shown after checkout. Contact us on WhatsApp if you need help.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
