import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useMovieStats() {
  const [stats, setStats] = useState({
    totalCount: 0,
    totalSize: '0 GB',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        const response = await fetch('/api/movies');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const movies = await response.json();
        
        if (!Array.isArray(movies)) {
          throw new Error('Invalid data format');
        }

        const totalCount = movies.length;
        const totalBytes = movies.reduce((acc, movie) => acc + (movie.fileSize || 0), 0);
        const totalSize = formatFileSize(totalBytes);

        setStats({ totalCount, totalSize });
      } catch (error) {
        console.error('Error fetching movie stats:', error);
        setStats({ totalCount: 0, totalSize: '0 GB' });
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