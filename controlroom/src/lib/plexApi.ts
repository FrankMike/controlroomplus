import { XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';

interface PlexConfig {
  url: string;
  token: string;
}

export class PlexAPI {
  private config: PlexConfig;
  private parser: XMLParser;

  constructor(config: PlexConfig) {
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
    // Get the movie library section if not provided
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

    // Get all movies in the section
    const moviesData = await this.fetch(`library/sections/${sectionId}/all`);
    const videos = moviesData.MediaContainer.Video;
    const movieList = Array.isArray(videos) ? videos : [videos];

    // Fetch detailed metadata for each movie
    const detailedMovies = await Promise.all(
      movieList.map(async (movie: any) => {
        const metadata = await this.fetch(`library/metadata/${movie.ratingKey}`);
        const video = metadata.MediaContainer.Video;
        const media = Array.isArray(video.Media) ? video.Media[0] : video.Media;
        const part = media?.Part ? (Array.isArray(media.Part) ? media.Part[0] : media.Part) : null;

        // Filter and format audio streams
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

        // Format video resolution with better fallbacks
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
}

export const plexApi = new PlexAPI({
  url: process.env.PLEX_URL || '',
  token: process.env.PLEX_TOKEN || '',
}); 