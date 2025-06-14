import { useEffect, useState } from 'react';

export function useAdvantages() {
  const [advantages, setAdvantages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/advantage')
      .then(res => res.json())
      .then(data => {
        setAdvantages(data.advantages || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки преимуществ');
        setLoading(false);
      });
  }, []);

  return { advantages, loading, error };
} 