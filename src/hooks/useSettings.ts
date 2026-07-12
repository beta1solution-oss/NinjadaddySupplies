import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type SettingsMap = Record<string, string>;

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('key, value');
      if (data) {
        const map: SettingsMap = {};
        data.forEach(s => { if (s.value) map[s.key] = s.value; });
        setSettings(map);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const getSetting = (key: string, fallback = '') => settings[key] ?? fallback;

  return { settings, loading, getSetting };
}
