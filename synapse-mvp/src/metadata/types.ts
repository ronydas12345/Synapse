export interface TrackCredits {
  songTitle: string;
  artist: string;
  album: string;
}

export type MetadataStatus = 'idle' | 'loading' | 'ready' | 'error';
