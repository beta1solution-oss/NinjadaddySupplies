export interface Product {
  id: string;
  title: string;
  description: string | null;
  base_price: number;
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  is_featured: boolean;
  is_free_shipping: boolean;
  likes_count: number;
  images: string[];
  product_sku: string | null;
  created_at: string;
  variants?: ProductVariant[];
  categories?: Category[];
  tags?: string[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: string | null;
  size: string | null;
  price: number;
  stock_quantity: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_country: 'United States' | 'United Kingdom';
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_zip: string;
  delivery_type: string;
  verification_reference: string;
  verification_method: string;
  verification_status: 'Pending Verification' | 'Paid - Ready to Ship' | 'Dispatched';
  tracking_number: string | null;
  amount_paid: number | null;
  gift_card_code: string | null;
  gift_card_type: string | null;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  cartKey: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface GiftCard {
  id: string;
  code: string;
  card_type: string;
  amount: number;
  is_used: boolean;
  used_at: string | null;
  order_id: string | null;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  sort_code?: string;
  swift_code?: string;
  country: string;
  currency: string;
  notes?: string;
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  percent_off: number | null;
  fixed_off: number | null;
  expiry: string | null;
  is_active: boolean;
  created_at: string;
}
