import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "@/hooks/useAdmin";
import { CartProvider } from "@/hooks/useCart";
import NotificationProvider from "@/components/features/NotificationProvider";

// Public Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCategories from "./pages/admin/Categories";
import AdminSettings from "./pages/admin/Settings";
import AdminGiftCards from "./pages/admin/GiftCards";
import AdminDiscounts from "./pages/admin/Discounts";
import AdminMessages from "./pages/admin/Messages";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } }
});

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdmin();
  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#FFCC00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!admin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminLoginRoute() {
  const { admin, loading } = useAdmin();
  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#FFCC00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (admin) return <Navigate to="/admin/dashboard" replace />;
  return <AdminLogin />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <AdminProvider>
        <CartProvider>
          <BrowserRouter>
            <NotificationProvider />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
              <Route path="/track-order" element={<TrackOrder />} />

              {/* Admin Auth */}
              <Route path="/admin" element={<AdminLoginRoute />} />
              <Route path="/admin/login" element={<AdminLoginRoute />} />

              {/* Admin Protected */}
              <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
              <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
              <Route path="/admin/categories" element={<ProtectedAdminRoute><AdminCategories /></ProtectedAdminRoute>} />
              <Route path="/admin/discounts" element={<ProtectedAdminRoute><AdminDiscounts /></ProtectedAdminRoute>} />
              <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
              <Route path="/admin/gift-cards" element={<ProtectedAdminRoute><AdminGiftCards /></ProtectedAdminRoute>} />
              <Route path="/admin/messages" element={<ProtectedAdminRoute><AdminMessages /></ProtectedAdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
