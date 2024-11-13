import { useState, useEffect } from 'react';

interface TvShowStats {
  totalShows: number;
  totalEpisodes: number;
  totalSize: string;
  isLoading: boolean;
}

export function useTvShowStats(): TvShowStats {
  const [stats, setStats] = useState<TvShowStats>({
    totalShows: 0,
    totalEpisodes: 0,
    totalSize: '0 GB',
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/tvshows');
        if (!response.ok) throw new Error('Failed to fetch TV shows');
        
        const shows = await response.json();
        const totalShows = shows.length;
        const totalEpisodes = shows.reduce((acc: number, show: any) => acc + (show.episodeCount || 0), 0);
        const totalBytes = shows.reduce((acc: number, show: any) => acc + (show.totalFileSize || 0), 0);
        
        // Convert bytes to appropriate unit
        const totalSize = formatFileSize(totalBytes);

        setStats({
          totalShows,
          totalEpisodes,
          totalSize,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching TV show stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 GB';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
} 