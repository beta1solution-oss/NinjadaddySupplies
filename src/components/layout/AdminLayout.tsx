import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Settings,
  Gift, LogOut, Menu, Bell, Download, Percent, MessageSquare, X
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminLayoutProps { children: React.ReactNode; }

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/discounts', icon: Percent, label: 'Discounts' },
  { to: '/admin/gift-cards', icon: Gift, label: 'Gift Cards' },
  { to: '/admin/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ─── Sidebar Nav Items are static so we extract them as a pure component ───
interface SidebarNavProps {
  unreadMessages: number;
  onNavClick: () => void;
}

function SidebarNav({ unreadMessages, onNavClick }: SidebarNavProps) {
  return (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-600 transition-all relative ${
              isActive
                ? 'bg-[#FFCC00]/10 text-[#FFCC00] border-l-[3px] border-[#FFCC00] pl-[9px]'
                : 'text-[#888888] hover:text-[#F5F5F7] hover:bg-[#2A2A2A]'
            }`
          }
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
          {to === '/admin/messages' && unreadMessages > 0 && (
            <span className="ml-auto min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs font-900 rounded-full flex items-center justify-center leading-none">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

// ─── Sidebar Logo ────────────────────────────────────────────────
function SidebarLogo() {
  return (
    <div className="p-4 border-b border-[#222222]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#2A2A2A] flex items-center justify-center border border-[#333333] flex-shrink-0">
          <img
            src="/src/assets/ninjadaddy-logo.png"
            alt="N"
            className="w-full h-full object-cover"
            onError={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              const parent = el.parentElement;
              if (parent) parent.innerHTML = '<span style="color:#FFCC00;font-size:1.1rem;font-weight:900">N</span>';
            }}
          />
        </div>
        <div>
          <p className="font-black text-sm text-[#FFCC00] tracking-tight leading-none">NINJADADDY</p>
          <p className="text-xs text-[#666666] mt-0.5">Admin Space</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, signOut } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Poll for unread messages badge
  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadMessages(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') toast.success('App installed!');
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#1A1A1A] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-[#111111] border-r border-[#222222] flex-shrink-0">
        <SidebarLogo />
        <SidebarNav unreadMessages={unreadMessages} onNavClick={closeSidebar} />
        {/* Bottom */}
        <div className="p-3 border-t border-[#222222] space-y-2">
          {canInstall && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center gap-2 px-3 py-2 bg-[#FFCC00] text-black text-sm font-bold rounded-lg hover:bg-[#E6B800] transition-colors"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          )}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 bg-[#FFCC00]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#FFCC00]">{admin?.email?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#F5F5F7] font-600 truncate">{admin?.email}</p>
            </div>
            <button onClick={handleSignOut} className="p-1 text-[#888888] hover:text-red-400 transition-colors flex-shrink-0" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={closeSidebar} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-[#111111] border-r border-[#222222] flex flex-col">
            <div className="flex items-center justify-between pr-3">
              <SidebarLogo />
              <button onClick={closeSidebar} className="p-1 text-[#888888] hover:text-[#F5F5F7]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarNav unreadMessages={unreadMessages} onNavClick={closeSidebar} />
            <div className="p-3 border-t border-[#222222] space-y-2">
              {canInstall && (
                <button onClick={handleInstall} className="w-full flex items-center gap-2 px-3 py-2 bg-[#FFCC00] text-black text-sm font-bold rounded-lg hover:bg-[#E6B800] transition-colors">
                  <Download className="w-4 h-4" /> Install App
                </button>
              )}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-7 h-7 bg-[#FFCC00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#FFCC00]">{admin?.email?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#F5F5F7] font-600 truncate">{admin?.email}</p>
                </div>
                <button onClick={handleSignOut} className="p-1 text-[#888888] hover:text-red-400 transition-colors flex-shrink-0">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-[#1A1A1A] border-b border-[#222222] flex items-center justify-between px-4 flex-shrink-0">
          <button className="md:hidden p-2 text-[#888888] hover:text-[#F5F5F7] -ml-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            {/* Unread badge in header */}
            {unreadMessages > 0 && (
              <NavLink
                to="/admin/messages"
                className="relative flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full hover:bg-red-500/20 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-bold">{unreadMessages} new</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              </NavLink>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-full">
              <Bell className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span className="text-xs text-[#FFCC00] font-bold hidden sm:inline">Live Orders</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 text-[#F5F5F7]">
          {children}
        </main>
      </div>
    </div>
  );
}
