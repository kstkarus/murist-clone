import { useState, useEffect } from 'react';
import { useSettings } from './useSettings';
import { useServices } from './useServices';
import { useAdvantages } from './useAdvantages';
import { useTeam } from './useTeam';

export function useInitialData() {
  const { settings, loading: settingsLoading, error: settingsError } = useSettings();
  const { services, loading: servicesLoading, error: servicesError } = useServices();
  const { advantages, loading: advantagesLoading, error: advantagesError } = useAdvantages();
  const { team, loading: teamLoading, error: teamError } = useTeam();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setReviewsLoading(true);
        const [reviewsData] = await Promise.all([
          fetch('/api/review').then(res => res.json()),
        ]);
        setReviews(reviewsData.reviews || []);
      } catch (error) {
        setReviewsError('Ошибка загрузки отзывов');
        console.error('Error loading reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
    const allDataLoaded = !settingsLoading && !servicesLoading && !advantagesLoading && !teamLoading && !reviewsLoading;
    if (allDataLoaded) {
      // Даем небольшую задержку для плавного перехода
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settingsLoading, servicesLoading, advantagesLoading, teamLoading, reviewsLoading]);

  const isLoading = isInitialLoading || settingsLoading || servicesLoading || advantagesLoading || teamLoading || reviewsLoading;
  const error = settingsError || servicesError || advantagesError || teamError || reviewsError;

  return {
    settings,
    services,
    advantages,
    team,
    reviews,
    isLoading,
    error
  };
} 