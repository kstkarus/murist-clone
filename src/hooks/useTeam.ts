import { useEffect, useState } from 'react';

interface TeamMember {
  id: number;
  name: string;
  position: string;
  photo: string;
  bio: string;
  order?: number;
}

export function useTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/team')
      .then(res => res.json())
      .then(data => {
        setTeam(data.team || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки команды');
        setLoading(false);
      });
  }, []);

  return { team, loading, error };
} 