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
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

type SortField = 'title' | 'year' | 'duration' | 'fileSize' | 'resolution' | 'videoCodec';
type SortDirection = 'asc' | 'desc';

export default function MoviePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredMovies = () => {
    const filtered = movies.filter(movie => 
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.year && movie.year.toString().includes(searchQuery))
    );
    return getSortedMovies(filtered);
  };

  const getSortedMovies = (moviesToSort = movies) => {
    return [...moviesToSort].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'title':
          return direction * a.title.localeCompare(b.title);
        case 'year':
          return direction * ((a.year || 0) - (b.year || 0));
        case 'duration':
          return direction * (a.duration - b.duration);
        case 'fileSize':
          return direction * (a.fileSize - b.fileSize);
        case 'resolution': {
          const resOrder = { '4K': 4, '1080p': 3, '720p': 2, 'SD': 1, 'Unknown': 0 };
          const aVal = resOrder[a.resolution as keyof typeof resOrder] || 0;
          const bVal = resOrder[b.resolution as keyof typeof resOrder] || 0;
          return direction * (aVal - bVal);
        }
        case 'videoCodec':
          return direction * a.videoCodec.localeCompare(b.videoCodec);
        default:
          return 0;
      }
    });
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="font-semibold text-gray-900 text-center cursor-pointer group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        {children}
        <span className="text-gray-400">
          {sortField === field ? (
            sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50" />
          )}
        </span>
      </div>
    </TableHead>
  );

  const calculateTotalSize = (movies: Movie[]) => {
    const totalBytes = movies.reduce((acc, movie) => acc + (movie.fileSize || 0), 0);
    const totalTerabytes = totalBytes / (1024 * 1024 * 1024 * 1024); // Convert to TB
    
    if (totalTerabytes < 1) {
      const totalGigabytes = totalBytes / (1024 * 1024 * 1024); // Convert to GB
      return `${totalGigabytes.toFixed(2)} GB`;
    }
    
    return `${totalTerabytes.toFixed(2)} TB`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm p-8">
          <LoadingSpinner />
          <p className="text-center text-gray-500 mt-4">Loading movies...</p>
        </div>
      </div>
    );
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
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSyncing ? 'Syncing...' : 'Sync with Plex'}
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
          <span>{getFilteredMovies().length} movies found</span>
          <span className="w-px h-4 bg-gray-300" />
          <span>Total size: {calculateTotalSize(getFilteredMovies())}</span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <SortHeader field="title">Title</SortHeader>
                <SortHeader field="year">Year</SortHeader>
                <SortHeader field="duration">Duration</SortHeader>
                <SortHeader field="fileSize">Size</SortHeader>
                <SortHeader field="resolution">Resolution</SortHeader>
                <TableHead className="font-semibold text-gray-900 text-center">Dimensions</TableHead>
                <SortHeader field="videoCodec">Video Codec</SortHeader>
                <TableHead className="font-semibold text-gray-900">Audio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredMovies().map((movie) => (
                <TableRow 
                  key={movie.plexId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{decodeHTMLEntities(movie.title) || 'Unknown'}</TableCell>
                  <TableCell className="text-center">{movie.year || '-'}</TableCell>
                  <TableCell className="text-center">{formatDuration(movie.duration)}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">{formatFileSize(movie.fileSize)}</TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {movie.resolution || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{movie.dimensions || 'Unknown'}</TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {movie.videoCodec || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {movie.audioStreams && movie.audioStreams.length > 0
                        ? movie.audioStreams.map((stream, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
                            >
                              {formatAudioStream(stream)}
                            </span>
                          ))
                        : <span className="text-gray-500">No audio streams</span>
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {getFilteredMovies().length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No movies found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
