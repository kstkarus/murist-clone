import { useState, useEffect } from 'react';

interface Settings {
  siteName: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  description: string;
  vkLink: string;
  telegramLink: string;
  guaranteeText: string;
  privacyPolicy: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Ошибка загрузки настроек');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
} 