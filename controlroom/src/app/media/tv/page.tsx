'use client';

import React, { useState, useEffect } from 'react';
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
import { ChevronUp, ChevronDown, Search, ChevronRight, ChevronDown as ExpandIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTvShowStats } from '@/hooks/useTvShowStats';

interface Episode {
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  duration: number;
  fileSize: number;
  resolution: string;
  videoCodec: string;
  plexId: string;
}

interface Season {
  seasonNumber: number;
  episodeCount: number;
  episodes: Episode[];
  plexId: string;
}

interface TvShow {
  title: string;
  year: number;
  seasonCount: number;
  episodeCount: number;
  totalDuration: number;
  totalFileSize: number;
  seasons: Season[];
  plexId: string;
}

type SortField = 'title' | 'year' | 'seasonCount' | 'episodeCount' | 'totalFileSize';
type SortDirection = 'asc' | 'desc';

interface SortHeaderProps {
  field: SortField;
  children: React.ReactNode;
  currentSort: SortField;
  onSort: (field: SortField, direction: SortDirection) => void;
  currentDirection: SortDirection;
}

function SortHeader({ field, children, currentSort, currentDirection, onSort }: SortHeaderProps) {
  const isCurrent = currentSort === field;
  return (
    <TableHead 
      onClick={() => {
        if (isCurrent) {
          onSort(field, currentDirection === 'asc' ? 'desc' : 'asc');
        } else {
          onSort(field, 'asc');
        }
      }}
      className="cursor-pointer hover:bg-gray-100"
    >
      <div className="flex items-center">
        {children}
        {isCurrent && (
          currentDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </div>
    </TableHead>
  );
}

const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export default function TvPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [shows, setShows] = useState<TvShow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());
  const { totalShows, totalEpisodes, totalSize, isLoading: statsLoading } = useTvShowStats();

  const fetchShows = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tvshows');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched TV shows:', data);
      setShows(data);
    } catch (error) {
      console.error('Error fetching TV shows:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch TV shows: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncShows = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/tvshows/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'TV shows synced successfully',
        });
        await fetchShows();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync TV shows',
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
    
    fetchShows();
  }, [isAuthenticated, router]);

  const toggleShowExpansion = (plexId: string) => {
    const newExpanded = new Set(expandedShows);
    if (expandedShows.has(plexId)) {
      newExpanded.delete(plexId);
    } else {
      newExpanded.add(plexId);
    }
    setExpandedShows(newExpanded);
  };

  const getFilteredShows = () => {
    return shows
      .filter(show => 
        show.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        return a[sortField] > b[sortField] ? direction : -direction;
      });
  };

  const filteredShows = getFilteredShows();
  console.log('Filtered shows:', filteredShows);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm p-8">
          <LoadingSpinner />
          <p className="text-center text-gray-500 mt-4">Loading TV shows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">TV Show Collection</h1>
        <Button
          onClick={syncShows}
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
            placeholder="Search shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
          <span>{getFilteredShows().length} shows found</span>
          <span className="w-px h-4 bg-gray-300" />
          <span>{totalEpisodes} total episodes</span>
          <span className="w-px h-4 bg-gray-300" />
          <span>Total size: {totalSize}</span>
        </div>
      </div>

      {!isLoading && shows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No TV shows found. Try syncing with Plex using the button above.
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-8"></TableHead>
                <SortHeader 
                  field="title" 
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                >
                  Title
                </SortHeader>
                <SortHeader 
                  field="year" 
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                >
                  Year
                </SortHeader>
                <SortHeader 
                  field="seasonCount" 
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                >
                  Seasons
                </SortHeader>
                <SortHeader 
                  field="episodeCount" 
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                >
                  Episodes
                </SortHeader>
                <SortHeader 
                  field="totalFileSize" 
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                >
                  Size
                </SortHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredShows().map((show) => (
                <React.Fragment key={show.plexId}>
                  <TableRow 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleShowExpansion(show.plexId)}
                  >
                    <TableCell>
                      {expandedShows.has(show.plexId) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{decodeHtmlEntities(show.title)}</TableCell>
                    <TableCell className="text-center">{show.year}</TableCell>
                    <TableCell className="text-center">{show.seasonCount}</TableCell>
                    <TableCell className="text-center">{show.episodeCount}</TableCell>
                    <TableCell className="text-center">{formatFileSize(show.totalFileSize)}</TableCell>
                  </TableRow>
                  {expandedShows.has(show.plexId) && show.seasons.map((season) => (
                    <TableRow key={`${show.plexId}-${season.plexId}`} className="bg-gray-50">
                      <TableCell colSpan={6}>
                        <div className="pl-4 py-2">
                          <h3 className="font-medium mb-2">Season {season.seasonNumber}</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-2 py-1 text-left text-sm">Episode</th>
                                  <th className="px-2 py-1 text-left text-sm">Title</th>
                                  <th className="px-2 py-1 text-left text-sm">Size</th>
                                  <th className="px-2 py-1 text-left text-sm">Duration</th>
                                  <th className="px-2 py-1 text-left text-sm">Resolution</th>
                                  <th className="px-2 py-1 text-left text-sm">Video Codec</th>
                                </tr>
                              </thead>
                              <tbody>
                                {season.episodes.map((episode) => (
                                  <tr 
                                    key={episode.plexId}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-2 py-1 text-sm">{episode.episodeNumber}</td>
                                    <td className="px-2 py-1 text-sm">{decodeHtmlEntities(episode.title)}</td>
                                    <td className="px-2 py-1 text-sm">
                                      {formatFileSize(episode.fileSize)}
                                    </td>
                                    <td className="px-2 py-1 text-sm">
                                      {episode.duration} min
                                    </td>
                                    <td className="px-2 py-1 text-sm">{episode.resolution}</td>
                                    <td className="px-2 py-1 text-sm">{episode.videoCodec}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
