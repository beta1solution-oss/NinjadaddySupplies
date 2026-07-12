import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Order } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function generateCartKey(productId: string, variantId?: string | null): string {
  return `${productId}:${variantId || 'no-variant'}`;
}

export function exportOrdersToCSV(orders: Order[]): void {
  const headers = [
    'Order ID', 'Consignee Name', 'Consignee Phone', 'Email',
    'Shipping Country', 'Detail Address', 'City', 'Province/State',
    'Postcode/Zip', 'Delivery Type', 'Payment Method', 'Verification Reference',
    'Amount Paid (USD)', 'Gift Card Type', 'Gift Card Code',
    'Status', 'Tracking Number', 'Notes', 'Order Date'
  ];

  const rows = orders.map(o => [
    o.id,
    o.customer_name,
    o.customer_phone,
    o.customer_email || '',
    o.shipping_country,
    o.shipping_address,
    o.shipping_city,
    o.shipping_province,
    o.shipping_zip,
    o.delivery_type,
    o.verification_method,
    o.verification_reference,
    o.amount_paid ?? '',
    o.gift_card_type || '',
    o.gift_card_code || '',
    o.verification_status,
    o.tracking_number || '',
    o.notes || '',
    formatDate(o.created_at)
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ninjadaddy-paid-orders-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {}
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
