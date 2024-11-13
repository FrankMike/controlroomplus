'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface AudioStream {
  language: string;
  codec: string;
  channels: number;
}

interface Movie {
  title: string;
  titleWithYear: string;
  year: number;
  duration: number;
  durationFormatted: string;
  fileSize: number;
  resolution: string;
  dimensions: string;
  videoCodec: string;
  audioStreams: AudioStream[];
  plexId: string;
}

export default function MoviePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/movies');
      const data = await response.json();
      console.log('Fetched movies:', data);
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch movies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncMovies = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/movies/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Movies synced successfully',
        });
        fetchMovies();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync movies',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchMovies();
  }, [isAuthenticated, router]);

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!user) {
    return null; // Router will handle redirect
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return 'Unknown';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatAudioStream = (stream: AudioStream) => {
    if (!stream) return '';
    return `${stream.language || 'Unknown'} ${stream.codec || 'Unknown'} ${stream.channels || 2}ch`;
  };

  const decodeHTMLEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Movie Collection</h1>
        <Button
          onClick={syncMovies}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync with Plex'}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Video Codec</TableHead>
              <TableHead>Audio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movies.map((movie) => (
              <TableRow key={movie.plexId}>
                <TableCell>{decodeHTMLEntities(movie.title) || 'Unknown'}</TableCell>
                <TableCell>{movie.year || '-'}</TableCell>
                <TableCell>{formatDuration(movie.duration)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatFileSize(movie.fileSize)}</TableCell>
                <TableCell>{movie.resolution || 'Unknown'}</TableCell>
                <TableCell>{movie.dimensions || 'Unknown'}</TableCell>
                <TableCell>{movie.videoCodec || 'Unknown'}</TableCell>
                <TableCell>
                  {movie.audioStreams && movie.audioStreams.length > 0
                    ? movie.audioStreams.map(formatAudioStream).join(', ')
                    : 'No audio streams'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
