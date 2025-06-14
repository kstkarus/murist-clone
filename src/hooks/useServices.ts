import { useEffect, useState } from 'react';

export function useServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/service')
      .then(res => res.json())
      .then(data => {
        setServices(data.services || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки услуг');
        setLoading(false);
      });
  }, []);

  return { services, loading, error };
} 