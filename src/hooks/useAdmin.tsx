import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminUser } from '@/types';
import type { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'ninjadaddy@gmail.com';

interface AdminContextType {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

function mapUser(user: User): AdminUser {
  return { id: user.id, email: user.email! };
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user && session.user.email === ADMIN_EMAIL) {
        setAdmin(mapUser(session.user));
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && session.user.email === ADMIN_EMAIL) {
        setAdmin(mapUser(session.user));
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setAdmin(null);
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error('Unauthorized access. Admin credentials required.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) setAdmin(mapUser(data.user));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AdminContext.Provider value={{ admin, loading, signIn, signOut, updatePassword }}>
      {children}
    </AdminContext.Provider>
  );
};

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
