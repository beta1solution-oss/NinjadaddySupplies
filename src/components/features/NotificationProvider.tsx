import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import { playNotificationSound } from '@/lib/utils';
import { toast } from 'sonner';
import { ShoppingBag } from 'lucide-react';

const POLL_INTERVAL = 15000;

export default function NotificationProvider() {
  const { admin } = useAdmin();
  const lastOrderTimeRef = useRef<string | null>(null);
  const [permissionAsked, setPermissionAsked] = useState(false);

  // Request browser notification permission on first render
  useEffect(() => {
    if (!admin || permissionAsked) return;
    setPermissionAsked(true);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [admin, permissionAsked]);

  useEffect(() => {
    if (!admin) return;

    const initRef = async () => {
      const { data } = await supabase
        .from('orders')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]) lastOrderTimeRef.current = data[0].created_at;
    };

    initRef();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, customer_name, amount_paid, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!data?.length) return;

      const newest = data[0];
      if (lastOrderTimeRef.current && newest.created_at > lastOrderTimeRef.current) {
        const newOrders = data.filter(o => o.created_at > lastOrderTimeRef.current!);
        lastOrderTimeRef.current = newest.created_at;

        newOrders.forEach(order => {
          playNotificationSound();

          toast.custom(() => (
            <div className="bg-brand-surface border border-brand-yellow/50 rounded-xl p-4 flex items-start gap-3 shadow-lg yellow-glow-sm max-w-sm w-full">
              <div className="w-9 h-9 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-bold text-brand-yellow text-sm">New Order!</p>
                <p className="text-xs text-brand-off-white mt-0.5">{order.customer_name}</p>
                {order.amount_paid && (
                  <p className="text-xs text-brand-muted">${order.amount_paid} paid</p>
                )}
              </div>
            </div>
          ), { duration: 8000 });

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🛒 New Order - Ninjadaddy!', {
              body: `New order from ${order.customer_name}`,
              icon: '/icon-192.png',
              tag: order.id
            });
          }
        });
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [admin]);

  return null;
}
