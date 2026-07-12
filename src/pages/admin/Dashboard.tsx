import { useEffect, useState } from 'react';
import { ShoppingBag, Package, DollarSign, Clock, TrendingUp, Eye } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { Link } from 'react-router-dom';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
}

const statusClass: Record<string, { bg: string; text: string; border: string }> = {
  'Pending Verification': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border border-amber-500/30' },
  'Paid - Ready to Ship': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border border-emerald-500/30' },
  'Dispatched': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border border-blue-500/30' },
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('id, amount_paid, verification_status, customer_name, shipping_country, created_at').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact' }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((s, o) => s + (o.amount_paid || 0), 0);
      const pendingOrders = orders.filter(o => o.verification_status === 'Pending Verification').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        totalProducts: productsRes.count || 0,
      });

      setRecentOrders(orders.slice(0, 8) as Order[]);
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-[#FFCC00]', bg: 'bg-[#FFCC00]/10', border: 'border-[#FFCC00]/20' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'Pending Verification', value: stats.pendingOrders, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F7]">Dashboard</h1>
          <p className="text-sm text-[#888888] mt-1">Welcome back to Ninjadaddy Admin Space</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#222222] border border-[#333333] rounded-2xl p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-[#222222] border rounded-2xl p-4 hover:border-[#FFCC00]/30 transition-colors ${border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <TrendingUp className="w-3.5 h-3.5 text-[#444444]" />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-[#888888] mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-[#222222] border border-[#333333] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#333333]">
            <h2 className="font-bold text-[#F5F5F7]">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-[#FFCC00] hover:text-[#E6B800] hover:underline flex items-center gap-1 transition-colors">
              View all <Eye className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333333] bg-[#1E1E1E]">
                  {['Order ID', 'Customer', 'Country', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#888888] font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {recentOrders.map(order => {
                  const sc = statusClass[order.verification_status] || { bg: '', text: 'text-[#888888]', border: '' };
                  return (
                    <tr key={order.id} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#777777]">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-[#F5F5F7] font-semibold">{order.customer_name}</td>
                      <td className="px-4 py-3 text-[#888888] text-sm">{order.shipping_country === 'United States' ? '🇺🇸 US' : '🇬🇧 UK'}</td>
                      <td className="px-4 py-3 text-[#FFCC00] font-bold">{formatPrice(order.amount_paid || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                          {order.verification_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#777777]">{formatDate(order.created_at)}</td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-[#666666] text-sm">No orders yet — they'll appear here when customers order</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
