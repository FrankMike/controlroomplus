import { useState, useEffect } from 'react';

interface MovieStats {
  totalCount: number;
  totalSize: string;
  isLoading: boolean;
}

export function useMovieStats(): MovieStats {
  const [stats, setStats] = useState<MovieStats>({
    totalCount: 0,
    totalSize: '0 GB',
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/movies');
        const movies = await response.json();
        
        const totalCount = movies.length;
        const totalBytes = movies.reduce((acc: number, movie: any) => acc + (movie.fileSize || 0), 0);
        const totalTerabytes = totalBytes / (1024 * 1024 * 1024 * 1024);
        
        const totalSize = totalTerabytes >= 1
          ? `${totalTerabytes.toFixed(2)} TB`
          : `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

        setStats({
          totalCount,
          totalSize,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching movie stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
} 