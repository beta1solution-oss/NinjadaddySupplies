import { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckCheck, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Message {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Poll every 15s for new messages
  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (msg: Message) => {
    if (!msg.is_read) {
      await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
    setSelected(msg.is_read ? msg : { ...msg, is_read: true });
  };

  const deleteMsg = async (id: string) => {
    await supabase.from('messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Message deleted');
  };

  const markAllRead = async () => {
    await supabase.from('messages').update({ is_read: true }).eq('is_read', false);
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    toast.success('All messages marked as read');
  };

  const filtered = filter === 'unread' ? messages.filter(m => !m.is_read) : messages;
  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)] gap-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7]">Customer Messages</h1>
            {unreadCount > 0 && (
              <span className="w-6 h-6 bg-[#FFCC00] text-black text-xs font-900 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#222222] border border-[#333333] text-[#888888] hover:text-[#F5F5F7] rounded-xl text-xs font-700 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={load}
              className="p-2 bg-[#222222] border border-[#333333] rounded-xl text-[#888888] hover:text-[#FFCC00] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-700 transition-colors capitalize ${
                filter === f
                  ? 'bg-[#FFCC00] text-black'
                  : 'bg-[#222222] text-[#888888] border border-[#333333] hover:text-[#F5F5F7]'
              }`}>
              {f === 'unread' ? `Unread (${unreadCount})` : 'All Messages'}
            </button>
          ))}
        </div>

        {/* Chat layout */}
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Message list */}
          <div className="w-full md:w-80 flex-shrink-0 bg-[#161616] border border-[#333333] rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto divide-y divide-[#222222]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="h-3 bg-[#2A2A2A] rounded w-1/2 mb-2" />
                    <div className="h-3 bg-[#222222] rounded w-3/4" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-center p-4">
                  <MessageSquare className="w-8 h-8 text-[#333333]" />
                  <p className="text-sm text-[#555555] font-500">
                    {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                filtered.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => markRead(msg)}
                    className={`w-full text-left p-4 hover:bg-[#1E1E1E] transition-colors flex items-start gap-3 ${
                      selected?.id === msg.id ? 'bg-[#1E1E1E] border-l-2 border-[#FFCC00]' : ''
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${msg.is_read ? 'bg-transparent' : 'bg-[#FFCC00]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-sm truncate ${msg.is_read ? 'text-[#888888] font-600' : 'text-[#F5F5F7] font-800'}`}>
                          {msg.customer_name}
                        </p>
                        <span className="text-xs text-[#555555] flex-shrink-0">{timeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-[#555555] font-mono truncate">#{msg.order_id.slice(0, 12)}…</p>
                      <p className="text-xs text-[#777777] font-500 mt-1 line-clamp-2">{msg.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message detail / chat bubble view */}
          <div className="flex-1 bg-[#161616] border border-[#333333] rounded-2xl flex flex-col overflow-hidden hidden md:flex">
            {selected ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFCC00]/20 flex items-center justify-center">
                      <span className="text-sm font-900 text-[#FFCC00]">
                        {selected.customer_name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-800 text-[#F5F5F7]">{selected.customer_name}</p>
                      {selected.customer_email && (
                        <p className="text-xs text-[#666666]">{selected.customer_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/admin/orders`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222222] border border-[#333333] rounded-xl text-xs text-[#888888] hover:text-[#FFCC00] transition-colors font-700"
                      title="View order"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Order
                    </a>
                    <button
                      onClick={() => deleteMsg(selected.id)}
                      className="p-1.5 text-[#555555] hover:text-red-400 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Order ID reference */}
                <div className="px-5 py-2 border-b border-[#1E1E1E]">
                  <p className="text-xs text-[#555555] font-500">
                    Order ID: <span className="font-mono text-[#FFCC00]">{selected.order_id}</span>
                  </p>
                </div>

                {/* Message bubble */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFCC00]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-900 text-[#FFCC00]">
                        {selected.customer_name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="max-w-md">
                      <div className="bg-[#222222] rounded-2xl rounded-tl-none px-4 py-3">
                        <p className="text-sm text-[#F5F5F7] font-500 leading-relaxed whitespace-pre-wrap">
                          {selected.message}
                        </p>
                      </div>
                      <p className="text-xs text-[#555555] mt-1.5 ml-1">
                        {new Date(selected.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                        {selected.is_read && (
                          <span className="ml-2 text-[#FFCC00]">
                            <CheckCheck className="w-3 h-3 inline" /> Read
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Admin reply hint */}
                  <div className="mt-6 p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-center">
                    <p className="text-xs text-[#555555] font-500">
                      To respond, contact the customer via WhatsApp or their email address above. Reply functionality coming soon.
                    </p>
                  </div>
                </div>
                <div ref={bottomRef} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-16 h-16 bg-[#FFCC00]/10 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-[#FFCC00]/50" />
                </div>
                <p className="text-sm text-[#555555] font-500 max-w-xs">
                  Select a message from the list to view customer payment proof and order details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
