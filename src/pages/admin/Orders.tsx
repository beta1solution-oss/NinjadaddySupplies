import { useState, useEffect } from 'react';
import { Download, Search, ChevronDown, ChevronUp, Package, RefreshCw, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate, exportOrdersToCSV } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['Pending Verification', 'Paid - Ready to Ship', 'Dispatched'] as const;

const statusColors: Record<string, string> = {
  'Pending Verification': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  'Paid - Ready to Ship': 'bg-green-500/10 text-green-400 border border-green-500/30',
  'Dispatched': 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
};

const inputCls = "px-3 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm text-[#F5F5F7] placeholder-[#666666] focus:outline-none focus:border-[#FFCC00]/50 transition-colors";

// Send EmailJS notification to customer
async function sendStatusEmail(order: Order, trackingNumber?: string) {
  if (!order.customer_email) return;
  const ejs = (window as Window & { emailjs?: { send: (svcId: string, tplId: string, params: Record<string, string>) => Promise<void> } }).emailjs;
  if (!ejs) return;

  // Fetch emailjs settings from DB
  const { data: svcRow } = await supabase.from('settings').select('value').eq('key', 'emailjs_service_id').single();
  const { data: tplRow } = await supabase.from('settings').select('value').eq('key', 'emailjs_template_id').single();
  const serviceId = svcRow?.value;
  const templateId = tplRow?.value;
  if (!serviceId || !templateId) return;

  const isDispatched = order.verification_status === 'Dispatched';
  const statusLabel = isDispatched ? 'Dispatched – On Its Way!' : 'Payment Verified – Ready to Ship';

  await ejs.send(serviceId, templateId, {
    order_id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    order_status: statusLabel,
    tracking_number: trackingNumber || order.tracking_number || 'Will be updated shortly',
    shipping_address: `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_province} ${order.shipping_zip}`,
    shipping_country: order.shipping_country,
    payment_method: order.verification_method,
    amount_total: `$${(order.amount_paid || 0).toFixed(2)}`,
    tracking_link: trackingNumber
      ? `https://t.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`
      : (order.tracking_number ? `https://t.17track.net/en#nums=${encodeURIComponent(order.tracking_number)}` : 'Will be sent separately'),
  });
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadItems = async (orderId: string) => {
    const { data } = await supabase
      .from('order_items')
      .select('*, products(title, images), product_variants(color, size)')
      .eq('order_id', orderId);
    if (data) setOrderItems(data as OrderItem[]);
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); setOrderItems([]); }
    else { setExpandedId(id); loadItems(id); }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    const { error } = await supabase.from('orders').update({ verification_status: status as Order['verification_status'] }).eq('id', id);
    if (!error) {
      toast.success('Status updated');
      // Send email notification if it's a shipping-related status
      if (status === 'Paid - Ready to Ship' || status === 'Dispatched') {
        const order = orders.find(o => o.id === id);
        if (order) {
          const updatedOrder = { ...order, verification_status: status as Order['verification_status'] };
          sendStatusEmail(updatedOrder).then(() => {
            if (order.customer_email) toast.success(`Email notification sent to ${order.customer_email}`);
          }).catch(() => {
            // Silent fail — email is optional
          });
        }
      }
      load();
    } else {
      toast.error('Failed to update status');
    }
    setUpdatingStatus(null);
  };

  const saveTracking = async (id: string) => {
    const tracking = trackingInputs[id]?.trim();
    if (!tracking) { toast.error('Enter a tracking number first'); return; }
    setUpdatingStatus(id);
    const { error } = await supabase
      .from('orders')
      .update({ tracking_number: tracking, verification_status: 'Dispatched' })
      .eq('id', id);
    if (!error) {
      toast.success('Tracking saved, status set to Dispatched');
      // Send dispatch email
      const order = orders.find(o => o.id === id);
      if (order) {
        const updatedOrder = { ...order, verification_status: 'Dispatched' as Order['verification_status'] };
        sendStatusEmail(updatedOrder, tracking).then(() => {
          if (order.customer_email) toast.success(`Dispatch email sent to ${order.customer_email}`);
        }).catch(() => {});
      }
      load();
      setTrackingInputs(prev => ({ ...prev, [id]: '' }));
    } else {
      toast.error('Failed to save tracking number');
    }
    setUpdatingStatus(null);
  };

  const handleExport = () => {
    const paid = orders.filter(o => o.verification_status === 'Paid - Ready to Ship');
    if (!paid.length) { toast.error('No paid orders ready to export'); return; }
    exportOrdersToCSV(paid);
    toast.success(`Exported ${paid.length} paid orders`);
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchFilter = !filter || o.verification_status === filter;
    return matchSearch && matchFilter;
  });

  const paidCount = orders.filter(o => o.verification_status === 'Paid - Ready to Ship').length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7]">Orders</h1>
          <div className="flex gap-2">
            <button onClick={load}
              className="p-2 bg-[#222222] border border-[#333333] rounded-xl text-[#888888] hover:text-[#FFCC00] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FFCC00] text-black text-sm font-bold rounded-xl hover:bg-[#E6B800] transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Paid ({paidCount})</span>
              <span className="sm:hidden">{paidCount}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
              className={`w-full pl-9 pr-4 ${inputCls}`} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className={inputCls}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Email notification info */}
        <div className="flex items-center gap-2 p-3 bg-[#FFCC00]/5 border border-[#FFCC00]/20 rounded-xl">
          <span className="text-xs text-[#FFCC00]">📧</span>
          <p className="text-xs text-[#AAAAAA] font-500">
            Customers are automatically emailed when status changes to <strong className="text-[#FFCC00]">Paid - Ready to Ship</strong> or <strong className="text-[#FFCC00]">Dispatched</strong> (requires EmailJS configured in Settings).
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#222222] rounded-xl animate-pulse border border-[#333333]" />
            ))}
          </div>
        ) : (
          <div className="bg-[#222222] border border-[#333333] rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead>
                <tr className="border-b border-[#333333]">
                  {['', 'Customer', 'Country', 'Amount', 'Payment', 'Status', 'Date', 'Tracking'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#888888] font-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filtered.map(order => (
                  <>
                    <tr key={order.id} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleExpand(order.id)} className="text-[#888888] hover:text-[#FFCC00] transition-colors">
                          {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-600 text-[#F5F5F7]">{order.customer_name}</p>
                        <p className="text-xs text-[#888888] font-mono">{order.id.slice(0, 8)}…</p>
                        {order.customer_email && (
                          <p className="text-xs text-[#666666] truncate max-w-[140px]">{order.customer_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#888888] text-xs">
                        {order.shipping_country === 'United States' ? '🇺🇸 US' : '🇬🇧 UK'}
                      </td>
                      <td className="px-4 py-3 text-[#FFCC00] font-bold">{formatPrice(order.amount_paid || 0)}</td>
                      <td className="px-4 py-3 text-xs text-[#888888]">{order.verification_method}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.verification_status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className={`text-xs px-2 py-1 rounded-full font-600 cursor-pointer focus:outline-none bg-transparent border-0 ${statusColors[order.verification_status]} disabled:opacity-50`}>
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-[#1A1A1A] text-[#F5F5F7]">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#888888]">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        {order.tracking_number ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono text-[#FFCC00] truncate max-w-[80px]">{order.tracking_number}</span>
                            <a
                              href={`https://t.17track.net/en#nums=${encodeURIComponent(order.tracking_number)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[#888888] hover:text-[#FFCC00] transition-colors"
                              title="Track on 17TRACK">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              value={trackingInputs[order.id] || ''}
                              onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                              placeholder="Tracking #"
                              className="w-24 px-2 py-1 bg-[#1A1A1A] border border-[#333333] rounded-lg text-xs text-[#F5F5F7] focus:outline-none focus:border-[#FFCC00]/50"
                            />
                            <button
                              onClick={() => saveTracking(order.id)}
                              disabled={updatingStatus === order.id}
                              className="px-2 py-1 bg-[#FFCC00] text-black text-xs font-bold rounded-lg hover:bg-[#E6B800] disabled:opacity-50 transition-colors"
                              title="Save tracking & dispatch">
                              <Package className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={8} className="bg-[#1A1A1A] px-5 py-5 border-b border-[#333333]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-[#FFCC00] uppercase tracking-wider mb-3">Customer Details</p>
                              {[
                                ['Phone', order.customer_phone],
                                ['Email', order.customer_email || '—'],
                                ['Address', `${order.shipping_address}, ${order.shipping_city}`],
                                ['State/Region', `${order.shipping_province} ${order.shipping_zip}`],
                                ['Delivery', order.delivery_type],
                                ['Payment Ref', order.verification_reference],
                                ['Tracking', order.tracking_number || 'Not assigned yet'],
                              ].map(([l, v]) => (
                                <div key={l} className="flex gap-2 text-xs">
                                  <span className="text-[#888888] w-20 flex-shrink-0 font-600">{l}:</span>
                                  <span className="text-[#F5F5F7] break-all">{v}</span>
                                </div>
                              ))}
                              {order.tracking_number && (
                                <a
                                  href={`https://t.17track.net/en#nums=${encodeURIComponent(order.tracking_number)}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#FFCC00] hover:underline font-700">
                                  <ExternalLink className="w-3 h-3" /> View on 17TRACK
                                </a>
                              )}
                              {order.gift_card_type && (
                                <div className="flex gap-2 text-xs">
                                  <span className="text-[#888888] w-20">Gift Card:</span>
                                  <span className="text-orange-400">{order.gift_card_type} — {order.gift_card_code}</span>
                                </div>
                              )}
                              {order.notes && (
                                <div className="flex gap-2 text-xs">
                                  <span className="text-[#888888] w-20">Notes:</span>
                                  <span className="text-[#F5F5F7]">{order.notes}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-bold text-[#FFCC00] uppercase tracking-wider mb-3">Order Items</p>
                              <div className="space-y-2">
                                {orderItems.map(item => (
                                  <div key={item.id} className="flex items-center gap-3 p-2.5 bg-[#222222] rounded-lg text-xs border border-[#333333]">
                                    {(item as OrderItem & { products?: { images: string[] } }).products?.images?.[0] && (
                                      <img src={(item as OrderItem & { products?: { images: string[] } }).products!.images[0]} alt="" className="w-9 h-9 object-cover rounded-lg" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[#F5F5F7] font-600 truncate">{(item as OrderItem & { products?: { title: string } }).products?.title || 'Product'}</p>
                                      {(item as OrderItem & { product_variants?: { color: string; size: string } }).product_variants && (
                                        <p className="text-[#888888]">
                                          {[(item as OrderItem & { product_variants?: { color: string; size: string } }).product_variants?.color, (item as OrderItem & { product_variants?: { color: string; size: string } }).product_variants?.size].filter(Boolean).join(' / ')}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-[#FFCC00] font-bold flex-shrink-0">{formatPrice(item.price)} × {item.quantity}</span>
                                  </div>
                                ))}
                                {orderItems.length === 0 && <p className="text-xs text-[#666666]">No item details available</p>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#888888]">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
