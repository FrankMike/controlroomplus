import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useTvShowStats() {
  const [stats, setStats] = useState({
    totalShows: 0,
    totalEpisodes: 0,
    totalSize: '0 GB',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        const response = await fetch('/api/tvshows');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const shows = await response.json();
        
        if (!Array.isArray(shows)) {
          throw new Error('Invalid data format');
        }

        const totalShows = shows.length;
        const totalEpisodes = shows.reduce((acc, show) => acc + (show.episodeCount || 0), 0);
        const totalBytes = shows.reduce((acc, show) => acc + (show.totalFileSize || 0), 0);
        
        const totalSize = formatFileSize(totalBytes);

        setStats({ totalShows, totalEpisodes, totalSize });
      } catch (error) {
        console.error('Error fetching TV show stats:', error);
        setStats({ totalShows: 0, totalEpisodes: 0, totalSize: '0 GB' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, authLoading]);

  return { ...stats, isLoading };
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 GB';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
} 