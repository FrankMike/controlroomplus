import { XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';

interface PlexConfig {
  url: string;
  token: string;
}

export class PlexAPI {
  private config: PlexConfig;
  private parser: XMLParser;

  constructor() {
    if (process.env.PLEX_URL && process.env.PLEX_TOKEN) {
      this.config = { url: process.env.PLEX_URL, token: process.env.PLEX_TOKEN };
    } else {
      throw new Error('PLEX_URL and PLEX_TOKEN must be set');
    }
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
  }

  private async fetch(endpoint: string) {
    const baseUrl = this.config.url.endsWith('/') ? this.config.url : `${this.config.url}/`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    console.log('Fetching Plex URL:', url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          'X-Plex-Token': this.config.token,
          'Accept': 'application/xml',
          'X-Plex-Client-Identifier': 'ControlRoom',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Plex API error: ${response.statusText} - ${text} (URL: ${url})`);
      }

      const xml = await response.text();
      return this.parser.parse(xml);
    } catch (error: any) {
      console.error('Fetch error:', error);
      throw new Error(`Failed to fetch from Plex: ${error.message}`);
    }
  }

  async getMovies(sectionId?: string) {
    if (!sectionId) {
      const sections = await this.fetch('library/sections');
      const movieSection = sections.MediaContainer.Directory.find(
        (section: any) => section.type === 'movie'
      );
      if (!movieSection) {
        throw new Error('No movie section found in Plex library');
      }
      sectionId = movieSection.key;
    }

    const moviesData = await this.fetch(`library/sections/${sectionId}/all`);
    const videos = moviesData.MediaContainer.Video;
    const movieList = Array.isArray(videos) ? videos : [videos];

    const detailedMovies = await Promise.all(
      movieList.map(async (movie: any) => {
        const metadata = await this.fetch(`library/metadata/${movie.ratingKey}`);
        const video = metadata.MediaContainer.Video;
        const media = Array.isArray(video.Media) ? video.Media[0] : video.Media;
        const part = media?.Part ? (Array.isArray(media.Part) ? media.Part[0] : media.Part) : null;

        const audioStreams = part?.Stream
          ?.filter((stream: any) => 
            stream.streamType === '2' && 
            ['eng', 'ita'].includes(stream.languageCode)
          )
          ?.map((stream: any) => ({
            language: stream.language || 'Unknown',
            codec: (stream.codec || 'Unknown').toUpperCase(),
            channels: parseInt(stream.channels) || 2,
          })) || [];

        const resolution = media?.videoResolution 
          ? (media.videoResolution === '1080' ? '1080p' : media.videoResolution.toUpperCase())
          : 'Unknown';

        return {
          title: video.title,
          titleWithYear: video.year ? `${video.title} (${video.year})` : video.title,
          year: parseInt(video.year) || null,
          duration: Math.round(parseInt(video.duration || '0') / 60000),
          durationFormatted: this.formatDuration(Math.round(parseInt(video.duration || '0') / 60000)),
          fileSize: parseInt(part?.size || '0'),
          resolution,
          dimensions: media ? `${media.width || '?'}x${media.height || '?'}` : 'Unknown',
          videoCodec: media?.videoCodec ? media.videoCodec.toUpperCase() : 'Unknown',
          audioStreams,
          plexId: video.ratingKey,
        };
      })
    );

    return detailedMovies;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}m`;
    }
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  async getTvShows() {
    try {
      // Get library sections
      const sections = await this.fetch('library/sections');
      const tvSection = sections.MediaContainer.Directory.find(
        (section: any) => section.type === 'show'
      );

      if (!tvSection) {
        throw new Error('No TV show section found in Plex library');
      }

      // Get all shows in the section
      const showsData = await this.fetch(`library/sections/${tvSection.key}/all`);
      const shows = showsData.MediaContainer.Directory;
      const showList = Array.isArray(shows) ? shows : [shows];

      // Process each show
      const processedShows = await Promise.all(
        showList.map(async (show: any) => {
          try {
            // Get seasons
            const seasonsData = await this.fetch(`library/metadata/${show.ratingKey}/children`);
            const seasons = seasonsData.MediaContainer.Directory;
            const seasonList = Array.isArray(seasons) ? seasons : [seasons];

            let totalEpisodes = 0;
            let totalFileSize = 0;
            let processedSeasons = [];

            for (const season of seasonList) {
              if (season.title === 'All episodes') continue;

              // Get episodes
              const episodesData = await this.fetch(`library/metadata/${season.ratingKey}/children`);
              const episodes = episodesData.MediaContainer.Video;
              const episodeList = Array.isArray(episodes) ? episodes : [episodes];

              const processedEpisodes = episodeList.map((episode: any) => {
                const media = Array.isArray(episode.Media) ? episode.Media[0] : episode.Media;
                const part = Array.isArray(media.Part) ? media.Part[0] : media.Part;
                const fileSize = parseInt(part?.size || '0');
                totalFileSize += fileSize;

                return {
                  title: episode.title,
                  seasonNumber: parseInt(season.index),
                  episodeNumber: parseInt(episode.index),
                  duration: Math.round(parseInt(episode.duration || '0') / 60000),
                  fileSize,
                  resolution: media.videoResolution === '1080' 
                    ? '1080p' 
                    : media.videoResolution?.toUpperCase(),
                  videoCodec: media.videoCodec?.toUpperCase(),
                  plexId: episode.ratingKey,
                };
              });

              totalEpisodes += processedEpisodes.length;
              processedSeasons.push({
                seasonNumber: parseInt(season.index),
                episodeCount: processedEpisodes.length,
                episodes: processedEpisodes,
                plexId: season.ratingKey,
              });
            }

            return {
              title: show.title,
              year: parseInt(show.year) || null,
              seasonCount: processedSeasons.length,
              episodeCount: totalEpisodes,
              totalDuration: Math.round(parseInt(show.duration || '0') / 60000),
              totalFileSize,
              seasons: processedSeasons,
              plexId: show.ratingKey,
            };
          } catch (error) {
            console.error(`Error processing show ${show.title}:`, error);
            return null;
          }
        })
      );

      return processedShows.filter(show => show !== null);
    } catch (error) {
      console.error('Error in getTvShows:', error);
      throw error;
    }
  }
}

export const plexApi = new PlexAPI(); 